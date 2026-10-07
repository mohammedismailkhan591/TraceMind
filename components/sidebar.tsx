"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
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
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    label: "Memories",
    href: "/memories",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    label: "Timeline",
    href: "/timeline",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4v16M6 7h7M6 17h9" />
        <circle cx="17" cy="7" r="2" />
        <circle cx="19" cy="17" r="2" />
      </svg>
    ),
  },
  {
    label: "Reminders",
    href: "/reminders",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8" />
        <path d="M10 21h4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const active = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <aside className="tm-sidebar">
      <div className="tm-brand">
        <div className="tm-brand-mark">T</div>
        <div className="tm-brand-name">Trace<span>Mind</span></div>
      </div>

      <div className="tm-nav-label">WORKSPACE</div>

      <nav className="tm-nav" aria-label="Main navigation">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`tm-nav-item ${active(item.href) ? "is-active" : ""}`}
            aria-current={active(item.href) ? "page" : undefined}
            title={item.label}
          >
            <span className="tm-nav-icon">{item.icon}</span>
            <span className="tm-nav-text">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="tm-sidebar-spacer" />

      <Link
        href="/profile"
        className={`tm-profile ${active("/profile") ? "is-active" : ""}`}
        title="Profile & settings"
      >
        <div className="tm-profile-avatar">M</div>
        <div className="tm-profile-copy">
          <strong>My Account</strong>
          <span>Profile & settings</span>
        </div>
        <svg className="tm-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>

      <div className="tm-sidebar-foot">TRACEMIND · PRIVATE BY DESIGN</div>

      <style jsx global>{`
        .tm-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          width: 248px;
          padding: 22px 14px 14px;
          background:
            radial-gradient(circle at 0 0, rgba(23, 25, 30, 0.035), transparent 34%),
            #fff;
          border-right: 1px solid #e8e9ec;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          box-sizing: border-box;
        }

        .tm-brand {
          height: 46px;
          padding: 0 10px;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .tm-brand-mark {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #17191e;
          color: #fff;
          font-size: 15px;
          font-weight: 850;
          letter-spacing: -0.04em;
          box-shadow: 0 7px 18px rgba(23, 25, 30, 0.14);
        }

        .tm-brand-name {
          color: #17191e;
          font-size: 18px;
          font-weight: 780;
          letter-spacing: -0.045em;
        }

        .tm-brand-name span {
          font-weight: 500;
          color: #777b83;
        }

        .tm-nav-label {
          margin: 40px 12px 10px;
          color: #a0a3aa;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .tm-nav {
          display: grid;
          gap: 4px;
        }

        .tm-nav-item {
          position: relative;
          height: 46px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px;
          border-radius: 12px;
          color: #747880;
          text-decoration: none;
          font-size: 13px;
          font-weight: 650;
          transition: color .18s ease, background .18s ease, transform .18s ease;
        }

        .tm-nav-item:hover {
          background: #f5f6f7;
          color: #17191e;
        }

        .tm-nav-item.is-active {
          background: #17191e;
          color: #fff;
          box-shadow: 0 8px 20px rgba(23, 25, 30, 0.12);
        }

        .tm-nav-item.is-active::before {
          content: "";
          position: absolute;
          left: -14px;
          width: 3px;
          height: 22px;
          border-radius: 0 4px 4px 0;
          background: #17191e;
        }

        .tm-nav-icon {
          width: 21px;
          height: 21px;
          flex: 0 0 21px;
          display: grid;
          place-items: center;
        }

        .tm-nav-icon svg {
          width: 19px;
          height: 19px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.75;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .tm-sidebar-spacer {
          flex: 1;
          min-height: 28px;
        }

        .tm-profile {
          min-height: 60px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid transparent;
          border-radius: 13px;
          color: #17191e;
          text-decoration: none;
          transition: background .18s ease, border-color .18s ease;
        }

        .tm-profile:hover,
        .tm-profile.is-active {
          background: #f6f7f8;
          border-color: #e8e9ec;
        }

        .tm-profile-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #eceef1;
          color: #17191e;
          font-size: 12px;
          font-weight: 800;
        }

        .tm-profile-copy {
          min-width: 0;
          flex: 1;
        }

        .tm-profile-copy strong,
        .tm-profile-copy span {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tm-profile-copy strong {
          font-size: 11px;
          font-weight: 750;
        }

        .tm-profile-copy span {
          margin-top: 3px;
          color: #9a9da4;
          font-size: 9px;
        }

        .tm-chevron {
          width: 15px;
          height: 15px;
          fill: none;
          stroke: #a0a3aa;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .tm-sidebar-foot {
          padding: 10px 9px 2px;
          color: #b0b3b9;
          font-size: 7px;
          font-weight: 750;
          letter-spacing: .08em;
        }

        @media (max-width: 900px) {
          .tm-sidebar {
            width: 78px;
            padding: 20px 9px 12px;
          }

          .tm-brand {
            justify-content: center;
            padding: 0;
          }

          .tm-brand-name,
          .tm-nav-label,
          .tm-nav-text,
          .tm-profile-copy,
          .tm-chevron,
          .tm-sidebar-foot {
            display: none;
          }

          .tm-nav {
            margin-top: 34px;
            gap: 7px;
          }

          .tm-nav-item {
            width: 58px;
            height: 50px;
            justify-content: center;
            padding: 0;
            margin: 0 auto;
          }

          .tm-nav-item.is-active::before {
            left: -9px;
          }

          .tm-nav-icon,
          .tm-nav-icon svg {
            width: 20px;
            height: 20px;
          }

          .tm-profile {
            width: 58px;
            height: 58px;
            min-height: 58px;
            justify-content: center;
            padding: 0;
            margin: 0 auto;
          }

          .tm-profile-avatar {
            width: 36px;
            height: 36px;
          }
        }

        @media (max-width: 520px) {
          .tm-sidebar {
            width: 66px;
            padding-left: 6px;
            padding-right: 6px;
          }

          .tm-brand-mark {
            width: 34px;
            height: 34px;
          }

          .tm-nav-item {
            width: 50px;
            height: 48px;
          }

          .tm-nav-item.is-active::before {
            left: -6px;
          }

          .tm-profile {
            width: 50px;
            height: 52px;
          }
        }
      `}</style>
    </aside>
  );
}
