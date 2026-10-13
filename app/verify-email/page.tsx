"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type VerificationStatus = "success" | "error" | "pending";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<VerificationStatus>("pending");

  useEffect(() => {
    const verified = searchParams.get("verified");
    const error = searchParams.get("error");
    const errorCode = searchParams.get("error_code");

    if (verified === "1") {
      setStatus("success");
      return;
    }

    if (error || errorCode) {
      setStatus("error");
      return;
    }

    setStatus("pending");
  }, [searchParams]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8fc] px-4 py-10">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#dcd5ff]/40 blur-[100px]" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#e6dcff]/50 blur-[110px]" />
      </div>

      <section className="relative w-full max-w-[470px] rounded-[26px] border border-white bg-white/95 p-7 shadow-[0_24px_80px_-35px_rgba(46,43,89,0.20)] sm:p-10">
        {/* Brand */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-9 flex items-center gap-2 text-left"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#7968f0] to-[#4934d5] text-lg font-bold text-white">
            T
          </span>

          <span className="text-lg font-bold tracking-tight">
            <span className="text-[#222136]">Trace</span>
            <span className="text-[#705ce7]">Mind</span>
          </span>
        </button>

        {/* Pending */}
        {status === "pending" && (
          <div className="py-5 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#f0edff]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-10 w-10 animate-pulse text-[#705ce7]"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path
                  d="m4 7 8 6 8-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="text-[29px] font-bold tracking-[-1.2px] text-[#171a2e]">
              Check your email
            </h1>

            <p className="mt-3 text-sm leading-7 text-[#7d879d]">
              Open the verification email sent by TraceMind and click
              the verification link to activate your account.
            </p>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-7 w-full rounded-[13px] bg-gradient-to-r from-[#6054e8] to-[#4030d8] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-[#6049d8]/20 transition hover:-translate-y-0.5"
            >
              Go to login
            </button>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="py-5 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#eafaf1]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-10 w-10 text-[#16a368]"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  d="m5 12 4 4L19 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="mb-3 inline-flex items-center rounded-full bg-[#eafaf1] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1.4px] text-[#168653]">
              Email confirmed
            </div>

            <h1 className="text-[29px] font-bold tracking-[-1.2px] text-[#171a2e]">
              You're all verified!
            </h1>

            <p className="mt-3 text-sm leading-7 text-[#7d879d]">
              Your email address has been verified successfully.
              Welcome to TraceMind! You're ready to sign in and start
              organizing the things that matter.
            </p>

            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-[13px] bg-gradient-to-r from-[#6054e8] to-[#4030d8] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-[#6049d8]/20 transition hover:-translate-y-0.5"
            >
              Continue to login
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="py-5 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#fff1f0]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-10 w-10 text-[#dc5656]"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  d="m9 9 6 6m0-6-6 6"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1 className="text-[27px] font-bold tracking-[-1px] text-[#171a2e]">
              Verification link expired
            </h1>

            <p className="mt-3 text-sm leading-7 text-[#7d879d]">
              This verification link may have expired or already been
              used. Return to login or request a fresh verification
              email if your account is still unverified.
            </p>

            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="mt-7 w-full rounded-[13px] bg-gradient-to-r from-[#6054e8] to-[#4030d8] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-[#6049d8]/20 transition hover:-translate-y-0.5"
            >
              Back to login
            </button>
          </div>
        )}

        <div className="mt-7 border-t border-[#edf0f6] pt-5 text-center">
          <p className="text-[11px] text-[#9a9caf]">
            © {new Date().getFullYear()} TraceMind · Never lose a thought.
          </p>
        </div>
      </section>
    </main>
  );
}