"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";
import styles from "./page.module.css";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(
      "If an account exists with this email, you will receive a password reset link shortly."
    );

    setLoading(false);
  }

  return (
    <main className={styles.page}>
      <div className={styles.backgroundShapeOne} />
      <div className={styles.backgroundShapeTwo} />

      <section className={styles.authCard}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>T</div>

          <div>
            <div className={styles.brandName}>TraceMind</div>
            <div className={styles.brandTagline}>
              Personal memory engine
            </div>
          </div>
        </div>

        <Link href="/login" className={styles.backLink}>
          ← Back to sign in
        </Link>

        <div className={styles.heading}>
          <div className={styles.iconCircle}>?</div>

          <h1>Forgot your password?</h1>

          <p>
            Enter the email address connected to your TraceMind account
            and we'll send you a secure reset link.
          </p>
        </div>

        {error && (
          <div className={styles.errorBox} role="alert">
            <span className={styles.errorIcon}>!</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.successBox} role="status">
            <span className={styles.successIcon}>✓</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                Sending link...
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>

        <p className={styles.loginText}>
          Remember your password?{" "}
          <Link href="/login">Sign in</Link>
        </p>

        <div className={styles.footer}>
          Your account security matters to us.
        </div>
      </section>
    </main>
  );
}