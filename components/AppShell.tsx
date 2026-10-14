"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import styles from "./AppShell.module.css";
import { createClient, isSupabaseConfigured } from "../lib/supabase";

type AppShellProps = { children: ReactNode };
type NavItem = { name: string; href: Route; icon: () => ReactElement };

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
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }

    const supabase = createClient();

    let active = true;

    const syncAuthState = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();

        if (active) {
          if (sessionData.session) {
            setSignedIn(true);
            return;
          }
        }

        const { data: userData } = await supabase.auth.getUser();

        if (active) {
          setSignedIn(Boolean(userData.user));
        }
      } catch {
        if (active) {
          setSignedIn(false);
        }
      }
    };

    syncAuthState();

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: { user?: unknown } | null) => {
      if (active) setSignedIn(Boolean(session?.user));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => { setMoreOpen(false); }, [pathname]);

const isAuthPage = [
  "/login",
  "/signup",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
].includes(pathname) || pathname.startsWith("/auth");
  const showMobileProfile = signedIn === true;
  if (isAuthPage) return <>{children}</>;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Main navigation">
        <Link href="/" className={styles.brand} aria-label="TraceMind home">
          <div className={styles.brandMark}>T</div>
          <div className={styles.brandText}><strong>TraceMind</strong><span>Your memory workspace</span></div>
        </Link>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>WORKSPACE</div>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.active : ""}`}><Icon /><span>{item.name}</span></Link>;
          })}
        </nav>

        <div className={styles.sidebarBottom}>
          {signedIn === false ? (
            <div className={styles.authActions}>
              <Link href="/login" className={styles.loginButton}>Log in</Link>
              <Link href="/signup" className={styles.signupButton}>Create account</Link>
            </div>
          ) : (
            <Link href="/settings" className={styles.profileLink}>
              <div className={styles.profileIcon}><UserIcon /></div>
              <div className={styles.profileText}><strong>Settings</strong><span>Account & preferences</span></div>
            </Link>
          )}
        </div>
      </aside>
      <header className={styles.mobileHeader}>
        <Link href="/" className={styles.mobileBrand} aria-label="TraceMind home">
          <span className={styles.mobileBrandMark}>T</span>
          <span className={styles.mobileBrandText}>TraceMind<span>Your memory, found.</span></span>
        </Link>
        <Link href="/capture" className={styles.mobileQuickCapture} aria-label="Capture new information">
          <CaptureIcon /><span>Capture</span>
        </Link>
      </header>

      <main className={styles.content}>{children}</main>

      <nav className={`${styles.mobileNav} ${showMobileProfile ? styles.mobileNavSignedIn : styles.mobileNavSignedOut}`} aria-label="Mobile navigation">
        <Link href="/" className={`${styles.mobileNavItem} ${pathname === "/" ? styles.mobileNavActive : ""}`} aria-current={pathname === "/" ? "page" : undefined}>
          <HomeIcon /><span>Home</span>
        </Link>
        <Link href="/search" className={`${styles.mobileNavItem} ${pathname.startsWith("/search") ? styles.mobileNavActive : ""}`} aria-current={pathname.startsWith("/search") ? "page" : undefined}>
          <SearchIcon /><span>Search</span>
        </Link>
        <Link href="/capture" className={`${styles.mobileCaptureItem} ${pathname.startsWith("/capture") ? styles.mobileNavActive : ""}`} aria-current={pathname.startsWith("/capture") ? "page" : undefined}>
          <span className={styles.mobileCaptureIcon}><CaptureIcon /></span><span>Capture</span>
        </Link>
        <Link href="/memories" className={`${styles.mobileNavItem} ${pathname.startsWith("/memories") ? styles.mobileNavActive : ""}`} aria-current={pathname.startsWith("/memories") ? "page" : undefined}>
          <MemoryIcon /><span>Memories</span>
        </Link>
        {showMobileProfile && (
          <Link href="/settings" className={`${styles.mobileNavItem} ${pathname.startsWith("/settings") ? styles.mobileNavActive : ""}`} aria-current={pathname.startsWith("/settings") ? "page" : undefined}>
            <UserIcon /><span>Settings</span>
          </Link>
        )}
        <div className={styles.mobileMoreWrap}>
          <button type="button" className={`${styles.mobileNavItem} ${moreOpen || pathname.startsWith("/timeline") || pathname.startsWith("/reminders") || pathname.startsWith("/settings") ? styles.mobileNavActive : ""}`} aria-expanded={moreOpen} aria-haspopup="true" onClick={() => setMoreOpen((open) => !open)}>
            <MoreIcon /><span>More</span>
          </button>
          {moreOpen && <div className={styles.mobileMoreMenu} role="menu">
            <Link href="/timeline" role="menuitem"><TimelineIcon /><span>Timeline</span></Link>
            <Link href="/reminders" role="menuitem"><ReminderIcon /><span>Reminders</span></Link>
            {signedIn === false ? <>
              <Link href="/login" role="menuitem"><UserIcon /><span>Log in</span></Link>
              <Link href="/signup" role="menuitem"><CaptureIcon /><span>Create account</span></Link>
            </> : <Link href="/settings" role="menuitem"><UserIcon /><span>Settings</span></Link>}
          </div>}
        </div>
      </nav>
    </div>
  );
}

function HomeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3.8l8.5 6.7"/><path d="M5.5 9.5v10h13v-10"/><path d="M9.5 19.5v-5.5h5v5.5"/></svg>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 5 5"/></svg>; }
function CaptureIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>; }
function MemoryIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5"/></svg>; }
function TimelineIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v14M5 7h5M5 12h9M5 17h13"/><circle cx="5" cy="5" r="1.4"/><circle cx="10" cy="7" r="1.4"/><circle cx="14" cy="12" r="1.4"/><circle cx="18" cy="17" r="1.4"/></svg>; }
function ReminderIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6 2 6 2 7H4c0-1 2-1 2-7"/><path d="M10 20h4"/></svg>; }
function UserIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.7-3.4 2.8-5.2 6.5-5.2s5.8 1.8 6.5 5.2"/></svg>; }

function MoreIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>; }
