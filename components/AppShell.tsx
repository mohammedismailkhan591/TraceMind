"use client";

import Link from "next/link";

const nav: [string, string, string][] = [
  ["🏠", "Home", "/dashboard"],
  ["🔍", "Search", "/search"],
  ["➕", "Capture", "/capture"],
  ["🧠", "Memories", "/memories"],
  ["🕒", "Timeline", "/timeline"],
  ["🔔", "Reminders", "/reminders"],
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          Trace<span>Mind</span>
        </div>

        <nav>
          {nav.map(([icon, label, href]) => (
            <Link href={href as any} key={label} className="nav-item">
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="app-content">{children}</main>
    </div>
  );
}