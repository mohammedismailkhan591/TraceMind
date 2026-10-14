"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "../../components/Logo";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const verified = searchParams.get("verified");

  const errorMessages: Record<string, string> = {
    invalid_link:
      "This verification link is invalid or incomplete. Please use the verification link from your latest email.",
    verification_failed:
      "This link may have expired or already been used. Please sign up again or request a fresh verification email.",
  };

  const errorMessage = error ? errorMessages[error] : null;
  const hasError = Boolean(errorMessage);

  return (
    <main className="auth-page verify-auth-page">
      {/* LEFT SIDE — MATCHES LOGIN */}
      <section className="auth-visual verify-visual">
        <Logo />

        <div className="auth-visual-content">
          <div className="verify-visual-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="m4 7 8 6 8-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="m9 15 2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <span className="verify-eyebrow">
            {hasError ? "LET'S FIX THIS" : "ONE LAST STEP"}
          </span>

          <h1>
            {hasError ? (
              <>
                Let's get you
                <br />
                <span className="verify-highlight">back on track.</span>
              </>
            ) : (
              <>
                Your next chapter
                <br />
                <span className="verify-highlight">starts here.</span>
              </>
            )}
          </h1>

          <p>
            {hasError
              ? "No worries. Let's get your account verification sorted out so you can continue your TraceMind journey."
              : "Your ideas, discoveries, and important moments deserve a safe place. One quick step and you're ready to go."}
          </p>

          <div className="auth-points verify-points">
            <div>
              <span className="verify-point-icon">✓</span>
              Secure account access
            </div>
            <div>
              <span className="verify-point-icon">✓</span>
              Your memories stay yours
            </div>
            <div>
              <span className="verify-point-icon">✓</span>
              Find what matters, faster
            </div>
          </div>
        </div>

        <div className="verify-visual-footer">
          Your thoughts. Your discoveries. Never lost.
        </div>
      </section>

      {/* RIGHT SIDE — MATCHES LOGIN CARD */}
      <section className="auth-card verify-card-section">
        <div className="auth-form verify-form">
          <div className="verify-mobile-logo">
            <Logo />
          </div>

          <div
            className={`verify-status-icon ${
              hasError ? "verify-status-error" : "verify-status-success"
            }`}
            aria-hidden="true"
          >
            {hasError ? (
              <svg viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="m9 9 6 6m0-6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="m4 7 8 6 8-6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          <span
            className={`verify-status-label ${
              hasError ? "verify-label-error" : ""
            }`}
          >
            <span className="verify-status-dot" />
            {hasError
              ? "Verification issue"
              : verified === "true"
                ? "Email verified"
                : "Email verification"}
          </span>

          <h1 className="verify-heading">
            {hasError ? (
              <>
                Let's get this
                <br />
                <span>sorted out.</span>
              </>
            ) : verified === "true" ? (
              <>
                You're all
                <br />
                <span>set!</span>
              </>
            ) : (
              <>
                Check your
                <br />
                <span>inbox.</span>
              </>
            )}
          </h1>

          <p className="muted verify-description">
            {hasError
              ? errorMessage
              : verified === "true"
                ? "Your email has been verified successfully. You can now sign in to your TraceMind account."
                : "You're almost ready to experience a smarter way to remember. Verify your email address to finish setting up your TraceMind account."}
          </p>

          {!hasError && verified !== "true" && (
            <div className="verify-instructions">
              <div className="verify-instructions-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M12 11v5m0-8h.01"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <h2>What happens next?</h2>
                <p>
                  Open the email from TraceMind and click the verification
                  button. Once verified, return here to sign in securely.
                </p>
              </div>
            </div>
          )}

          {!hasError && verified !== "true" && (
            <div className="verify-spam-note">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="m5 12 4 4L19 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Remember to check your spam or junk folder.
            </div>
          )}

          <Link
            href={hasError ? "/signup" : "/login"}
            className="primary-btn verify-primary-btn"
          >
            <span>
              {hasError
                ? "Back to sign up"
                : verified === "true"
                  ? "Continue to login"
                  : "Continue to login"}
            </span>

            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14m-6-6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <div className="verify-security">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="m9 12 2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span>Your account security comes first.</span>
          </div>

          <div className="verify-bottom-brand">
            <span className="verify-security-dot" />
            Secure verification · Protected by TraceMind
          </div>
        </div>
      </section>

      <style jsx global>{`
        .verify-auth-page {
          min-height: 100vh;
          animation: verifyPageEnter 0.55s ease-out both;
        }

        .verify-visual {
          position: relative;
          overflow: hidden;
        }

        .verify-visual::after {
          content: "";
          position: absolute;
          width: 320px;
          height: 320px;
          right: -130px;
          bottom: -100px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(124, 58, 237, 0.14),
            transparent 70%
          );
          pointer-events: none;
        }

        .verify-visual-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 82px;
          height: 82px;
          margin-bottom: 28px;
          border-radius: 24px;
          color: #7c3aed;
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.17);
          box-shadow: 0 15px 40px rgba(91, 33, 182, 0.08);
          animation: verifyFloat 4s ease-in-out infinite;
        }

        .verify-visual-icon svg {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
        }

        .verify-eyebrow {
          display: inline-block;
          margin-bottom: 16px;
          color: #7c3aed;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2.5px;
        }

        .verify-highlight {
          color: #7c3aed;
        }

        .verify-points {
          margin-top: 28px;
        }

        .verify-points > div {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .verify-point-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          border-radius: 50%;
          color: #6d28d9;
          background: rgba(124, 58, 237, 0.09);
          font-size: 12px;
          font-weight: 700;
        }

        .verify-visual-footer {
          position: relative;
          z-index: 1;
          margin-top: 40px;
          color: #64748b;
          font-size: 11px;
          letter-spacing: 0.4px;
        }

        .verify-card-section {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .verify-form {
          width: 100%;
          max-width: 430px;
          animation: verifyCardEnter 0.65s ease-out both;
        }

        .verify-mobile-logo {
          display: none;
          margin-bottom: 28px;
        }

        .verify-status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          margin-bottom: 22px;
          border-radius: 20px;
          animation: verifyFloat 4.5s ease-in-out infinite;
        }

        .verify-status-icon svg {
          width: 31px;
          height: 31px;
          flex-shrink: 0;
        }

        .verify-status-success {
          color: #7c3aed;
          background: linear-gradient(
            135deg,
            rgba(139, 92, 246, 0.14),
            rgba(124, 58, 237, 0.05)
          );
          border: 1px solid rgba(124, 58, 237, 0.18);
          box-shadow: 0 10px 35px rgba(124, 58, 237, 0.08);
        }

        .verify-status-error {
          color: #e11d48;
          background: rgba(225, 29, 72, 0.07);
          border: 1px solid rgba(225, 29, 72, 0.16);
        }

        .verify-status-label {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 7px 12px;
          margin-bottom: 18px;
          border: 1px solid rgba(124, 58, 237, 0.15);
          border-radius: 999px;
          background: rgba(124, 58, 237, 0.055);
          color: #6d28d9;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        .verify-label-error {
          color: #e11d48;
          border-color: rgba(225, 29, 72, 0.16);
          background: rgba(225, 29, 72, 0.05);
        }

        .verify-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08);
        }

        .verify-heading {
          margin: 0;
          color: var(--foreground, #0f172a);
          font-size: clamp(34px, 4vw, 42px);
          font-weight: 750;
          line-height: 1.12;
          letter-spacing: -1.7px;
        }

        .verify-heading span {
          color: #7c3aed;
        }

        .verify-description {
          margin-top: 17px;
          margin-bottom: 0;
          max-width: 380px;
          font-size: 13px;
          line-height: 1.9;
        }

        .verify-instructions {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-top: 27px;
          padding: 18px;
          border: 1px solid rgba(124, 58, 237, 0.12);
          border-radius: 16px;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.045),
            rgba(255, 255, 255, 0.7)
          );
        }

        .verify-instructions-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          border: 1px solid rgba(124, 58, 237, 0.12);
          border-radius: 12px;
          background: rgba(124, 58, 237, 0.07);
          color: #7c3aed;
        }

        .verify-instructions-icon svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .verify-instructions h2 {
          margin: 1px 0 7px;
          color: var(--foreground, #0f172a);
          font-size: 13px;
          font-weight: 700;
        }

        .verify-instructions p {
          margin: 0;
          color: var(--muted, #64748b);
          font-size: 12px;
          line-height: 1.85;
        }

        .verify-spam-note {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 15px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.6;
        }

        .verify-spam-note svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
          color: #059669;
        }

        .verify-primary-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          margin-top: 27px;
          text-decoration: none;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .verify-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(124, 58, 237, 0.18);
        }

        .verify-primary-btn svg {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .verify-primary-btn:hover svg {
          transform: translateX(3px);
        }

        .verify-security {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 21px;
          color: #64748b;
          font-size: 11px;
        }

        .verify-security svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
          color: #7c3aed;
        }

        .verify-bottom-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 28px;
          padding-top: 19px;
          border-top: 1px solid rgba(148, 163, 184, 0.17);
          color: #64748b;
          font-size: 10px;
          letter-spacing: 0.2px;
        }

        .verify-security-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.09);
        }

        @keyframes verifyPageEnter {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes verifyCardEnter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes verifyFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @media (max-width: 900px) {
          .verify-auth-page {
            min-height: 100vh;
          }

          .verify-visual {
            display: none !important;
          }

          .verify-card-section {
            min-height: 100vh;
            padding: 32px 24px;
          }

          .verify-form {
            max-width: 460px;
          }

          .verify-mobile-logo {
            display: block;
          }
        }

        @media (max-width: 480px) {
          .verify-card-section {
            padding: 26px 20px;
          }

          .verify-heading {
            font-size: 36px;
          }

          .verify-instructions {
            gap: 11px;
            padding: 15px;
          }

          .verify-bottom-brand {
            font-size: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .verify-auth-page,
          .verify-form,
          .verify-visual-icon,
          .verify-status-icon {
            animation: none !important;
          }

          .verify-primary-btn,
          .verify-primary-btn svg {
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-page verify-auth-page">
          <section className="auth-card verify-card-section">
            <div className="auth-form">
              <Logo />
              <p className="muted">Loading TraceMind...</p>
            </div>
          </section>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}