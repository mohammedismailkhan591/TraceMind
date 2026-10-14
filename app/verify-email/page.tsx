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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080611] px-5 py-12 text-white selection:bg-violet-500/30">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-violet-700/20 blur-[130px]" />
        <div className="absolute -bottom-40 -right-32 h-[450px] w-[450px] rounded-full bg-fuchsia-600/10 blur-[130px]" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035]" />
        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.045]" />

        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.24) 0.7px, transparent 0.7px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <section className="relative z-10 w-full max-w-[480px] animate-[fadeInUp_0.7s_ease-out_both]">
        {/* Brand */}
        <Link
          href="/"
          className="mb-9 flex items-center justify-center gap-3"
          aria-label="TraceMind home"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-violet-300/20 bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-900/40">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 text-white"
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

          <span className="text-[25px] font-bold tracking-[-1.3px]">
            Trace<span className="text-violet-400">Mind</span>
          </span>
        </Link>

        {/* Main card */}
        <div className="overflow-hidden rounded-[30px] border border-white/[0.10] bg-white/[0.045] shadow-[0_25px_100px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
          {/* Top accent */}
          <div className="h-[3px] w-full bg-gradient-to-r from-violet-600 via-fuchsia-400 to-violet-600" />

          <div className="px-7 pb-9 pt-10 sm:px-11 sm:pb-11 sm:pt-12">
            {/* Illustration */}
            <div className="relative mx-auto mb-8 flex h-[132px] w-[132px] items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full bg-violet-500/[0.12] blur-xl" />

              <div className="absolute inset-2 rounded-full border border-violet-400/[0.16]" />

              <div className="absolute inset-0 rounded-full border border-dashed border-white/[0.12]" />

              <div className="relative flex h-[92px] w-[92px] items-center justify-center rounded-[28px] border border-violet-300/20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-[0_0_45px_rgba(139,92,246,0.13)]">
                {hasError ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-11 w-11 text-rose-300"
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
                    className="h-12 w-12 text-violet-300"
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
                  </svg>
                )}
              </div>

              {!hasError && (
                <div className="absolute right-0 top-3 flex h-8 w-8 animate-[float_3s_ease-in-out_infinite] items-center justify-center rounded-xl border border-emerald-300/20 bg-[#10251f] shadow-lg">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 text-emerald-300"
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

              <div className="absolute bottom-2 left-0 flex h-7 w-7 items-center justify-center rounded-lg border border-violet-300/20 bg-[#1b1430] text-violet-300 shadow-lg">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-3.5 w-3.5"
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
            </div>

            {/* Status badge */}
            <div className="mb-5 flex justify-center">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1.8px] ${
                  hasError
                    ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-300"
                    : "border-violet-400/20 bg-violet-400/[0.08] text-violet-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    hasError ? "bg-rose-400" : "bg-violet-400"
                  }`}
                />
                {hasError ? "Verification issue" : "One last step"}
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-center text-[32px] font-semibold leading-[1.15] tracking-[-1.4px] sm:text-[38px]">
              {hasError ? (
                <>
                  Let's get this
                  <br />
                  <span className="bg-gradient-to-r from-rose-300 to-orange-200 bg-clip-text text-transparent">
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

            <p className="mx-auto mt-5 max-w-[330px] text-center text-[14px] leading-7 text-zinc-400">
              {hasError
                ? errorMessage
                : "You're almost ready to experience a smarter way to remember. Verify your email address to finish setting up your TraceMind account."}
            </p>

            {/* Information panel */}
            {!hasError && (
              <div className="mt-8 rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:p-5">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-[18px] w-[18px]"
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

                  <div>
                    <p className="text-[13px] font-semibold text-zinc-200">
                      What happens next?
                    </p>
                    <p className="mt-1.5 text-[12px] leading-6 text-zinc-500">
                      Open the email from TraceMind and click the verification
                      button. Then come back and sign in to your account.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Primary action */}
            <Link
              href={hasError ? "/signup" : "/login"}
              className="group mt-8 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-[16px] text-[14px] font-semibold text-white shadow-[0_8px_30px_rgba(124,58,237,0.25)] transition duration-300 hover:-translate-y-0.5 hover:from-violet-500 hover:to-purple-500 hover:shadow-[0_12px_35px_rgba(124,58,237,0.35)] active:translate-y-0"
            >
              {hasError ? "Back to sign up" : "Continue to login"}

              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[17px] w-[17px] transition-transform duration-300 group-hover:translate-x-1"
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

            {!hasError && (
              <p className="mt-5 text-center text-[12px] leading-6 text-zinc-500">
                Can't find the email? Check your spam or junk folder.
              </p>
            )}
          </div>

          {/* Card footer */}
          <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.02] px-7 py-5 sm:px-11">
            <span className="text-[11px] text-zinc-500">
              Secure account verification
            </span>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-3.5 w-3.5"
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
              Protected
            </div>
          </div>
        </div>

        {/* Bottom brand message */}
        <p className="mt-7 text-center text-[11px] tracking-wide text-zinc-600">
          Your thoughts. Your discoveries. Never lost.
        </p>

        <p className="mt-2 text-center text-[10px] text-zinc-700">
          © {new Date().getFullYear()} TraceMind
        </p>
      </section>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(18px);
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
            transform: translateY(-6px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
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
          Loading TraceMind...
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}