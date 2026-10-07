
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../components/Logo";
import { createClient } from "../../lib/supabase";

export default function Login() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
  };

  const handleGoogleLogin = async () => {
    setMessage("");
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error("Google login error:", error);
        setGoogleLoading(false);
        setMessage(error.message);
      }
    } catch (error) {
      console.error("Google login error:", error);
      setGoogleLoading(false);
      setMessage("Unable to connect to Google. Please try again.");
    }
  };

  return (
    <main className="auth-page">
      {/* Background */}
      <div className="background-grid" />
      <div className="background-glow glow-left" />
      <div className="background-glow glow-right" />

      <div className="auth-layout">
        {/* Left brand panel */}
        <section className="brand-panel">
          <div className="brand-top">
            <Logo />
          </div>

          <div className="brand-content">
            <span className="brand-label">PERSONAL MEMORY ENGINE</span>

            <h1>
              Remember what
              <br />
              <span>you can't place.</span>
            </h1>

            <p>
              TraceMind helps you save information you encounter and
              find it again when you remember the idea, but not where
              you saw it.
            </p>
          </div>

          <div className="memory-visual">
            <div className="visual-line line-one" />
            <div className="visual-line line-two" />
            <div className="visual-line line-three" />

            <div className="visual-node node-one">PDF</div>
            <div className="visual-node node-two">LINK</div>
            <div className="visual-node node-three">NOTE</div>

            <div className="visual-core">T</div>
          </div>

          <div className="brand-footer">
            <span>TRACEMIND</span>
            <span>YOUR INFORMATION. YOUR MEMORY.</span>
          </div>
        </section>

        {/* Login panel */}
        <section className="login-panel">
          <div className="mobile-logo">
            <Logo />
          </div>

          <div className="login-header">
            <span className="eyebrow">WELCOME BACK</span>

            <h2>Sign in to TraceMind.</h2>

            <p>
              Continue to your personal memory space.
            </p>
          </div>

          {/* Google */}
          <button
            type="button"
            className="google-button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
          >
            <span className="google-icon">G</span>

            <span>
              {googleLoading
                ? "Connecting..."
                : "Continue with Google"}
            </span>
          </button>

          <div className="divider">
            <span>OR CONTINUE WITH EMAIL</span>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form">
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
              <div className="password-label">
                <label htmlFor="password">Password</label>

                <Link href="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {message && (
              <div className="message">
                <span>!</span>
                <p>{message}</p>
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading || googleLoading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="signup-text">
            <span>Don't have an account?</span>
            <Link href="/signup">Create account</Link>
          </div>

          <div className="privacy">
            <span className="privacy-dot" />
            Your memories stay private and belong to you.
          </div>
        </section>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          background: #f7f8fa;
          color: #17191e;
          display: flex;
          align-items: stretch;
          justify-content: center;
          padding: 0;
          position: relative;
          overflow: hidden;
        }

        .background-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .35;
          background-image:
            linear-gradient(#e7e8eb 1px, transparent 1px),
            linear-gradient(90deg, #e7e8eb 1px, transparent 1px);
          background-size: 55px 55px;
          mask-image: linear-gradient(
            to bottom,
            rgba(0,0,0,.8),
            transparent 75%
          );
        }

        .background-glow {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }

        .glow-left {
          top: -220px;
          left: -220px;
          background: rgba(23,25,30,.04);
        }

        .glow-right {
          bottom: -250px;
          right: -180px;
          background: rgba(23,25,30,.035);
        }

        .auth-layout {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1240px;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.08fr .92fr;
          margin: auto;
          padding: 30px;
          gap: 30px;
        }

        /* LEFT */

        .brand-panel {
          position: relative;
          min-height: calc(100vh - 60px);
          overflow: hidden;
          border-radius: 24px;
          background: #17191e;
          color: white;
          padding: 35px 42px;
          display: flex;
          flex-direction: column;
        }

        .brand-top {
          position: relative;
          z-index: 3;
        }

        .brand-top :global(*) {
          color: white;
        }

        .brand-content {
          position: relative;
          z-index: 3;
          margin-top: auto;
          margin-bottom: 80px;
          max-width: 580px;
        }

        .brand-label {
          color: #8e929a;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.7px;
        }

        .brand-content h1 {
          margin: 17px 0 18px;
          font-size: clamp(42px, 5vw, 65px);
          line-height: .96;
          letter-spacing: -3.5px;
          font-weight: 760;
        }

        .brand-content h1 span {
          color: #858990;
        }

        .brand-content p {
          max-width: 500px;
          margin: 0;
          color: #aeb2b9;
          font-size: 14px;
          line-height: 1.75;
        }

        .memory-visual {
          position: absolute;
          right: 55px;
          top: 50%;
          width: 280px;
          height: 280px;
          transform: translateY(-50%);
          opacity: .7;
        }

        .visual-line {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 105px;
          height: 1px;
          background: rgba(255,255,255,.14);
          transform-origin: left center;
        }

        .line-one {
          transform: rotate(-32deg);
        }

        .line-two {
          transform: rotate(32deg);
        }

        .line-three {
          transform: rotate(150deg);
        }

        .visual-node {
          position: absolute;
          width: 52px;
          height: 52px;
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #9da1a8;
          background: rgba(255,255,255,.04);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          backdrop-filter: blur(8px);
        }

        .node-one {
          top: 22px;
          left: 110px;
        }

        .node-two {
          right: 15px;
          bottom: 68px;
        }

        .node-three {
          left: 15px;
          bottom: 68px;
        }

        .visual-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 72px;
          height: 72px;
          transform: translate(-50%, -50%);
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.25);
          border-radius: 50%;
          background: rgba(255,255,255,.08);
          font-size: 22px;
          font-weight: 750;
          box-shadow: 0 0 45px rgba(255,255,255,.06);
        }

        .brand-footer {
          position: relative;
          z-index: 3;
          display: flex;
          justify-content: space-between;
          color: #70747c;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.2px;
        }

        /* RIGHT */

        .login-panel {
          align-self: center;
          width: 100%;
          max-width: 470px;
          margin: 0 auto;
          padding: 25px 35px;
        }

        .mobile-logo {
          display: none;
        }

        .login-header {
          margin-bottom: 28px;
        }

        .eyebrow {
          display: block;
          margin-bottom: 10px;
          color: #a1a4aa;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.6px;
        }

        .login-header h2 {
          margin: 0;
          color: #17191e;
          font-size: 34px;
          line-height: 1.05;
          letter-spacing: -1.7px;
          font-weight: 760;
        }

        .login-header p {
          margin: 12px 0 0;
          color: #8b8f97;
          font-size: 13px;
          line-height: 1.6;
        }

        .google-button {
          width: 100%;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          border: 1px solid #dfe1e5;
          border-radius: 11px;
          background: white;
          color: #34373d;
          font-family: inherit;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: .18s ease;
        }

        .google-button:hover:not(:disabled) {
          border-color: #c8cacf;
          background: #fcfcfc;
          transform: translateY(-1px);
        }

        .google-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .google-icon {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          font-size: 17px;
          font-weight: 750;
          color: #4285f4;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 24px 0;
          color: #a1a4aa;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e6e7ea;
        }

        .login-form {
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
          color: #50535a;
          font-size: 11px;
          font-weight: 700;
        }

        .password-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .password-label a {
          color: #6f737b;
          font-size: 10px;
          font-weight: 650;
          text-decoration: none;
        }

        .password-label a:hover {
          color: #17191e;
        }

        .input-group input {
          width: 100%;
          height: 49px;
          padding: 0 14px;
          border: 1px solid #dfe1e5;
          border-radius: 10px;
          outline: none;
          background: white;
          color: #17191e;
          font-family: inherit;
          font-size: 13px;
          transition: .18s ease;
        }

        .input-group input::placeholder {
          color: #b0b3b9;
        }

        .input-group input:focus {
          border-color: #aeb1b7;
          box-shadow: 0 0 0 3px rgba(23,25,30,.05);
        }

        .message {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 11px 12px;
          border: 1px solid #ead5d6;
          border-radius: 10px;
          background: #fff8f8;
          color: #a34f55;
          font-size: 11px;
          line-height: 1.5;
        }

        .message span {
          width: 17px;
          height: 17px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #ead5d6;
          font-size: 10px;
          font-weight: 800;
        }

        .message p {
          margin: 0;
        }

        .login-button {
          width: 100%;
          height: 51px;
          margin-top: 1px;
          border: 0;
          border-radius: 11px;
          background: #17191e;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: .18s ease;
        }

        .login-button:hover:not(:disabled) {
          background: #272a30;
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(23,25,30,.12);
        }

        .login-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .login-button span {
          font-size: 17px;
        }

        .signup-text {
          display: flex;
          justify-content: center;
          gap: 5px;
          margin-top: 23px;
          color: #92959c;
          font-size: 11px;
        }

        .signup-text a {
          color: #17191e;
          font-weight: 700;
          text-decoration: none;
        }

        .signup-text a:hover {
          text-decoration: underline;
        }

        .privacy {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 27px;
          padding-top: 17px;
          border-top: 1px solid #e9eaed;
          color: #a1a4aa;
          font-size: 9px;
        }

        .privacy-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #a1a4aa;
        }

        @media (max-width: 900px) {
          .auth-layout {
            grid-template-columns: 1fr;
            max-width: 560px;
            padding: 25px;
          }

          .brand-panel {
            display: none;
          }

          .login-panel {
            max-width: 470px;
            padding: 30px;
            background: white;
            border: 1px solid #e5e6e9;
            border-radius: 20px;
            box-shadow: 0 18px 50px rgba(23,25,30,.06);
          }

          .mobile-logo {
            display: block;
            margin-bottom: 35px;
          }
        }

        @media (max-width: 520px) {
          .auth-layout {
            padding: 15px;
          }

          .login-panel {
            padding: 27px 21px;
            border-radius: 17px;
          }

          .login-header h2 {
            font-size: 29px;
          }
        }
      `}</style>
    </main>
  );
}

