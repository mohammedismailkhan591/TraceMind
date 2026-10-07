"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "../../components/Logo";
import { createClient } from "../../lib/supabase";

export default function Signup() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Account created successfully! Please check your email to verify your account."
    );

    setName("");
    setEmail("");
    setPassword("");
  };

  const handleGoogleSignup = async () => {
    setMessage("");
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error("Google signup error:", error);
      setGoogleLoading(false);
      setMessage(error.message);
    }
  };

  return (
    <main className="signup-page">
      <div className="glow glow-one" />
      <div className="glow glow-two" />

      <section className="signup-card">
        {/* Logo */}
        <div className="logo-area">
          <Logo />
        </div>

        {/* Heading */}
        <div className="heading">
          <div className="eyebrow">PERSONAL MEMORY ENGINE</div>

          <h1>Create your account</h1>

          <p>
            Save what you find, understand what matters, and find it again
            whenever you need it.
          </p>
        </div>

        {/* Google */}
        <button
          type="button"
          className="google-button"
          onClick={handleGoogleSignup}
          disabled={googleLoading || loading}
        >
          <span className="google-icon">G</span>

          <span>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </span>
        </button>

        {/* Divider */}
        <div className="divider">
          <span>or continue with email</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="signup-form">
          <div className="input-group">
            <label htmlFor="name">Full name</label>

            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />

            <small>At least 8 characters</small>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`message ${
                message.includes("successfully") ? "success" : ""
              }`}
            >
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="create-button"
            disabled={loading || googleLoading}
          >
            {loading ? (
              "Creating account..."
            ) : (
              <>
                Create account
                <span>→</span>
              </>
            )}
          </button>
        </form>

        {/* Login */}
        <div className="login-text">
          Already have an account?

          <Link href="/login">Sign in</Link>
        </div>

        {/* Privacy */}
        <div className="privacy">
          Your information belongs to you.
        </div>
      </section>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;

          padding: 40px 20px;

          background:
            radial-gradient(
              circle at 10% 15%,
              rgba(99, 102, 241, 0.1),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 85%,
              rgba(14, 165, 233, 0.09),
              transparent 30%
            ),
            #f8fafc;

          color: #111827;
        }

        .glow {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }

        .glow-one {
          top: -250px;
          left: -180px;
          background: rgba(99, 102, 241, 0.1);
        }

        .glow-two {
          bottom: -250px;
          right: -180px;
          background: rgba(14, 165, 233, 0.09);
        }

        .signup-card {
          position: relative;
          z-index: 2;

          width: 100%;
          max-width: 470px;

          padding: 42px;

          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 28px;

          background: rgba(255, 255, 255, 0.95);

          box-shadow:
            0 25px 70px rgba(15, 23, 42, 0.08),
            0 4px 12px rgba(15, 23, 42, 0.03);

          backdrop-filter: blur(20px);
        }

        .logo-area {
          margin-bottom: 32px;
        }

        .heading {
          margin-bottom: 25px;
        }

        .eyebrow {
          margin-bottom: 10px;

          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;

          color: #6366f1;
        }

        .heading h1 {
          margin: 0;

          font-size: 34px;
          line-height: 1.15;
          letter-spacing: -0.04em;

          color: #0f172a;
        }

        .heading p {
          margin: 12px 0 0;

          font-size: 15px;
          line-height: 1.6;

          color: #64748b;
        }

        .google-button {
          width: 100%;
          height: 52px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;

          border: 1px solid #e2e8f0;
          border-radius: 14px;

          background: #ffffff;
          color: #1e293b;

          font-size: 14px;
          font-weight: 600;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .google-button:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: #cbd5e1;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.07);
        }

        .google-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .google-icon {
          width: 24px;
          height: 24px;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 19px;
          font-weight: 700;

          color: #4285f4;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 14px;

          margin: 24px 0;

          color: #94a3b8;
          font-size: 12px;
        }

        .divider::before,
        .divider::after {
          content: "";

          flex: 1;
          height: 1px;

          background: #e2e8f0;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .input-group input {
          width: 100%;
          height: 50px;
          box-sizing: border-box;

          padding: 0 15px;

          border: 1px solid #dbe2ea;
          border-radius: 13px;

          outline: none;

          background: #ffffff;
          color: #0f172a;

          font-size: 14px;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .input-group input::placeholder {
          color: #a1aab8;
        }

        .input-group input:focus {
          border-color: #818cf8;

          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.09);
        }

        .input-group small {
          font-size: 11px;
          color: #94a3b8;
        }

        .message {
          padding: 12px 14px;

          border-radius: 11px;

          background: #fef2f2;
          border: 1px solid #fecaca;

          color: #b91c1c;

          font-size: 13px;
          line-height: 1.5;
        }

        .message.success {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #15803d;
        }

        .create-button {
          width: 100%;
          height: 52px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          margin-top: 2px;

          border: none;
          border-radius: 14px;

          background: #111827;
          color: #ffffff;

          font-size: 14px;
          font-weight: 700;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .create-button:hover:not(:disabled) {
          background: #1f2937;
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
        }

        .create-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .create-button span {
          font-size: 18px;
        }

        .login-text {
          margin-top: 24px;

          text-align: center;

          font-size: 13px;
          color: #64748b;
        }

        .login-text a {
          margin-left: 5px;

          color: #4f46e5;

          font-weight: 700;
          text-decoration: none;
        }

        .login-text a:hover {
          text-decoration: underline;
        }

        .privacy {
          margin-top: 20px;
          padding-top: 17px;

          border-top: 1px solid #eef2f7;

          text-align: center;

          font-size: 11px;
          color: #94a3b8;
        }

        @media (max-width: 520px) {
          .signup-page {
            padding: 20px 14px;
          }

          .signup-card {
            padding: 30px 22px;
            border-radius: 22px;
          }

          .heading h1 {
            font-size: 29px;
          }
        }
      `}</style>
    </main>
  );
}