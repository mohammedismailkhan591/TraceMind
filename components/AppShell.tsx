"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Capture",
    href: "/capture",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    label: "Memories",
    href: "/memories",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    ),
  },
  {
    label: "Timeline",
    href: "/timeline",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M6 4v16" />
        <path d="M6 7h8" />
        <path d="M6 12h11" />
        <path d="M6 17h6" />
        <circle cx="17" cy="7" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
        <circle cx="14" cy="17" r="1.5" />
      </svg>
    ),
  },
  {
    label: "Reminders",
    href: "/reminders",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    ),
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const active = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="tm-app">
      <aside className="tm-sidebar">
        <Link href="/dashboard" className="tm-brand">
          <div className="tm-brand-mark">T</div>

          <div className="tm-brand-text">
            <strong>TraceMind</strong>
            <span>Memory engine</span>
          </div>
        </Link>

        <div className="tm-nav-label">WORKSPACE</div>

        <nav className="tm-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`tm-nav-item ${
                active(item.href) ? "tm-nav-active" : ""
              }`}
              title={item.label}
            >
              <span className="tm-nav-icon">{item.icon}</span>
              <span className="tm-nav-name">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="tm-sidebar-bottom">
          <Link
            href="/profile"
            className={`tm-profile-link ${
              pathname.startsWith("/profile") ? "tm-profile-active" : ""
            }`}
          >
            <div className="tm-profile-avatar">M</div>

            <div className="tm-profile-text">
              <strong>My Account</strong>
              <span>Profile & settings</span>
            </div>

            <svg viewBox="0 0 24 24" className="tm-chevron">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </aside>

      <main className="tm-main">{children}</main>

      <style jsx global>{`
        .tm-app {
          min-height: 100vh;
          background: #f6f7f9;
        }

        .tm-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          width: 248px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          padding: 24px 16px 18px;
          background: rgba(255, 255, 255, 0.96);
          border-right: 1px solid #e8e9ec;
          backdrop-filter: blur(20px);
        }

        .tm-main {
          min-height: 100vh;
          margin-left: 248px;
        }

        .tm-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 4px 10px;
          text-decoration: none;
          color: #15171b;
        }

        .tm-brand-mark {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #17191e;
          color: white;
          font-size: 17px;
          font-weight: 800;
          box-shadow: 0 7px 18px rgba(23, 25, 30, 0.16);
        }

        .tm-brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tm-brand-text strong {
          font-size: 16px;
          letter-spacing: -0.4px;
        }

        .tm-brand-text span {
          font-size: 10px;
          color: #999da5;
          font-weight: 600;
        }

        .tm-nav-label {
          margin: 48px 12px 11px;
          font-size: 9px;
          letter-spacing: 0.16em;
          font-weight: 800;
          color: #a4a7ae;
        }

        .tm-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .tm-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 13px;
          height: 45px;
          padding: 0 13px;
          border-radius: 12px;
          color: #777b83;
          text-decoration: none;
          font-size: 13px;
          font-weight: 650;
          transition:
            background 0.18s ease,
            color 0.18s ease,
            transform 0.18s ease;
        }

        .tm-nav-item:hover {
          background: #f2f3f5;
          color: #17191e;
          transform: translateX(2px);
        }

        .tm-nav-active {
          background: #17191e;
          color: #fff;
          box-shadow: 0 8px 20px rgba(23, 25, 30, 0.12);
        }

        .tm-nav-active:hover {
          background: #17191e;
          color: white;
        }

        .tm-nav-icon {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          flex: 0 0 20px;
        }

        .tm-nav-icon svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .tm-sidebar-bottom {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid #ececef;
        }

        .tm-profile-link {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding: 9px;
          border-radius: 12px;
          text-decoration: none;
          color: #17191e;
          transition: background 0.18s ease;
        }

        .tm-profile-link:hover,
        .tm-profile-active {
          background: #f3f4f6;
        }

        .tm-profile-avatar {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #eceef1;
          color: #17191e;
          font-size: 12px;
          font-weight: 800;
        }

        .tm-profile-text {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tm-profile-text strong {
          font-size: 11px;
          white-space: nowrap;
        }

        .tm-profile-text span {
          font-size: 9px;
          color: #999ca3;
          white-space: nowrap;
        }

        .tm-chevron {
          width: 15px;
          height: 15px;
          margin-left: auto;
          fill: none;
          stroke: #a0a3aa;
          stroke-width: 1.8;
        }

        @media (max-width: 900px) {
          .tm-sidebar {
            width: 76px;
            padding: 22px 9px 16px;
            align-items: center;
          }

          .tm-main {
            margin-left: 76px;
          }

          .tm-brand {
            padding: 0;
          }

          .tm-brand-text,
          .tm-nav-label,
          .tm-nav-name,
          .tm-profile-text,
          .tm-chevron {
            display: none;
          }

          .tm-nav {
            width: 100%;
            margin-top: 45px;
          }

          .tm-nav-item {
            width: 54px;
            height: 48px;
            margin: 0 auto;
            justify-content: center;
            padding: 0;
          }

          .tm-nav-icon {
            width: 21px;
            height: 21px;
          }

          .tm-nav-icon svg {
            width: 20px;
            height: 20px;
          }

          .tm-sidebar-bottom {
            width: 100%;
          }

          .tm-profile-link {
            justify-content: center;
            padding: 8px 0;
          }
        }

        @media (max-width: 600px) {
          .tm-sidebar {
            width: 66px;
            padding-left: 7px;
            padding-right: 7px;
          }

          .tm-main {
            margin-left: 66px;
          }

          .tm-brand-mark {
            width: 36px;
            height: 36px;
          }

          .tm-nav-item {
            width: 50px;
          }
        }
      `}</style>
    </div>
  );
}