"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "../../components/Logo";
import {
  createClient,
  isSupabaseConfigured,
  SUPABASE_SETUP_MESSAGE,
} from "../../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setSent(false);

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setMessage(SUPABASE_SETUP_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

const redirectTo ="https://trace-mind-six.vercel.app/auth/callback?next=/reset-password";
const { error } = await supabase.auth.resetPasswordForEmail(
  email.trim().toLowerCase(),
  { redirectTo }
);
      if (error) {
        setMessage(error.message);
        return;
      }

      setSent(true);
      setMessage(
        "If an account exists for this email, a password-reset link has been sent. Please check your inbox and spam folder."
      );
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-single">
      <section className="auth-card">
        <div className="auth-form">
          <Logo />

          <h1>Reset your password</h1>

          <p className="muted">
            Enter your email address and we’ll send you a secure password-reset
            link.
          </p>

          <form onSubmit={submit}>
            <label className="label" htmlFor="reset-email">
              Email address
            </label>

            <input
              id="reset-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading || sent}
            />

            <button
              className="primary-btn"
              type="submit"
              disabled={loading || sent}
            >
              {loading
                ? "Sending reset link..."
                : sent
                  ? "Reset link requested"
                  : "Send reset link"}
            </button>
          </form>

          {message && (
            <p
              className="auth-message"
              role={sent ? "status" : "alert"}
              aria-live="polite"
            >
              {message}
            </p>
          )}

          {sent && (
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setSent(false);
                setMessage("");
              }}
              style={{
                marginTop: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          )}

          <p className="muted auth-bottom">
            <Link className="auth-link" href="/login">
              Back to log in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}