// @ts-expect-error - CSS imports are handled by the Next.js bundler and are not included in the TypeScript type declarations in this setup.
import "./globals.css";

export const metadata = {
  title: "TraceMind — Your personal information memory",
  description: "Capture it. Understand it. Find it later."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
