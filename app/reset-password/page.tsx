"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function initializeSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          setMessage(error.message);
          setHasSession(false);
        } else {
          setHasSession(Boolean(session));
        }
      } catch {
        if (mounted) {
          setHasSession(false);
          setMessage("We couldn't verify your recovery session.");
        }
      } finally {
        if (mounted) setSessionReady(true);
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "TOKEN_REFRESHED"
      ) {
        if (session) {
          setHasSession(true);
          setMessage("");
        }
      }

      if (event === "SIGNED_OUT") {
        setHasSession(false);
      }
    });

    void initializeSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!sessionReady) {
      setMessage("Please wait while we verify your reset link.");
      return;
    }

    if (!hasSession) {
      setMessage(
        "Your reset link could not be verified. Please request a new one."
      );
      return;
    }

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.user) {
        setMessage("We couldn't update your password. Please try again.");
        return;
      }

      setSuccess(true);
      setMessage("Your password has been updated successfully.");
      setPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();

      window.setTimeout(() => {
        router.replace("/login");
      }, 2200);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const strength =
    password.length >= 12
      ? 4
      : password.length >= 10
        ? 3
        : password.length >= 8
          ? 2
          : password.length >= 4
            ? 1
            : 0;

  const inputClass =
    "w-full rounded-[13px] border border-[#dce3f0] bg-[#eaf1ff] py-[14px] pl-4 pr-[76px] text-[14px] text-[#24233b] outline-none transition-all duration-200 placeholder:text-[#909bb0] hover:border-[#c7c5f7] focus:border-[#7765ed] focus:bg-white focus:ring-4 focus:ring-[#7765ed]/10";

  return (
    <main className="tm-reset relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8fc] px-4 py-10 text-[#171a2e] sm:px-6">
      {/* Soft lavender background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="tm-glow absolute -left-40 -top-40 h-[400px] w-[400px] rounded-full bg-[#dcd5ff]/35 blur-[100px]" />
        <div className="tm-glow tm-glow-delay absolute -bottom-40 -right-40 h-[440px] w-[440px] rounded-full bg-[#e6dcff]/45 blur-[110px]" />
      </div>

      <section className="tm-card relative z-10 w-full max-w-[480px] rounded-[26px] border border-white bg-white/95 px-6 py-8 shadow-[0_24px_80px_-35px_rgba(46,43,89,0.20)] backdrop-blur-xl sm:px-7 sm:py-9">
        {/* Brand */}
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Go to TraceMind home"
          className="group mb-7 inline-flex items-center gap-1.5 rounded-lg text-[14px] font-semibold tracking-[-0.5px] text-[#24233b] outline-none transition hover:opacity-75 focus-visible:ring-4 focus-visible:ring-[#7765ed]/15"
        >
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-gradient-to-br from-[#7968f0] to-[#4934d5] text-[13px] font-bold text-white shadow-sm">
            T
          </span>
          <span>
            Trace<span className="text-[#705ce7]">Mind</span>
          </span>
        </button>

        {/* Heading */}
        <div className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f2efff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1.3px] text-[#6e5ade]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-3.5 w-3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <rect x="5" y="10" width="14" height="11" rx="2.5" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
            </svg>
            Secure account recovery
          </div>

          <h1 className="text-[34px] font-bold leading-[1.16] tracking-[-1.8px] text-[#171a2e] sm:text-[38px]">
            Create a new
            <br />
            password
          </h1>

          <p className="mt-3 text-[14px] leading-6 text-[#7d879d]">
            Choose a strong password to secure your account and get back
            to everything you've saved in TraceMind.
          </p>
        </div>

        {/* Session loading */}
        {!sessionReady ? (
          <div className="flex min-h-[210px] flex-col items-center justify-center rounded-2xl border border-[#eeeafc] bg-[#faf9ff]">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-[#e6e0ff] border-t-[#6c58e5]" />
            <p className="text-[14px] font-semibold text-[#494562]">
              Verifying your reset link
            </p>
            <p className="mt-1.5 text-[12px] text-[#9895ad]">
              Just a moment...
            </p>
          </div>
        ) : !hasSession ? (
          <div className="rounded-[16px] border border-[#f2dfb5] bg-[#fffaf0] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0cf] text-[#ad761b]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5m0 3h.01" strokeLinecap="round" />
              </svg>
            </div>

            <h2 className="text-[17px] font-bold tracking-[-0.5px] text-[#39334a]">
              Your reset link has expired
            </h2>

            <p className="mt-2 text-[13px] leading-6 text-[#827968]">
              We couldn't verify your password recovery session. Request
              a fresh link to continue resetting your password.
            </p>

            {message && (
              <p className="mt-3 break-words text-[11px] leading-5 text-[#a07832]">
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#6054e8] to-[#4933d5] px-4 py-3.5 text-[13px] font-bold text-white shadow-[0_7px_18px_rgba(89,72,221,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(89,72,221,0.30)]"
            >
              Request a new reset link
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            {/* New password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2.5 block text-[11px] font-bold uppercase tracking-[1.2px] text-[#41445c]"
              >
                New password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your new password"
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#6655dc] transition hover:bg-[#f0edff]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Password strength */}
              <div className="mt-3 flex items-center gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className={`h-[4px] flex-1 rounded-full transition-colors duration-300 ${
                      level <= strength
                        ? strength >= 4
                          ? "bg-emerald-400"
                          : strength >= 3
                            ? "bg-[#8170ec]"
                            : strength >= 2
                              ? "bg-[#a89bf3]"
                              : "bg-amber-300"
                        : "bg-[#e9eaf2]"
                    }`}
                  />
                ))}

                <span className="ml-2 min-w-[66px] text-right text-[10px] text-[#9296aa]">
                  {password.length === 0
                    ? "8+ characters"
                    : password.length < 8
                      ? "Too short"
                      : password.length < 10
                        ? "Good"
                        : password.length < 12
                          ? "Strong"
                          : "Very strong"}
                </span>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2.5 block text-[11px] font-bold uppercase tracking-[1.2px] text-[#41445c]"
              >
                Confirm password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your new password"
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#6655dc] transition hover:bg-[#f0edff]"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <p
                  className={`mt-2 text-[11px] font-medium ${
                    password === confirmPassword
                      ? "text-emerald-600"
                      : "text-[#9296aa]"
                  }`}
                >
                  {password === confirmPassword
                    ? "✓ Passwords match"
                    : "Passwords do not match yet"}
                </p>
              )}
            </div>

            {/* Feedback */}
            {message && (
              <div
                role="status"
                aria-live="polite"
                className={`flex items-start gap-3 rounded-[13px] border px-4 py-3.5 text-[12px] leading-5 ${
                  success
                    ? "border-[#c9ecd9] bg-[#f0fbf5] text-[#18794e]"
                    : "border-[#dcd9ff] bg-[#f4f2ff] text-[#6255cf]"
                }`}
              >
                <span className="mt-px font-bold">
                  {success ? "✓" : "i"}
                </span>
                <span>{message}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !sessionReady || !hasSession || success}
              className="tm-submit group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-[13px] bg-gradient-to-r from-[#6054e8] to-[#4030d8] px-5 py-[15px] text-[14px] font-bold text-white shadow-[0_9px_22px_rgba(76,61,219,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(76,61,219,0.32)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="tm-shine pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <span className="relative">
                {loading
                  ? "Updating password..."
                  : success
                    ? "Password updated"
                    : "Update password"}
              </span>

              {!loading && !success && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14m-6-6 6 6-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {loading && (
                <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
            </button>

            <p className="text-center text-[11px] leading-5 text-[#9a9caf]">
              Your new password is encrypted and securely managed.
            </p>
          </form>
        )}

        {/* Footer */}
        <div className="mt-7 border-t border-[#edf0f6] pt-5">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="group flex w-full items-center justify-center gap-2 text-[12px] font-semibold text-[#6d68a1] transition hover:text-[#5946df]"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>
            Back to log in
          </button>
        </div>
      </section>

      <style jsx>{`
        .tm-card {
          animation: tm-appear 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }

        .tm-glow {
          animation: tm-glow 14s ease-in-out infinite alternate;
        }

        .tm-glow-delay {
          animation-delay: -6s;
          animation-duration: 18s;
        }

        .tm-submit:hover .tm-shine {
          animation: tm-shine 0.8s ease forwards;
        }

        @keyframes tm-appear {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes tm-glow {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(22px, -16px, 0);
          }
        }

        @keyframes tm-shine {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tm-card,
          .tm-glow {
            animation: none !important;
          }

          .tm-submit,
          .tm-shine {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}