"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "../../components/Logo";
import { createClient } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "If an account exists with this email, a password reset link has been sent."
    );
  }

  return (
    <>
      <style jsx global>{`
        .tm-forgot-page {
          min-height: 100vh;
          background: #f7f8fa;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
        }

        .tm-forgot-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 38px;
          box-sizing: border-box;
          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.07);
        }

        .tm-forgot-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 34px;
        }

        .tm-forgot-heading {
          text-align: center;
          margin-bottom: 28px;
        }

        .tm-forgot-heading h1 {
          margin: 0 0 9px;
          font-size: 28px;
          color: #111318;
          letter-spacing: -0.6px;
        }

        .tm-forgot-heading p {
          margin: 0;
          color: #777c84;
          font-size: 14px;
          line-height: 1.5;
        }

        .tm-forgot-form {
          display: flex;
          flex-direction: column;
        }

        .tm-forgot-label {
          margin-bottom: 7px;
          color: #34383f;
          font-size: 12px;
          font-weight: 600;
        }

        .tm-forgot-input {
          width: 100%;
          height: 47px;
          box-sizing: border-box;
          border: 1px solid #dfe2e7;
          border-radius: 9px;
          padding: 0 13px;
          font-size: 14px;
          outline: none;
          margin-bottom: 14px;
        }

        .tm-forgot-input:focus {
          border-color: #111318;
          box-shadow: 0 0 0 3px rgba(17, 19, 24, 0.05);
        }

        .tm-forgot-button {
          width: 100%;
          height: 47px;
          border: none;
          border-radius: 9px;
          background: #111318;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .tm-forgot-button:hover {
          background: #292c32;
        }

        .tm-forgot-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .tm-forgot-message {
          margin-bottom: 14px;
          padding: 11px 12px;
          border-radius: 8px;
          background: #f1f2f4;
          color: #4c5159;
          font-size: 12px;
          line-height: 1.5;
        }

        .tm-forgot-footer {
          text-align: center;
          margin-top: 24px;
        }

        .tm-forgot-footer a {
          color: #111318;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        .tm-forgot-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 500px) {
          .tm-forgot-page {
            padding: 16px;
          }

          .tm-forgot-card {
            padding: 28px 22px;
          }

          .tm-forgot-heading h1 {
            font-size: 25px;
          }
        }
      `}</style>

      <main className="tm-forgot-page">
        <section className="tm-forgot-card">

          <div className="tm-forgot-logo">
            <Logo />
          </div>

          <div className="tm-forgot-heading">
            <h1>Forgot your password?</h1>
            <p>
              Enter your email and we'll send you a secure
              password reset link.
            </p>
          </div>

          <form
            className="tm-forgot-form"
            onSubmit={handleSubmit}
          >
            <label
              className="tm-forgot-label"
              htmlFor="tm-forgot-email"
            >
              Email address
            </label>

            <input
              id="tm-forgot-email"
              className="tm-forgot-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {message && (
              <div className="tm-forgot-message">
                {message}
              </div>
            )}

            <button
              className="tm-forgot-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : "Send reset link"}
            </button>
          </form>

          <div className="tm-forgot-footer">
            <Link href="/login">
              ← Back to login
            </Link>
          </div>

        </section>
      </main>
    </>
  );
}