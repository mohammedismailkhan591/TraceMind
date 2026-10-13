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
        "Your recovery session could not be verified. Please request a new reset link."
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

  const inputClass =
    "w-full rounded-2xl border border-[#e8e7f2] bg-[#fafaff] py-4 pl-12 pr-16 text-sm text-[#24233b] outline-none transition-all duration-300 placeholder:text-[#aaa8bd] hover:border-[#d5cff9] focus:border-[#7865eb] focus:bg-white focus:ring-4 focus:ring-[#7865eb]/10";

  return (
    <main className="tm-reset relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f8fd] px-4 py-8 text-[#24233b] sm:px-6">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="tm-orb absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-[#8875f5]/15 blur-[100px]" />
        <div className="tm-orb tm-orb-delay absolute -bottom-48 -right-36 h-[480px] w-[480px] rounded-full bg-[#c4b5fd]/25 blur-[110px]" />

        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(#d9d4f1 1px, transparent 1px)",
            backgroundSize: "25px 25px",
            maskImage:
              "linear-gradient(to bottom, black, transparent 90%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black, transparent 90%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1080px]">
        {/* TraceMind branding */}
        <header className="tm-enter mb-8 flex justify-center sm:mb-10">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Go to TraceMind home"
            className="group flex items-center gap-3 rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-[#7865eb]/20"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-[#8876fa] to-[#624bdc] text-[24px] font-bold text-white shadow-lg shadow-[#7765ec]/25 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105">
              T
            </span>

            <span className="text-[26px] font-bold tracking-[-1.4px]">
              <span className="text-[#222136]">Trace</span>
              <span className="text-[#705ce7]">Mind</span>
            </span>
          </button>
        </header>

        {/* Main panel */}
        <section className="tm-enter mx-auto grid w-full max-w-[960px] overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_30px_100px_-40px_rgba(67,52,143,0.28)] backdrop-blur-xl md:grid-cols-[0.9fr_1.1fr]">
          {/* Left panel */}
          <aside className="relative hidden min-h-[600px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#f0edff] via-[#f8f6ff] to-[#eeebff] p-9 md:flex lg:p-12">
            <div className="absolute -right-24 top-12 h-64 w-64 rounded-full border border-[#8c7cf4]/20" />
            <div className="absolute -right-10 top-28 h-44 w-44 rounded-full border border-[#8c7cf4]/20" />
            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#a89af9]/20 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-[#ded8ff] bg-white/75 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[1.8px] text-[#705ce0]">
                <span className="h-2 w-2 rounded-full bg-[#7864eb]" />
                Your second brain
              </div>

              <h2 className="max-w-[310px] text-[37px] font-semibold leading-[1.17] tracking-[-1.8px] text-[#262442] lg:text-[43px]">
                Your memories.
                <br />
                Your ideas.
                <br />
                <span className="bg-gradient-to-r from-[#8875f5] to-[#5e4ad7] bg-clip-text text-transparent">
                  Your control.
                </span>
              </h2>

              <p className="mt-6 max-w-[285px] text-[14px] leading-7 text-[#77758f]">
                Everything worth remembering, gathered in one
                thoughtful space. Get back to what matters with
                TraceMind.
              </p>
            </div>

            {/* Central illustration */}
            <div className="relative z-10 my-8 flex min-h-[210px] items-center justify-center">
              <div className="absolute h-52 w-52 rounded-full border border-[#a79af5]/30" />
              <div className="absolute h-40 w-40 rounded-full border border-[#a79af5]/40" />
              <div className="absolute h-28 w-28 rounded-full bg-[#b4a8ff]/25 blur-xl" />

              <div className="tm-float relative flex h-[112px] w-[112px] items-center justify-center rounded-[32px] border border-white bg-white/90 shadow-[0_20px_55px_rgba(105,85,211,0.20)]">
                <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[25px] bg-gradient-to-br from-[#8876fa] to-[#6651df] shadow-lg shadow-[#7765ec]/30">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-9 w-9 text-white"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    aria-hidden="true"
                  >
                    <path
                      d="M7 4.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V6A1.5 1.5 0 0 1 7.5 4.5Z"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 4.5V9h4M9 13h6M9 16.5h6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <span className="absolute left-[12%] top-[24%] h-3 w-3 rounded-full bg-[#9885f5]" />
              <span className="absolute right-[15%] top-[22%] h-2 w-2 rounded-full bg-[#c1a7fa]" />
              <span className="absolute bottom-[15%] right-[20%] h-3 w-3 rounded-full bg-[#8170ed]/70" />
              <span className="absolute bottom-[20%] left-[20%] h-2 w-2 rounded-full bg-[#b7a8f8]" />
            </div>

            <div className="relative z-10 border-t border-[#dcd7f5] pt-5">
              <p className="text-[12px] leading-6 text-[#88849f]">
                A little more peace of mind.
                <br />
                <span className="font-semibold text-[#6e5ce0]">
                  A lot less to forget.
                </span>
              </p>
            </div>
          </aside>

          {/* Password form */}
          <div className="flex min-w-0 flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            {/* Mobile icon */}
            <div className="mb-7 flex justify-center md:hidden">
              <div className="flex h-[66px] w-[66px] items-center justify-center rounded-[22px] bg-gradient-to-br from-[#8876fa] to-[#6651df] shadow-lg shadow-[#7765ec]/25">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8 text-white"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <rect x="5" y="10" width="14" height="11" rx="2.5" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                  <path d="M12 14v3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.8px] text-[#7664e8]">
                <span className="h-px w-7 bg-[#a69af3]" />
                Secure account recovery
              </div>

              <h1 className="text-[30px] font-semibold tracking-[-1.4px] text-[#25243e] sm:text-[36px]">
                Reset your password
              </h1>

              <p className="mt-3 max-w-[350px] text-[14px] leading-7 text-[#88869e]">
                Almost there. Choose a new password to get back to
                everything you have saved in TraceMind.
              </p>
            </div>

            {!sessionReady ? (
              <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl bg-[#faf9ff]">
                <div className="mb-5 h-11 w-11 animate-spin rounded-full border-[3px] border-[#e8e4ff] border-t-[#7765ec]" />
                <p className="text-[14px] font-semibold text-[#5e5a7b]">
                  Verifying your secure link
                </p>
                <p className="mt-2 text-[12px] text-[#a09db3]">
                  Please wait a moment...
                </p>
              </div>
            ) : !hasSession ? (
              <div className="rounded-[22px] border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5 sm:p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm ring-1 ring-amber-100">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v5m0 3h.01" strokeLinecap="round" />
                  </svg>
                </div>

                <h2 className="text-[18px] font-semibold tracking-[-0.4px] text-[#39334a]">
                  Your reset link needs refreshing
                </h2>

                <p className="mt-3 text-[13px] leading-6 text-[#777084]">
                  We couldn't verify your recovery session. The link
                  may have expired, or the authentication callback
                  may not have completed.
                </p>

                {message && (
                  <p className="mt-3 break-words rounded-xl bg-amber-100/60 p-3 text-[12px] leading-5 text-amber-800">
                    {message}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#7966ed] to-[#6049d8] px-4 py-3.5 text-[13px] font-semibold text-white shadow-lg shadow-[#7765ec]/20 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Return to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* New password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2.5 block text-[13px] font-semibold text-[#45435e]"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a19bb9]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-[18px] w-[18px]"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        aria-hidden="true"
                      >
                        <rect x="5" y="10" width="14" height="11" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                      </svg>
                    </span>

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create a new password"
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#7867dc] transition hover:bg-[#f1efff]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((level) => {
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

                      return (
                        <span
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            level <= strength
                              ? strength >= 4
                                ? "bg-emerald-400"
                                : strength >= 3
                                  ? "bg-[#8c79ee]"
                                  : strength >= 2
                                    ? "bg-[#b6a5f5]"
                                    : "bg-amber-300"
                              : "bg-[#eeedf5]"
                          }`}
                        />
                      );
                    })}

                    <span className="ml-2 whitespace-nowrap text-[10px] text-[#9996ac]">
                      {password.length === 0
                        ? "8+ characters"
                        : password.length < 8
                          ? "Too short"
                          : password.length < 12
                            ? "Good"
                            : "Strong"}
                    </span>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2.5 block text-[13px] font-semibold text-[#45435e]"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a19bb9]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-[18px] w-[18px]"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        aria-hidden="true"
                      >
                        <path
                          d="m5 12 4 4L19 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm your new password"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#7867dc] transition hover:bg-[#f1efff]"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {confirmPassword.length > 0 && (
                    <p
                      className={`mt-2 text-[11px] ${
                        password === confirmPassword
                          ? "text-emerald-600"
                          : "text-[#a19bb9]"
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
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-[12px] leading-5 ${
                      success
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 font-bold">
                      {success ? "✓" : "!"}
                    </span>
                    <span>{message}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !sessionReady || !hasSession || success}
                  className="tm-button group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#7966ed] via-[#7058e9] to-[#6049d8] px-5 py-4 text-[13px] font-semibold text-white shadow-[0_9px_25px_rgba(112,88,233,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(112,88,233,0.35)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  <span className="relative">
                    {loading
                      ? "Updating your password..."
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

                <p className="text-center text-[11px] leading-5 text-[#a09db2]">
                  Your password is securely updated through TraceMind.
                </p>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 border-t border-[#efedf7] pt-5">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="group flex w-full items-center justify-center gap-2 text-[12px] font-medium text-[#85829d] transition hover:text-[#6d59e6]"
              >
                <span className="transition-transform group-hover:-translate-x-1">
                  ←
                </span>
                Back to login
              </button>
            </div>
          </div>
        </section>

        <footer className="tm-enter mt-7 text-center">
          <p className="text-[11px] tracking-wide text-[#a5a2b8]">
            © {new Date().getFullYear()} TraceMind
            <span className="mx-2 text-[#d3cfea]">·</span>
            Never lose a thought.
          </p>
        </footer>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        .tm-enter {
          animation: tm-enter 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }

        .tm-orb {
          animation: tm-drift 15s ease-in-out infinite alternate;
        }

        .tm-orb-delay {
          animation-delay: -5s;
          animation-duration: 19s;
        }

        .tm-float {
          animation: tm-float 5s ease-in-out infinite;
        }

        @keyframes tm-enter {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes tm-drift {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(22px, -18px, 0);
          }
        }

        @keyframes tm-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tm-enter,
          .tm-orb,
          .tm-float {
            animation: none !important;
          }

          .tm-button {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}