"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import styles from "./AppShell.module.css";
import { createClient, isSupabaseConfigured } from "../lib/supabase";
import {
  type NotificationItem,
  type NotificationType,
  normalizeNotification,
  calculateUnreadCount,
  deduplicateNotifications,
  normalizeIsRead,
} from "../lib/notifications";

export type { NotificationItem, NotificationType };
export { normalizeIsRead, normalizeNotification, calculateUnreadCount };

type AppShellProps = {
  children: ReactNode;
};

type NavItem = {
  name: string;
  href: Route;
  icon: () => ReactElement;
};

const navigation: NavItem[] = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Search", href: "/search", icon: SearchIcon },
  { name: "Capture", href: "/capture", icon: CaptureIcon },
  { name: "Memories", href: "/memories", icon: MemoryIcon },
  { name: "Timeline", href: "/timeline", icon: TimelineIcon },
  { name: "Reminders", href: "/reminders", icon: ReminderIcon },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );

  const desktopNotificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = calculateUnreadCount(notifications);

  // Keep authentication state synchronized with Supabase.
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }

    const supabase = createClient();
    let active = true;

    const syncAuthState = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (!active) return;

        if (data.session) {
          setSignedIn(true);
          return;
        }

        const { data: userData } = await supabase.auth.getUser();

        if (active) {
          setSignedIn(Boolean(userData.user));
        }
      } catch {
        if (active) setSignedIn(false);
      }
    };

    void syncAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setSignedIn(Boolean(session?.user));
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Close menus when the user navigates to another page.
  useEffect(() => {
    setMoreOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  // Keep the browser notification permission status up to date.
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(window.Notification.permission);
  }, []);

  // Load notifications and listen for new records in Supabase.
  useEffect(() => {
    if (signedIn !== true || !isSupabaseConfigured()) {
      setNotifications([]);
      return;
    }

    const supabase = createClient();

    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      setNotificationsError(false);

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          if (active) {
            setNotifications([]);
            setNotificationsError(true);
          }
          return;
        }

        const userId = authData.user.id;

        const { data, error } = await supabase
          .from("notifications")
          .select(
            "id, title, message, type, link, is_read, created_at"
          )
          
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
         
        if (error) throw error;

        if (!active) return;

        const normalizedList = (data ?? []).map(normalizeNotification);
        setNotifications(deduplicateNotifications(normalizedList));
         
        channel = supabase
          .channel(`tracemind-notifications-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (!active) return;

              const incoming = normalizeNotification(payload.new);
              if (!incoming.id) return;

              setNotifications((current) => {
                if (current.some((item) => item.id === incoming.id)) {
                  return current.map((item) =>
                    item.id === incoming.id ? incoming : item
                  );
                }

                return [incoming, ...current].slice(0, 50);
              });

              // Show a browser alert when permission has already been granted.
              // This works while the page is open, not when the browser is closed.
              if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                window.Notification.permission === "granted"
              ) {
                try {
                  const browserNotification = new window.Notification(
                    incoming.title,
                    {
                      body: incoming.message,
                      tag: incoming.id,
                    }
                  );

                  browserNotification.onclick = () => {
                    window.focus();

                    if (incoming.link?.startsWith("/")) {
                      router.push(incoming.link as Route);
                    }

                    browserNotification.close();
                  };
                } catch (error) {
                  console.error(
                    "Unable to display browser notification:",
                    error
                  );
                }
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (!active) return;

              const updated = normalizeNotification(payload.new);
              if (!updated.id) return;

              setNotifications((current) => {
                if (!current.some((item) => item.id === updated.id)) {
                  return current;
                }

                return current.map((item) =>
                  item.id === updated.id ? updated : item
                );
              });
            }
          )
          .subscribe();
      } catch (error) {
        console.error("Unable to load TraceMind notifications:", error);

        if (active) {
          setNotificationsError(true);
        }
      } finally {
        if (active) {
          setNotificationsLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      active = false;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [signedIn, router]);

  // Close the notification dropdown when clicking outside it or pressing Escape.
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const insideDesktop =
        desktopNotificationRef.current?.contains(target) ?? false;
      const insideMobile =
        mobileNotificationRef.current?.contains(target) ?? false;

      if (!insideDesktop && !insideMobile) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const markAsRead = useCallback(
    async (notification: NotificationItem) => {
      if (notification.is_read) return;

      // Update the UI immediately.
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      );

      try {
        const supabase = createClient();

        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notification.id);

        if (error) throw error;
      } catch (error) {
        console.error("Unable to mark notification as read:", error);

        // Restore the unread state if the update fails.
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: false }
              : item
          )
        );
      }
    },
    []
  );

  const handleNotificationClick = async (
    notification: NotificationItem
  ) => {
    await markAsRead(notification);
    setNotificationsOpen(false);

    if (notification.link?.startsWith("/")) {
      router.push(notification.link as Route);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((item) => !item.is_read);

    if (unreadNotifications.length === 0) return;

    // Optimistically update the UI.
    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true }))
    );

    try {
      const supabase = createClient();

      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) throw new Error("User session not found.");

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", authData.user.id)
        .eq("is_read", false);

      if (error) throw error;
    } catch (error) {
      console.error("Unable to mark all notifications as read:", error);

      // Restore the previous state if the database update fails.
      const unreadIds = new Set(
        unreadNotifications.map((notification) => notification.id)
      );

      setNotifications((current) =>
        current.map((item) =>
          unreadIds.has(item.id) ? { ...item, is_read: false } : item
        )
      );
    }
  };

  const enableBrowserNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);
    } catch (error) {
      console.error("Unable to request notification permission:", error);
    }
  };

  const isAuthPage =
    [
      "/login",
      "/signup",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
    ].includes(pathname) || pathname.startsWith("/auth");

  const showMobileProfile = signedIn === true;

  if (isAuthPage) return <>{children}</>;

  const renderNotificationControl = (
    ref: React.RefObject<HTMLDivElement | null>
  ) => (
    <div className={styles.notificationWrap} ref={ref}>
      <button
        type="button"
        className={`${styles.notificationBell} ${
          notificationsOpen ? styles.notificationBellActive : ""
        }`}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={notificationsOpen}
        aria-haspopup="dialog"
        onClick={() => setNotificationsOpen((open) => !open)}
      >
        <BellIcon />

        {unreadCount > 0 && (
          <span className={styles.notificationBadge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {notificationsOpen && (
        <section
          className={styles.notificationPanel}
          role="dialog"
          aria-label="Your notifications"
        >
          <div className={styles.notificationHeader}>
            <div>
              <h2>Notifications</h2>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread ${
                      unreadCount === 1 ? "notification" : "notifications"
                    }`
                  : "You're all caught up"}
              </p>
            </div>

            <button
              type="button"
              className={styles.notificationClose}
              aria-label="Close notifications"
              onClick={() => setNotificationsOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          {signedIn !== true ? (
            <div className={styles.notificationEmpty}>
              <BellIcon />
              <strong>Sign in to see notifications</strong>
              <p>Your personal notifications will appear here.</p>
              <Link
                href="/login"
                className={styles.notificationAction}
                onClick={() => setNotificationsOpen(false)}
              >
                Log in
              </Link>
            </div>
          ) : (
            <>
              {unreadCount > 0 && (
                <div className={styles.notificationToolbar}>
                  <button type="button" onClick={() => void markAllAsRead()}>
                    Mark all as read
                  </button>
                </div>
              )}

              {notificationsLoading && notifications.length === 0 ? (
                <div className={styles.notificationStatus}>
                  Loading notifications…
                </div>
              ) : notificationsError && notifications.length === 0 ? (
                <div className={styles.notificationStatus}>
                  <p>We couldn't load your notifications.</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                  >
                    Try again
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className={styles.notificationEmpty}>
                  <span className={styles.notificationEmptyIcon}>
                    <BellIcon />
                  </span>
                  <strong>No notifications yet</strong>
                  <p>
                    Updates and reminders will appear here when they're
                    created.
                  </p>
                </div>
              ) : (
                <div className={styles.notificationList}>
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={`${styles.notificationItem} ${
                        !notification.is_read
                          ? styles.notificationUnread
                          : ""
                      }`}
                      onClick={() =>
                        void handleNotificationClick(notification)
                      }
                    >
                      <span
                        className={`${styles.notificationTypeIcon} ${
                          styles[`type_${notification.type}`]
                        }`}
                      >
                        {notification.type === "deadline" ? (
                          <ReminderIcon />
                        ) : notification.type === "success" ? (
                          <CheckIcon />
                        ) : notification.type === "warning" ? (
                          <WarningIcon />
                        ) : (
                          <InfoIcon />
                        )}
                      </span>

                      <span className={styles.notificationCopy}>
                        <span className={styles.notificationItemTitle}>
                          {notification.title}
                          {!notification.is_read && (
                            <span className={styles.notificationUnreadDot} />
                          )}
                        </span>

                        <span className={styles.notificationMessage}>
                          {notification.message}
                        </span>

                        <span className={styles.notificationTime}>
                          {formatNotificationDate(notification.created_at)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.notificationFooter}>
                {permission === "default" ? (
                  <button
                    type="button"
                    onClick={() => void enableBrowserNotifications()}
                  >
                    <BellIcon />
                    Enable browser alerts
                  </button>
                ) : permission === "granted" ? (
                  <span>
                    <CheckIcon />
                    Browser alerts enabled
                  </span>
                ) : permission === "denied" ? (
                  <span>Browser alerts are blocked in your browser settings.</span>
                ) : (
                  <span>Browser alerts aren't supported in this browser.</span>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Main navigation">
        <Link href="/" className={styles.brand} aria-label="TraceMind home">
          <div className={styles.brandMark}>T</div>
          <div className={styles.brandText}>
            <strong>TraceMind</strong>
            <span>Your memory workspace</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>WORKSPACE</div>

          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${
                  active ? styles.active : ""
                }`}
              >
                <Icon />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarBottom}>
          {signedIn === false ? (
            <div className={styles.authActions}>
              <Link href="/login" className={styles.loginButton}>
                Log in
              </Link>
              <Link href="/signup" className={styles.signupButton}>
                Create account
              </Link>
            </div>
          ) : (
            <Link href="/settings" className={styles.profileLink}>
              <div className={styles.profileIcon}>
                <UserIcon />
              </div>
              <div className={styles.profileText}>
                <strong>Settings</strong>
                <span>Account &amp; preferences</span>
              </div>
            </Link>
          )}
        </div>
      </aside>

      {/* Desktop notification control */}
      <div className={styles.desktopNotificationArea}>
        {renderNotificationControl(desktopNotificationRef)}
      </div>

      <header className={styles.mobileHeader}>
        <Link href="/" className={styles.mobileBrand} aria-label="TraceMind home">
          <span className={styles.mobileBrandMark}>T</span>
          <span className={styles.mobileBrandText}>
            TraceMind
            <span>Your memory, found.</span>
          </span>
        </Link>

        <div className={styles.mobileHeaderActions}>
          {renderNotificationControl(mobileNotificationRef)}

          <Link
            href="/capture"
            className={styles.mobileQuickCapture}
            aria-label="Capture new information"
          >
            <CaptureIcon />
            <span>Capture</span>
          </Link>
        </div>
      </header>

      <main className={styles.content}>{children}</main>

      <nav
        className={`${styles.mobileNav} ${
          showMobileProfile
            ? styles.mobileNavSignedIn
            : styles.mobileNavSignedOut
        }`}
        aria-label="Mobile navigation"
      >
        <Link
          href="/"
          className={`${styles.mobileNavItem} ${
            pathname === "/" ? styles.mobileNavActive : ""
          }`}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <HomeIcon />
          <span>Home</span>
        </Link>

        <Link
          href="/search"
          className={`${styles.mobileNavItem} ${
            pathname.startsWith("/search") ? styles.mobileNavActive : ""
          }`}
          aria-current={pathname.startsWith("/search") ? "page" : undefined}
        >
          <SearchIcon />
          <span>Search</span>
        </Link>

        <Link
          href="/capture"
          className={`${styles.mobileCaptureItem} ${
            pathname.startsWith("/capture") ? styles.mobileNavActive : ""
          }`}
          aria-current={pathname.startsWith("/capture") ? "page" : undefined}
        >
          <span className={styles.mobileCaptureIcon}>
            <CaptureIcon />
          </span>
          <span>Capture</span>
        </Link>

        <Link
          href="/memories"
          className={`${styles.mobileNavItem} ${
            pathname.startsWith("/memories") ? styles.mobileNavActive : ""
          }`}
          aria-current={pathname.startsWith("/memories") ? "page" : undefined}
        >
          <MemoryIcon />
          <span>Memories</span>
        </Link>

        {showMobileProfile && (
          <Link
            href="/settings"
            className={`${styles.mobileNavItem} ${
              pathname.startsWith("/settings") ? styles.mobileNavActive : ""
            }`}
            aria-current={
              pathname.startsWith("/settings") ? "page" : undefined
            }
          >
            <UserIcon />
            <span>Settings</span>
          </Link>
        )}

        <div className={styles.mobileMoreWrap}>
          <button
            type="button"
            className={`${styles.mobileNavItem} ${
              moreOpen ||
              pathname.startsWith("/timeline") ||
              pathname.startsWith("/reminders") ||
              pathname.startsWith("/settings")
                ? styles.mobileNavActive
                : ""
            }`}
            aria-expanded={moreOpen}
            aria-haspopup="true"
            onClick={() => setMoreOpen((open) => !open)}
          >
            <MoreIcon />
            <span>More</span>
          </button>

          {moreOpen && (
            <div className={styles.mobileMoreMenu} role="menu">
              <Link href="/timeline" role="menuitem">
                <TimelineIcon />
                <span>Timeline</span>
              </Link>

              <Link href="/reminders" role="menuitem">
                <ReminderIcon />
                <span>Reminders</span>
              </Link>

              {signedIn === false ? (
                <>
                  <Link href="/login" role="menuitem">
                    <UserIcon />
                    <span>Log in</span>
                  </Link>
                  <Link href="/signup" role="menuitem">
                    <CaptureIcon />
                    <span>Create account</span>
                  </Link>
                </>
              ) : (
                <Link href="/settings" role="menuitem">
                  <UserIcon />
                  <span>Settings</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const elapsed = Date.now() - date.getTime();

  if (elapsed < 60_000) return "Just now";
  if (elapsed < 3_600_000) {
    return `${Math.floor(elapsed / 60_000)}m ago`;
  }
  if (elapsed < 86_400_000) {
    return `${Math.floor(elapsed / 3_600_000)}h ago`;
  }
  if (elapsed < 604_800_000) {
    return `${Math.floor(elapsed / 86_400_000)}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  });
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 10.5 12 3.8l8.5 6.7" />
      <path d="M5.5 9.5v10h13v-10" />
      <path d="M9.5 19.5v-5.5h5v5.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.6" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function CaptureIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5v14M5 7h5M5 12h9M5 17h13" />
      <circle cx="5" cy="5" r="1.4" />
      <circle cx="10" cy="7" r="1.4" />
      <circle cx="14" cy="12" r="1.4" />
      <circle cx="18" cy="17" r="1.4" />
    </svg>
  );
}

function ReminderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9a6 6 0 0 1 12 0c0 6 2 6 2 7H4c0-1 2-1 2-7" />
      <path d="M10 20h4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.7-3.4 2.8-5.2 6.5-5.2s5.8 1.8 6.5 5.2" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 22 20H2L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7h.01" />
    </svg>
  );
}