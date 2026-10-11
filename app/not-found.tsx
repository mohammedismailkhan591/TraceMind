import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: "2rem",
      background: "#f5f7fb",
      color: "#111827",
      fontFamily: "Arial, sans-serif",
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
        background: "#ffffff",
        borderRadius: "18px",
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
        padding: "2rem",
      }}>
        <h1 style={{ margin: "0 0 0.75rem", fontSize: "2.5rem" }}>404</h1>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem" }}>Page not found</h2>
        <p style={{ margin: "0 0 1.5rem", color: "#4b5563", lineHeight: 1.6 }}>
          The page you’re looking for doesn’t exist or may have moved.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "0.8rem 1.2rem",
            borderRadius: "999px",
            background: "#111827",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
