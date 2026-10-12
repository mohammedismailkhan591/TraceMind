import type { ReactNode } from "react";
import "./globals.css";
import AppShell from "../components/AppShell";
import WelcomeSplash from "../components/WelcomeSplash";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WelcomeSplash>
          <AppShell>{children}</AppShell>
        </WelcomeSplash>
      </body>
    </html>
  );
} 