"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "../../components/Logo";
import { createClient, isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from "../../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage("");
    if (!email) return setMessage("Enter your email address.");
    if (!isSupabaseConfigured()) return setMessage(SUPABASE_SETUP_MESSAGE);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    setMessage(error ? error.message : "If an account exists for this email, a reset link has been sent.");
  };
  return <main className="auth-page auth-single"><section className="auth-card"><div className="auth-form">
    <Logo /><h1>Reset your password</h1><p className="muted">Enter your email and we’ll send you a secure reset link.</p>
    <form onSubmit={submit}><label className="label">Email</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/><button className="primary-btn" disabled={loading}>{loading?"Sending…":"Send reset link"}</button></form>
    {message && <p className="auth-message">{message}</p>}<p className="muted auth-bottom"><Link className="auth-link" href="/login">Back to log in</Link></p>
  </div></section></main>;
}
