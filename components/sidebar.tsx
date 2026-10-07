
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(path);
  };

  return (
    <aside className="tm-sidebar">
      {/* LOGO */}
      <div className="tm-sidebar-logo">
        <div className="tm-logo-mark">T</div>
        <span>TraceMind</span>
      </div>

      {/* WORKSPACE */}
      <div className="tm-workspace-label">WORKSPACE</div>

      {/* NAVIGATION */}
      <nav className="tm-sidebar-nav">
        {/* HOME */}
        <Link
          href="/dashboard"
          className={`tm-nav-link ${
            isActive("/dashboard") ? "tm-active" : ""
          }`}
        >
          <span className="tm-nav-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5.5 9.5V21h13V9.5" />
              <path d="M9.5 21v-6h5v6" />
            </svg>
          </span>
          <span>Home</span>
        </Link>

        {/* CAPTURE */}
        <Link
          href="/capture"
          className={`tm-nav-link ${
            isActive("/capture") ? "tm-active" : ""
          }`}
        >
          <span className="tm-nav-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </span>
          <span>Capture</span>
        </Link>

        {/* MEMORIES */}
        <Link
          href="/memories"
          className={`tm-nav-link ${
            isActive("/memories") ? "tm-active" : ""
          }`}
        >
          <span className="tm-nav-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 8h8" />
              <path d="M8 12h8" />
              <path d="M8 16h5" />
            </svg>
          </span>
          <span>Memories</span>
        </Link>

        {/* TIMELINE */}
        <Link
          href="/Timeline"
          className={`tm-nav-link ${
            isActive("/Timeline") ? "tm-active" : ""
          }`}
        >
          <span className="tm-nav-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5v14" />
              <path d="M5 8h7" />
              <path d="M5 16h10" />
              <circle cx="16" cy="8" r="2" />
              <circle cx="18" cy="16" r="2" />
            </svg>
          </span>
          <span>Timeline</span>
        </Link>

        {/* REMINDERS */}
        <Link
          href="/reminders"
          className={`tm-nav-link ${
            isActive("/reminders") ? "tm-active" : ""
          }`}
        >
          <span className="tm-nav-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <span>Reminders</span>
        </Link>
      </nav>

      {/* ACCOUNT */}
      <Link href="/profile" className="tm-account">
        <div className="tm-avatar">M</div>

        <div className="tm-account-info">
          <strong>My Account</strong>
          <small>Profile &amp; settings</small>
        </div>
      </Link>

      <style jsx global>{`
        .tm-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 238px;
          height: 100vh;
          background: #fff;
          border-right: 1px solid #e7e8eb;
          display: flex;
          flex-direction: column;
          padding: 28px 18px 20px;
          z-index: 9999;
          box-sizing: border-box;
        }

        .tm-sidebar-logo {
          width: 100%;
          height: 34px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px;
          box-sizing: border-box;
          color: #17191e;
          font-size: 18px;
          font-weight: 750;
          letter-spacing: -0.4px;
        }

        .tm-logo-mark {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: #17191e;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
        }

        .tm-workspace-label {
          margin: 48px 12px 13px;
          color: #a1a4aa;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.5px;
          line-height: 1;
        }

        .tm-sidebar-nav {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 5px;
          position: relative;
          z-index: 2;
        }

        .tm-nav-link {
          width: 100%;
          height: 43px;
          min-height: 43px;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 0 13px;
          border-radius: 11px;
          box-sizing: border-box;
          color: #777b83;
          background: transparent;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          line-height: 1;
          transition:
            background 0.18s ease,
            color 0.18s ease;
          position: relative;
          z-index: 3;
        }

        .tm-nav-link:hover {
          background: #f4f5f7;
          color: #17191e;
        }

        .tm-nav-link.tm-active {
          background: #17191e;
          color: #fff;
        }

        .tm-nav-icon {
          width: 20px;
          min-width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
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

        .tm-account {
          width: 100%;
          min-height: 56px;
          margin-top: auto;
          padding: 18px 11px 0;
          border-top: 1px solid #ececef;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #17191e;
          text-decoration: none;
        }

        .tm-avatar {
          width: 35px;
          height: 35px;
          min-width: 35px;
          border-radius: 50%;
          background: #eceef1;
          display: grid;
          place-items: center;
          color: #17191e;
          font-size: 13px;
          font-weight: 700;
        }

        .tm-account-info {
          min-width: 0;
          overflow: hidden;
        }

        .tm-account-info strong {
          display: block;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
        }

        .tm-account-info small {
          display: block;
          margin-top: 3px;
          color: #999ca2;
          font-size: 10px;
          line-height: 1.2;
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .tm-sidebar {
            width: 76px;
            padding: 28px 10px 20px;
          }

          .tm-sidebar-logo {
            justify-content: center;
            padding: 0;
          }

          .tm-sidebar-logo > span {
            display: none;
          }

          .tm-workspace-label {
            display: none;
          }

          .tm-sidebar-nav {
            margin-top: 42px;
          }

          .tm-nav-link {
            width: 56px;
            height: 46px;
            min-height: 46px;
            margin: 0 auto;
            padding: 0;
            justify-content: center;
            gap: 0;
          }

          .tm-nav-link > span:last-child {
            display: none;
          }

          .tm-nav-icon {
            width: auto;
            min-width: 0;
          }

          .tm-nav-icon svg {
            width: 19px;
            height: 19px;
          }

          .tm-account {
            width: 56px;
            margin-left: auto;
            margin-right: auto;
            padding: 18px 0 0;
            justify-content: center;
          }

          .tm-account-info {
            display: none;
          }
        }

        @media (max-width: 650px) {
          .tm-sidebar {
            width: 68px;
            padding-left: 7px;
            padding-right: 7px;
          }

          .tm-nav-link {
            width: 52px;
          }

          .tm-account {
            width: 52px;
          }
        }
      `}</style>
    </aside>
  );
}

