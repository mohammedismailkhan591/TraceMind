"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">(
    "error"
  );

  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );

      const authError =
        params.get("error_description") ||
        params.get("error") ||
        hashParams.get("error_description") ||
        hashParams.get("error");

      if (authError) {
        if (active) {
          setMessage(
            authError.replace(/\+/g, " ")
          );
          setMessageType("error");
          setCheckingSession(false);
        }
        return;
      }

      // Some Supabase recovery links provide tokens in the URL hash.
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");

      if (accessToken && refreshToken && hashType === "recovery") {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          if (active) {
            setMessage(
              "This password reset link is invalid or expired. Please request a new one."
            );
            setMessageType("error");
            setCheckingSession(false);
          }
          return;
        }

        // Remove tokens from the visible address bar.
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }

      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        setMessage(
          "Your reset session could not be found. Please request a new password reset link."
        );
        setMessageType("error");
        setSessionReady(false);
      } else {
        setSessionReady(true);
      }

      setCheckingSession(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [supabase]);

  const passwordStrength = (() => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  })();

  const strengthLabel =
    password.length === 0
      ? "At least 8 characters"
      : passwordStrength <= 2
        ? "Weak password"
        : passwordStrength <= 4
          ? "Good password"
          : "Strong password";

  async function handleResetPassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Your passwords don't match. Please try again.");
      setMessageType("error");
      return;
    }

    if (!sessionReady) {
      setMessage(
        "Your reset session has expired. Please request a new reset link."
      );
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message);
        setMessageType("error");
        return;
      }

      setMessage("Your password has been updated successfully!");
      setMessageType("success");

      await supabase.auth.signOut();

      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.replace("/login?passwordReset=success");
      }, 1800);
    } catch {
      setMessage(
        "Something went wrong. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="reset-page">
      <style jsx>{`
        .reset-page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              ellipse at 12% 15%,
              rgba(167, 139, 250, 0.19),
              transparent 36%
            ),
            radial-gradient(
              ellipse at 88% 82%,
              rgba(129, 140, 248, 0.18),
              transparent 34%
            ),
            #f8f7ff;
          color: #19172d;
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(1px);
        }

        .orb-one {
          width: 240px;
          height: 240px;
          top: -100px;
          right: -65px;
          background: rgba(196, 181, 253, 0.2);
        }

        .orb-two {
          width: 190px;
          height: 190px;
          bottom: -75px;
          left: -55px;
          background: rgba(165, 180, 252, 0.2);
        }

        .layout {
          width: 100%;
          max-width: 460px;
          position: relative;
          z-index: 1;
          animation: rise-in 0.65s ease both;
        }

        .brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          margin-bottom: 30px;
          text-decoration: none;
          color: inherit;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          color: white;
          background: linear-gradient(145deg, #8b5cf6, #6d28d9);
          box-shadow: 0 8px 20px rgba(109, 40, 217, 0.25);
        }

        .brand-name {
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -1.1px;
        }

        .brand-name span {
          color: #7c3aed;
        }

        .card {
          padding: 42px;
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow:
            0 28px 80px rgba(53, 38, 99, 0.09),
            0 5px 18px rgba(53, 38, 99, 0.04);
          backdrop-filter: blur(18px);
        }

        .icon-wrap {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          margin-bottom: 25px;
          border: 1px solid #e9ddff;
          border-radius: 20px;
          background: linear-gradient(145deg, #f5f0ff, #ede7ff);
          color: #7c3aed;
        }

        .eyebrow {
          margin: 0 0 9px;
          color: #7c3aed;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        h1 {
          margin: 0;
          color: #201a38;
          font-size: clamp(27px, 5vw, 34px);
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -1.3px;
        }

        .description {
          margin: 13px 0 30px;
          color: #77738b;
          font-size: 14px;
          line-height: 1.8;
        }

        .field {
          margin-bottom: 21px;
        }

        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 9px;
        }

        label {
          color: #37324d;
          font-size: 12px;
          font-weight: 750;
        }

        .input-wrap {
          position: relative;
        }

        input {
          width: 100%;
          height: 51px;
          padding: 0 49px 0 15px;
          border: 1px solid #e7e4f0;
          border-radius: 13px;
          outline: none;
          background: #fbfaff;
          color: #252039;
          font: inherit;
          font-size: 13px;
          transition:
            border-color 0.2s,
            box-shadow 0.2s,
            background 0.2s;
          box-sizing: border-box;
        }

        input::placeholder {
          color: #aaa6bc;
        }

        input:focus {
          border-color: #a78bfa;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }

        .toggle {
          position: absolute;
          top: 50%;
          right: 13px;
          transform: translateY(-50%);
          display: grid;
          place-items: center;
          padding: 5px;
          border: 0;
          background: transparent;
          color: #88829e;
          cursor: pointer;
        }

        .strength {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 10px;
        }

        .strength-bar {
          height: 4px;
          flex: 1;
          border-radius: 99px;
          background: #eeecf4;
          transition: background 0.2s;
        }

        .strength-text {
          margin-left: 5px;
          color: #88829e;
          font-size: 10px;
          white-space: nowrap;
        }

        .primary {
          width: 100%;
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 8px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(105deg, #8b5cf6, #6d28d9);
          box-shadow: 0 10px 22px rgba(109, 40, 217, 0.2);
          color: white;
          font: inherit;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition:
            transform 0.2s,
            box-shadow 0.2s,
            opacity 0.2s;
        }

        .primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 27px rgba(109, 40, 217, 0.27);
        }

        .primary:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .message {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 18px;
          padding: 13px;
          border: 1px solid;
          border-radius: 12px;
          font-size: 12px;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .message.error {
          border-color: #fecaca;
          background: #fff5f5;
          color: #b42335;
        }

        .message.success {
          border-color: #bbf7d0;
          background: #f0fdf4;
          color: #166534;
        }

        .footer {
          margin: 25px 0 0;
          text-align: center;
          color: #88829e;
          font-size: 12px;
        }

        .footer a {
          color: #7c3aed;
          font-weight: 750;
          text-decoration: none;
        }

        .footer a:hover {
          text-decoration: underline;
        }

        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 23px;
          color: #918ca5;
          font-size: 11px;
        }

        .invalid-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .secondary {
          display: block;
          padding: 15px;
          border: 1px solid #e6defa;
          border-radius: 13px;
          color: #7137ce;
          font-size: 13px;
          font-weight: 750;
          text-align: center;
          text-decoration: none;
          transition: background 0.2s;
        }

        .secondary:hover {
          background: #f7f3ff;
        }

        .spinner {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes rise-in {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 520px) {
          .reset-page {
            padding: 24px 15px;
          }

          .brand {
            margin-bottom: 22px;
          }

          .card {
            padding: 28px 22px;
            border-radius: 23px;
          }

          .icon-wrap {
            width: 54px;
            height: 54px;
            margin-bottom: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .layout {
            animation: none;
          }

          *,
          *::before,
          *::after {
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="orb orb-one" />
      <div className="orb orb-two" />

      <div className="layout">
       <Link href="/" className="brand" aria-label="TraceMind home">
  <span className="brand-mark">
    <span
      style={{
        fontSize: "25px",
        fontWeight: 800,
        lineHeight: 1,
        color: "#ffffff",
      }}
    >
      T
    </span>
  </span>

  <span className="brand-name">
    Trace<span>Mind</span>
  </span>
</Link>

        <section className="card">
          <div className="icon-wrap">
            <svg
              width="29"
              height="29"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="11"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M8 10V7a4 4 0 0 1 8 0v3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path
                d="M12 14V17"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p className="eyebrow">Account security</p>

          <h1>Create a new password</h1>

          <p className="description">
            Almost there! Choose a strong password to secure your TraceMind
            account and get back to everything you have saved.
          </p>

          {checkingSession ? (
            <div
              style={{
                padding: "25px 0",
                textAlign: "center",
                color: "#77738b",
                fontSize: 13,
              }}
            >
              Checking your secure reset link...
            </div>
          ) : !sessionReady ? (
            <>
              {message && (
                <div className="message error" role="alert">
                  <span aria-hidden="true">!</span>
                  <span>{message}</span>
                </div>
              )}

              <div
                className="invalid-actions"
                style={{ marginTop: 22 }}
              >
                <Link href="/forgot-password" className="primary">
                  Request a new reset link
                </Link>

                <Link href="/login" className="secondary">
                  Back to login
                </Link>
              </div>
            </>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="field">
                <div className="label-row">
                  <label htmlFor="new-password">New password</label>
                </div>

                <div className="input-wrap">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={loading}
                  />

                  <button
                    className="toggle"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M3 3L21 21M10.6 10.6A2 2 0 0 0 13.4 13.4M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a15 15 0 0 1-3 3.8M6.2 6.2C4.1 7.6 3 10 3 12c0 0 3.5 7 9 7 1.1 0 2.2-.3 3.1-.7"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M3 12S6.5 5 12 5s9 7 9 7-3.5 7-9 7-9-7-9-7Z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                <div
                  className="strength"
                  aria-label={`Password strength: ${strengthLabel}`}
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span
                      key={level}
                      className="strength-bar"
                      style={{
                        background:
                          password.length > 0 && level <= passwordStrength
                            ? passwordStrength <= 2
                              ? "#ef4444"
                              : passwordStrength <= 4
                                ? "#f59e0b"
                                : "#22c55e"
                            : undefined,
                      }}
                    />
                  ))}

                  <span className="strength-text">
                    {strengthLabel}
                  </span>
                </div>
              </div>

              <div className="field">
                <div className="label-row">
                  <label htmlFor="confirm-password">
                    Confirm new password
                  </label>
                </div>

                <div className="input-wrap">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Enter your password again"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />

                  <button
                    className="toggle"
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Updating password...
                  </>
                ) : (
                  <>
                    Update password
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 12H19M12 5L19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>

              {message && (
                <div
                  className={`message ${messageType}`}
                  role={messageType === "error" ? "alert" : "status"}
                >
                  <span aria-hidden="true">
                    {messageType === "success" ? "✓" : "!"}
                  </span>
                  <span>{message}</span>
                </div>
              )}
            </form>
          )}
        </section>

        <p className="footer">
          Remembered your password?{" "}
          <Link href="/login">Back to login</Link>
        </p>

        <div className="security-note">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 3L19 6V11.5C19 16 16 19.5 12 21C8 19.5 5 16 5 11.5V6L12 3Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M9 12L11 14L15 10"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Secure password recovery · TraceMind
        </div>
      </div>
    </main>
  );
}