"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "../../components/Logo";
import { createClient, isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from "../../lib/supabase";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setMessage("");

    if (!name || !email || !password) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Account created! Please check your email to verify your account."
    );

    setName("");
    setEmail("");
    setPassword("");
  };

  const handleGoogleSignup = async () => {
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
            Build a memory of
            <br />
            what matters.
          </h1>

          <p>
            Capture once. Understand automatically.
            Find it whenever you need it.
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

          <h1>Create your account</h1>

          <p className="muted">
            Start organizing the information you don't want to lose.
          </p>

          {/* GOOGLE */}
          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleSignup}
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

          {/* EMAIL SIGNUP */}
          <form onSubmit={handleSignup}>

            <label className="label">
              Name
            </label>

            <input
              className="input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />

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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />

            <button
              className="primary-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

          </form>

          {message && (
            <p className="auth-message">
              {message}
            </p>
          )}

          <p className="muted">
            Already have an account?{" "}
            <Link
              className="auth-link"
              href="/login"
            >
              Log in
            </Link>
          </p>

        </div>
      </section>
    </main>
  );
}