"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "../../components/Logo";
import { createClient, isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
  setLoading(false);
  setMessage(error.message);
  return;
}

// Navigate only after Supabase confirms login succeeded.
window.location.href = "/dashboard";
    
  };

  const handleGoogleLogin = async () => {
    setMessage("");
    if (!isSupabaseConfigured()) {
      setMessage(SUPABASE_SETUP_MESSAGE);
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
    }
  };

  return (
    <main className="auth-page">

      {/* LEFT SIDE */}
      <section className="auth-visual">
        <Logo />

        <div className="auth-visual-content">
          <h1>
            Find what you
            <br />
            thought you lost.
          </h1>

          <p>
            TraceMind helps you save, understand and find
            information whenever you need it.
          </p>

          <div className="auth-points">
            <div>📸 Screenshots & PDFs</div>
            <div>🔗 Links & text</div>
            <div>🎙 Voice notes</div>
          </div>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="auth-card">
        <div className="auth-form">

          <Logo />

          <h1>Welcome back</h1>

          <p className="muted">
            Log in to continue to your TraceMind memories.
          </p>

          {/* GOOGLE */}
          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.95h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.25z"
              />

              <path
                fill="#34A853"
                d="M12 21.99c2.63 0 4.84-.87 6.45-2.47l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.99z"
              />

              <path
                fill="#FBBC05"
                d="M6.54 13.97A5.86 5.86 0 0 1 6.23 12c0-.68.12-1.34.31-1.97V7.5H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.5l3.24-2.53z"
              />

              <path
                fill="#EA4335"
                d="M12 5.99c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.04 14.63 2 12 2a9.74 9.74 0 0 0-8.7 5.5l3.24 2.53C7.31 7.71 9.46 5.99 12 5.99z"
              />
            </svg>

            <span>Continue with Google</span>
          </button>

          <div className="divider">
            <span>OR USE EMAIL</span>
          </div>

          {/* EMAIL */}
          <form onSubmit={handleLogin}>

            <label className="label">
              Email
            </label>

            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <label className="label">
              Password
            </label>

            <input
              className="input"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <div className="forgot-row">
              <a
                href="/forgot-password"
                className="auth-link"
              >
                Forgot password?
              </a>
            </div>

            <button
              className="primary-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

          </form>

          {message && (
            <p className="auth-message">
              {message}
            </p>
          )}

          <p className="muted">
            Don't have an account?{" "}
            <Link
              className="auth-link"
              href="/signup"
            >
              Create account
            </Link>
          </p>

        </div>
      </section>
    </main>
  );
}