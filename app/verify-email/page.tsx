"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    invalid_link:
      "This verification link is invalid or incomplete. Please use the verification link from your latest email.",
    verification_failed:
      "This link may have expired or already been used. Please sign up again or request a fresh verification email.",
  };

  const errorMessage = error ? errorMessages[error] : null;
  const hasError = Boolean(errorMessage);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080611] px-4 py-10 text-white selection:bg-violet-500/30 sm:px-6">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-48 -top-40 h-[480px] w-[480px] rounded-full bg-violet-700/20 blur-[140px] animate-[ambient_10s_ease-in-out_infinite]" />

        <div className="absolute -bottom-48 -right-40 h-[500px] w-[500px] rounded-full bg-fuchsia-600/[0.12] blur-[150px] animate-[ambient_12s_ease-in-out_infinite_reverse]" />

        <div className="absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.045]" />

        <div className="absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035]" />

        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.35) 0.7px, transparent 0.7px)",
            backgroundSize: "25px 25px",
          }}
        />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
      </div>

      {/* Main content */}
      <section className="relative z-10 w-full max-w-[470px] animate-[fadeInUp_0.8s_cubic-bezier(0.16,1,0.3,1)_both]">
        {/* Brand */}
        <Link
          href="/"
          className="group mb-8 flex items-center justify-center gap-3 sm:mb-10"
          aria-label="TraceMind home"
        >
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[17px] border border-violet-300/25 bg-gradient-to-br from-violet-500 via-violet-600 to-purple-800 shadow-[0_8px_35px_rgba(124,58,237,0.28)] transition duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_45px_rgba(139,92,246,0.42)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />

            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="relative h-6 w-6 text-white"
              aria-hidden="true"
            >
              <path
                d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
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
              <path
                d="m12 9 2-2m-2 8 2 2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="text-[26px] font-bold leading-none tracking-[-1.4px]">
              Trace<span className="text-violet-400">Mind</span>
            </span>

            <span className="mt-1.5 text-[9px] font-medium uppercase tracking-[3px] text-zinc-500">
              Your second brain
            </span>
          </div>
        </Link>

        {/* Verification card */}
        <div className="group/card relative overflow-hidden rounded-[30px] border border-white/[0.10] bg-[#100d1b]/80 shadow-[0_35px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          {/* Top gradient */}
          <div className="h-[3px] w-full bg-gradient-to-r from-violet-600 via-fuchsia-400 to-violet-500" />

          {/* Subtle inner glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-48 w-72 -translate-x-1/2 rounded-full bg-violet-500/[0.07] blur-[70px]"
            aria-hidden="true"
          />

          <div className="relative px-6 pb-8 pt-9 sm:px-10 sm:pb-10 sm:pt-11">
            {/* Illustration */}
            <div className="relative mx-auto mb-8 flex h-[150px] w-[150px] items-center justify-center">
              {/* Outer glow */}
              <div
                className={`absolute inset-2 rounded-full blur-2xl ${
                  hasError ? "bg-rose-500/[0.10]" : "bg-violet-500/[0.14]"
                }`}
              />

              {/* Orbit rings */}
              <div className="absolute inset-1 rounded-full border border-white/[0.07]" />

              <div className="absolute inset-3 rounded-full border border-violet-400/[0.12]" />

              <div className="absolute inset-0 animate-[spin_35s_linear_infinite] rounded-full border border-dashed border-violet-300/[0.18]" />

              {/* Main icon container */}
              <div
                className={`relative flex h-[100px] w-[100px] items-center justify-center rounded-[30px] border shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition duration-500 ${
                  hasError
                    ? "border-rose-300/20 bg-gradient-to-br from-rose-500/[0.15] to-orange-500/[0.04]"
                    : "border-violet-300/25 bg-gradient-to-br from-violet-500/[0.22] via-purple-500/[0.12] to-fuchsia-500/[0.06]"
                }`}
              >
                {!hasError && (
                  <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-white/[0.06] to-transparent" />
                )}

                {hasError ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="relative h-11 w-11 text-rose-300"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="m9 9 6 6m0-6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="relative h-12 w-12 text-violet-300"
                    aria-hidden="true"
                  >
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
                      d="M16.5 3.5h4m-2-2v4"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>

              {/* Floating status icon */}
              {!hasError && (
                <div className="absolute right-0 top-5 flex h-9 w-9 animate-[float_4s_ease-in-out_infinite] items-center justify-center rounded-[13px] border border-emerald-300/20 bg-[#10251f] shadow-[0_8px_25px_rgba(0,0,0,0.3)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-[17px] w-[17px] text-emerald-300"
                    aria-hidden="true"
                  >
                    <path
                      d="m5 12 4 4L19 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              {/* Decorative sparkle */}
              <div className="absolute bottom-3 left-1 flex h-8 w-8 animate-[float_5s_ease-in-out_infinite] items-center justify-center rounded-xl border border-violet-300/20 bg-[#1b1430] text-violet-300 shadow-lg">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="m12 3 2.1 5.9L20 11l-5.9 2.1L12 19l-2.1-5.9L4 11l5.9-2.1L12 3Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Small orbiting dot */}
              {!hasError && (
                <span className="absolute left-4 top-7 h-2 w-2 rounded-full bg-fuchsia-300 shadow-[0_0_14px_rgba(232,121,249,0.7)]" />
              )}
            </div>

            {/* Status badge */}
            <div className="mb-5 flex justify-center">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[1.7px] ${
                  hasError
                    ? "border-rose-400/20 bg-rose-400/[0.07] text-rose-300"
                    : "border-violet-400/20 bg-violet-400/[0.07] text-violet-300"
                }`}
              >
                <span
                  className={`relative flex h-2 w-2 items-center justify-center rounded-full ${
                    hasError ? "bg-rose-400" : "bg-violet-400"
                  }`}
                >
                  {!hasError && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-violet-400 opacity-50" />
                  )}
                </span>

                {hasError ? "Verification issue" : "One last step"}
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-center text-[34px] font-semibold leading-[1.13] tracking-[-1.6px] sm:text-[40px]">
              {hasError ? (
                <>
                  Let's get this
                  <br />
                  <span className="bg-gradient-to-r from-rose-300 via-pink-300 to-orange-200 bg-clip-text text-transparent">
                    sorted out.
                  </span>
                </>
              ) : (
                <>
                  Check your
                  <br />
                  <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-purple-200 bg-clip-text text-transparent">
                    inbox.
                  </span>
                </>
              )}
            </h1>

            {/* Description */}
            <p className="mx-auto mt-5 max-w-[330px] text-center text-[13px] leading-[1.9] text-zinc-400 sm:text-[14px]">
              {hasError
                ? errorMessage
                : "You're almost ready to experience a smarter way to remember. Verify your email address to finish setting up your TraceMind account."}
            </p>

            {/* Next steps */}
            {!hasError && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                <div className="flex items-start gap-3.5 p-4 sm:p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-violet-400/[0.12] bg-violet-500/[0.10] text-violet-300">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-[19px] w-[19px]"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M12 11v5m0-8h.01"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-zinc-200">
                      What happens next?
                    </p>

                    <p className="mt-1.5 text-[12px] leading-[1.9] text-zinc-500">
                      Open the email from TraceMind and click the verification
                      button. Once verified, return here to sign in securely.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-white/[0.06] bg-white/[0.015] px-5 py-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 shrink-0 text-emerald-300/80"
                    aria-hidden="true"
                  >
                    <path
                      d="m5 12 4 4L19 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <span className="text-[10px] leading-5 text-zinc-500">
                    Remember to check your spam or junk folder.
                  </span>
                </div>
              </div>
            )}

            {/* Primary action */}
            <Link
              href={hasError ? "/signup" : "/login"}
              className="group relative mt-8 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 bg-[length:200%_100%] px-5 py-[17px] text-[13px] font-semibold text-white shadow-[0_8px_30px_rgba(124,58,237,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-right hover:shadow-[0_12px_40px_rgba(124,58,237,0.4)] active:translate-y-0"
            >
              <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

              <span className="relative">
                {hasError ? "Back to sign up" : "Continue to login"}
              </span>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="relative h-[17px] w-[17px] transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14m-6-6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            {/* Reassurance */}
            <div className="mt-5 flex items-center justify-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-3.5 w-3.5 text-zinc-600"
                aria-hidden="true"
              >
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

              <p className="text-center text-[11px] text-zinc-500">
                Your account security comes first.
              </p>
            </div>
          </div>

          {/* Card footer */}
          <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-white/[0.02] px-6 py-5 sm:px-10">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.035]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-3.5 w-3.5 text-zinc-400"
                  aria-hidden="true"
                >
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              <span className="text-[10px] text-zinc-500 sm:text-[11px]">
                Secure verification
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-emerald-300/80 sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Protected by TraceMind
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <div className="mt-7 text-center">
          <p className="text-[11px] tracking-[0.5px] text-zinc-500">
            Your thoughts. Your discoveries. Never lost.
          </p>

          <p className="mt-2.5 text-[10px] text-zinc-700">
            © {new Date().getFullYear()} TraceMind. All rights reserved.
          </p>
        </div>
      </section>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes ambient {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(20px, -15px, 0) scale(1.08);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
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
        <main className="flex min-h-screen items-center justify-center bg-[#080611] text-sm text-zinc-400">
          <div className="flex flex-col items-center gap-4">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-violet-400/20 border-t-violet-400" />
            <span>Loading TraceMind...</span>
          </div>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}