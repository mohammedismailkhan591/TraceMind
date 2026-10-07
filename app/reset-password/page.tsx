"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "../../components/Logo";
import { createClient } from "../../lib/supabase";

export default function ResetPassword() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated successfully.");

    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  };

  return (
    <>
      <style jsx global>{`
        .tm-reset-page {
          min-height: 100vh;
          background: #f7f8fa;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .tm-reset-card {
          width: 100%;
          max-width: 430px;
          background: #ffffff;
          border: 1px solid #e7e9ed;
          border-radius: 20px;
          padding: 38px;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.07);
        }

        .tm-reset-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }

        .tm-reset-heading {
          text-align: center;
          margin-bottom: 28px;
        }

        .tm-reset-heading h1 {
          margin: 0 0 10px;
          font-size: 28px;
          font-weight: 700;
          color: #111318;
          letter-spacing: -0.5px;
        }

        .tm-reset-heading p {
          margin: 0;
          color: #70757d;
          font-size: 14px;
          line-height: 1.6;
        }

        .tm-reset-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tm-reset-form label {
          font-size: 13px;
          font-weight: 600;
          color: #30343b;
          margin-top: 8px;
        }

        .tm-reset-form input {
          width: 100%;
          box-sizing: border-box;
          height: 48px;
          border: 1px solid #dfe2e7;
          border-radius: 10px;
          padding: 0 14px;
          font-size: 14px;
          outline: none;
          background: #fff;
          color: #17191d;
        }

        .tm-reset-form input:focus {
          border-color: #111318;
          box-shadow: 0 0 0 3px rgba(17, 19, 24, 0.06);
        }

        .tm-reset-button {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 10px;
          background: #111318;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 14px;
        }

        .tm-reset-button:hover {
          background: #24272d;
        }

        .tm-reset-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tm-reset-message {
          margin-top: 14px;
          padding: 12px;
          border-radius: 9px;
          background: #f1f3f5;
          color: #34383f;
          font-size: 13px;
          line-height: 1.5;
        }

        .tm-reset-footer {
          text-align: center;
          margin-top: 24px;
        }

        .tm-reset-footer a {
          color: #111318;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        .tm-reset-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 500px) {
          .tm-reset-page {
            padding: 16px;
          }

          .tm-reset-card {
            padding: 28px 22px;
            border-radius: 16px;
          }

          .tm-reset-heading h1 {
            font-size: 24px;
          }
        }
      `}</style>

      <main className="tm-reset-page">
        <section className="tm-reset-card">

          <div className="tm-reset-logo">
            <Logo />
          </div>

          <div className="tm-reset-heading">
            <h1>Create a new password</h1>
            <p>
              Choose a strong new password for your TraceMind account.
            </p>
          </div>

          <form
            className="tm-reset-form"
            onSubmit={handleReset}
          >
            <label htmlFor="password">
              New password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <label htmlFor="confirmPassword">
              Confirm password
            </label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              required
            />

            {message && (
              <div className="tm-reset-message">
                {message}
              </div>
            )}

            <button
              className="tm-reset-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>

          <div className="tm-reset-footer">
            <Link href="/login">
              ← Back to login
            </Link>
          </div>

        </section>
      </main>
    </>
  );
}