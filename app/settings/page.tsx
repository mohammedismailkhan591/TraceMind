"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase";

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session has expired. Please login again.");
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setEmail(user.email || "");

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setError("Could not load your profile.");
      setLoading(false);
      return;
    }

    if (data) {
      setFullName(data.full_name || "");
      setAvatarUrl(data.avatar_url || "");
    }

    setLoading(false);
  }

  async function saveProfile() {
    if (!userId) return;

    setSaving(true);
    setMessage("");
    setError("");

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || null,
      });

    if (error) {
      console.error(error);
      setError(error.message);
      setSaving(false);
      return;
    }

    setMessage("Profile updated successfully.");
    setSaving(false);
  }

  async function changePassword() {
    if (!email) return;

    setMessage("");
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password reset link sent to your email.");
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    setError(
      "For security, account deletion should be handled through your Supabase server-side deletion flow."
    );
  }

  if (loading) {
    return (
          <div className="settings-loading">
          <div className="loading-spinner" />
          <p>Loading settings...</p>
        </div>

        <style jsx>{`
          .settings-loading {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            color: #64748b;
          }

          .loading-spinner {
            width: 34px;
            height: 34px;
            border: 3px solid #e2e8f0;
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      );
  }

  return (
      <div className="settings-page">
        {/* HEADER */}
        <div className="settings-header">
          <div>
            <div className="eyebrow">ACCOUNT</div>
            <h1>Settings</h1>
            <p>
              Manage your TraceMind profile, notifications and account
              preferences.
            </p>
          </div>
        </div>

        {/* SUCCESS */}
        {message && (
          <div className="success-message">
            <span>✓</span>
            {message}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="error-message">
            <span>!</span>
            {error}
          </div>
        )}

        <div className="settings-grid">
          {/* PROFILE */}
          <section className="settings-card profile-card">
            <div className="card-heading">
              <div className="heading-icon blue">
                <svg viewBox="0 0 24 24">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              <div>
                <h2>Profile</h2>
                <p>Your personal TraceMind information.</p>
              </div>
            </div>

            <div className="profile-preview">
              <div className="avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" />
                ) : (
                  <span>
                    {fullName
                      ? fullName.charAt(0).toUpperCase()
                      : email.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <strong>{fullName || "TraceMind User"}</strong>
                <span>{email}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Full name</label>

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label>Email address</label>

              <input type="email" value={email} disabled />

              <small>
                Your email is managed by your authentication provider.
              </small>
            </div>

            <div className="form-group">
              <label>Profile image URL</label>

              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/profile.jpg"
              />
            </div>

            <button
              className="primary-button"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </section>

          {/* NOTIFICATIONS */}
          <section className="settings-card">
            <div className="card-heading">
              <div className="heading-icon purple">
                <svg viewBox="0 0 24 24">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
              </div>

              <div>
                <h2>Notifications</h2>
                <p>Choose what TraceMind should remind you about.</p>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <strong>Email notifications</strong>
                <span>Receive important updates by email.</span>
              </div>

              <Toggle
                checked={emailNotifications}
                onChange={setEmailNotifications}
              />
            </div>

            <div className="setting-row">
              <div>
                <strong>Deadline reminders</strong>
                <span>
                  Get reminders for important deadlines saved in TraceMind.
                </span>
              </div>

              <Toggle
                checked={deadlineReminders}
                onChange={setDeadlineReminders}
              />
            </div>

            <div className="setting-row">
              <div>
                <strong>Weekly summary</strong>
                <span>
                  Receive a summary of your saved memories and activity.
                </span>
              </div>

              <Toggle
                checked={weeklySummary}
                onChange={setWeeklySummary}
              />
            </div>
          </section>

          {/* SECURITY */}
          <section className="settings-card">
            <div className="card-heading">
              <div className="heading-icon green">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <div>
                <h2>Security</h2>
                <p>Keep your TraceMind account secure.</p>
              </div>
            </div>

            <div className="security-item">
              <div>
                <strong>Password</strong>
                <span>
                  Send yourself a secure password reset link.
                </span>
              </div>

              <button className="secondary-button" onClick={changePassword}>
                Reset password
              </button>
            </div>

            <div className="security-item">
              <div>
                <strong>Authentication</strong>
                <span>Your account is protected by Supabase Auth.</span>
              </div>

              <span className="verified">
                <span>✓</span> Active
              </span>
            </div>
          </section>

          {/* PRIVACY */}
          <section className="settings-card">
            <div className="card-heading">
              <div className="heading-icon orange">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>

              <div>
                <h2>Privacy & data</h2>
                <p>Control the information stored in your account.</p>
              </div>
            </div>

            <div className="privacy-info">
              <div className="privacy-row">
                <span>Saved memories</span>
                <strong>Your account only</strong>
              </div>

              <div className="privacy-row">
                <span>Uploaded files</span>
                <strong>Private storage</strong>
              </div>

              <div className="privacy-row">
                <span>AI processing</span>
                <strong>Only when required</strong>
              </div>
            </div>
          </section>

          {/* ACCOUNT */}
          <section className="settings-card account-card">
            <div className="card-heading">
              <div className="heading-icon gray">
                <svg viewBox="0 0 24 24">
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M21 3v18" />
                </svg>
              </div>

              <div>
                <h2>Account</h2>
                <p>Manage your TraceMind session.</p>
              </div>
            </div>

            <button className="logout-button" onClick={logout}>
              Sign out
            </button>

            <div className="danger-zone">
              <div>
                <strong>Delete account</strong>
                <span>
                  Permanently remove your TraceMind account and data.
                </span>
              </div>

              <button className="danger-button" onClick={deleteAccount}>
                Delete account
              </button>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .settings-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: 42px 36px 80px;
        }

        .settings-header {
          margin-bottom: 28px;
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #2563eb;
          margin-bottom: 8px;
        }

        h1 {
          margin: 0;
          font-size: 34px;
          line-height: 1.15;
          color: #0f172a;
          letter-spacing: -0.03em;
        }

        .settings-header p {
          margin: 9px 0 0;
          color: #64748b;
          font-size: 15px;
        }

        .success-message,
        .error-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 16px;
          border-radius: 12px;
          margin-bottom: 18px;
          font-size: 14px;
          font-weight: 600;
        }

        .success-message {
          color: #166534;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .success-message span {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #dcfce7;
        }

        .error-message {
          color: #991b1b;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .error-message span {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #fee2e2;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .settings-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.045);
        }

        .profile-card {
          grid-row: span 2;
        }

        .card-heading {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          margin-bottom: 24px;
        }

        .card-heading h2 {
          margin: 0;
          color: #111827;
          font-size: 17px;
          letter-spacing: -0.01em;
        }

        .card-heading p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .heading-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          display: grid;
          place-items: center;
          border-radius: 12px;
        }

        .heading-icon svg {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .blue {
          color: #2563eb;
          background: #eff6ff;
        }

        .purple {
          color: #7c3aed;
          background: #f5f3ff;
        }

        .green {
          color: #059669;
          background: #ecfdf5;
        }

        .orange {
          color: #ea580c;
          background: #fff7ed;
        }

        .gray {
          color: #475569;
          background: #f1f5f9;
        }

        .profile-preview {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          margin-bottom: 22px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #eef2f7;
        }

        .avatar {
          width: 52px;
          height: 52px;
          overflow: hidden;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #60a5fa);
          color: white;
          font-size: 19px;
          font-weight: 800;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-preview strong {
          display: block;
          color: #111827;
          font-size: 14px;
        }

        .profile-preview span {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 12px;
        }

        .form-group {
          margin-bottom: 18px;
        }

        label {
          display: block;
          margin-bottom: 7px;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 13px;
          border: 1px solid #dbe2ea;
          border-radius: 10px;
          outline: none;
          color: #0f172a;
          background: #ffffff;
          font: inherit;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        input:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        input:disabled {
          background: #f8fafc;
          color: #94a3b8;
          cursor: not-allowed;
        }

        small {
          display: block;
          margin-top: 6px;
          color: #94a3b8;
          font-size: 11px;
        }

        .primary-button,
        .secondary-button,
        .logout-button,
        .danger-button {
          border: 0;
          border-radius: 10px;
          padding: 11px 16px;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s, background 0.15s;
        }

        .primary-button:hover,
        .secondary-button:hover,
        .logout-button:hover,
        .danger-button:hover {
          transform: translateY(-1px);
        }

        .primary-button {
          color: white;
          background: #2563eb;
        }

        .primary-button:hover {
          background: #1d4ed8;
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .setting-row,
        .security-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 17px 0;
          border-bottom: 1px solid #eef2f7;
        }

        .setting-row:last-child,
        .security-item:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .setting-row strong,
        .security-item strong {
          display: block;
          color: #1e293b;
          font-size: 13px;
        }

        .setting-row span,
        .security-item span {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }

        .toggle {
          position: relative;
          width: 44px;
          height: 24px;
          min-width: 44px;
          border: 0;
          padding: 0;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .toggle.on {
          background: #2563eb;
        }

        .toggle.off {
          background: #cbd5e1;
        }

        .toggle-dot {
          position: absolute;
          top: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
          transition: left 0.2s;
        }

        .toggle.on .toggle-dot {
          left: 23px;
        }

        .toggle.off .toggle-dot {
          left: 3px;
        }

        .secondary-button {
          flex-shrink: 0;
          color: #1d4ed8;
          background: #eff6ff;
        }

        .secondary-button:hover {
          background: #dbeafe;
        }

        .verified {
          display: inline-flex !important;
          align-items: center;
          gap: 5px;
          margin: 0 !important;
          padding: 6px 9px;
          border-radius: 999px;
          color: #047857 !important;
          background: #ecfdf5;
          font-size: 11px !important;
          font-weight: 700;
        }

        .verified span {
          margin: 0 !important;
          color: #047857 !important;
        }

        .privacy-info {
          border: 1px solid #eef2f7;
          border-radius: 13px;
          overflow: hidden;
        }

        .privacy-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 14px;
          border-bottom: 1px solid #eef2f7;
          font-size: 12px;
        }

        .privacy-row:last-child {
          border-bottom: 0;
        }

        .privacy-row span {
          color: #64748b;
        }

        .privacy-row strong {
          color: #334155;
          font-size: 11px;
        }

        .logout-button {
          width: 100%;
          color: #334155;
          background: #f1f5f9;
        }

        .logout-button:hover {
          background: #e2e8f0;
        }

        .danger-zone {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 22px;
          padding-top: 20px;
          border-top: 1px solid #fee2e2;
        }

        .danger-zone strong {
          display: block;
          color: #991b1b;
          font-size: 13px;
        }

        .danger-zone span {
          display: block;
          margin-top: 4px;
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.5;
        }

        .danger-button {
          flex-shrink: 0;
          color: #dc2626;
          background: #fef2f2;
        }

        .danger-button:hover {
          background: #fee2e2;
        }

        @media (max-width: 900px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }

          .profile-card {
            grid-row: auto;
          }
        }

        @media (max-width: 640px) {
          .settings-page {
            padding: 28px 18px 60px;
          }

          h1 {
            font-size: 28px;
          }

          .settings-card {
            padding: 18px;
            border-radius: 16px;
          }

          .setting-row,
          .security-item,
          .danger-zone {
            align-items: flex-start;
          }

          .setting-row,
          .security-item,
          .danger-zone {
            flex-direction: column;
          }

          .secondary-button,
          .danger-button {
            width: 100%;
          }
        }
      `}</style>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "on" : "off"}`}
      onClick={() => onChange(!checked)}
      aria-label={checked ? "Disable setting" : "Enable setting"}
    >
      <span className="toggle-dot" />
    </button>
  );
}