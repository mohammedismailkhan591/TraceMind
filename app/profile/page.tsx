
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";
import Sidebar from "../../components/sidebar";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);
    setEmail(user.email || "");

    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    setFullName(data?.full_name || "");
    setLoading(false);
  }

  async function saveProfile() {
    if (!user) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName.trim(),
      });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profile updated successfully.");
    }

    setSaving(false);
  }

  async function changePassword() {
    const password = prompt("Enter your new password:");

    if (!password) return;

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function deleteAccount() {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    alert(
      "Account deletion requires a secure server-side action. We will connect this to the backend before enabling permanent deletion."
    );
  }

  if (loading) {
    return (
      <main className="profile-loading">
        <p>Loading profile...</p>
      </main>
    );
  }

  const initial = (
    fullName?.charAt(0) ||
    email?.charAt(0) ||
    "M"
  ).toUpperCase();

  return (
    <>
      <Sidebar />

      <main className="profile-page">
        {/* Topbar */}
        <header className="profile-topbar">
          <div>
            <div className="eyebrow">ACCOUNT</div>
            <h1>Profile</h1>
          </div>

          <button
            className="capture-button"
            onClick={() => router.push("/capture")}
          >
            + Capture memory
          </button>
        </header>

        {/* Hero */}
        <section className="profile-hero">
          <div className="hero-copy">
            <span className="hero-label">YOUR SPACE</span>

            <h2>
              Your memory space.
              <br />
              <span>Set it up your way.</span>
            </h2>

            <p>
              Manage your personal information, account security and
              TraceMind preferences from one place.
            </p>
          </div>

          <div className="hero-orbit">
            <div className="orbit orbit-one">
              <span />
            </div>
            <div className="orbit orbit-two">
              <span />
            </div>
            <div className="orbit-core">{initial}</div>
          </div>
        </section>

        {/* Profile overview */}
        <section className="profile-overview">
          <div className="overview-card">
            <span className="overview-label">ACCOUNT</span>
            <strong>{email}</strong>
            <small>Authenticated TraceMind account</small>
          </div>

          <div className="overview-card">
            <span className="overview-label">PROFILE</span>
            <strong>{fullName || "Not set"}</strong>
            <small>Your display name</small>
          </div>

          <div className="overview-card">
            <span className="overview-label">STATUS</span>
            <strong>Active</strong>
            <small>Your account is currently active</small>
          </div>
        </section>

        {/* Personal information */}
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="section-label">PERSONAL INFORMATION</span>
              <h2>Profile details</h2>
            </div>

            <span className="section-note">Private to your account</span>
          </div>

          <div className="settings-card">
            <div className="profile-heading">
              <div className="large-avatar">{initial}</div>

              <div>
                <h3>Your Profile</h3>
                <p>Update the information connected to your account.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="field">
                <label>Email address</label>
                <input value={email} disabled />
                <small>Email is managed through your authentication account.</small>
              </div>
            </div>

            <div className="save-row">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="primary-button"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>

              {message && (
                <span className="save-message">{message}</span>
              )}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="section-label">SECURITY</span>
              <h2>Account security</h2>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-icon">⌕</div>

            <div className="settings-info">
              <h3>Password</h3>
              <p>Keep your TraceMind account protected with a secure password.</p>
            </div>

            <button
              onClick={changePassword}
              className="secondary-button"
            >
              Change password
            </button>
          </div>
        </section>

        {/* Privacy */}
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="section-label">PRIVACY & DATA</span>
              <h2>Your information</h2>
            </div>
          </div>

          <div className="settings-card privacy-card">
            <div>
              <h3>Your memories belong to you.</h3>

              <p>
                Your saved memories are connected to your authenticated
                account and separated from other users.
              </p>
            </div>

            <button
              onClick={() => alert("Data export will be added next.")}
              className="secondary-button"
            >
              Export memories
            </button>
          </div>
        </section>

        {/* Account */}
        <section className="section account-section">
          <div className="section-heading">
            <div>
              <span className="section-label danger-label">ACCOUNT</span>
              <h2>Account actions</h2>
            </div>
          </div>

          <div className="account-actions">
            <div>
              <h3>Sign out of TraceMind</h3>
              <p>End your current session on this device.</p>
            </div>

            <button
              onClick={signOut}
              className="secondary-button"
            >
              Sign out
            </button>
          </div>

          <div className="delete-row">
            <div>
              <h3>Delete account</h3>
              <p>
                Permanently removing an account requires a secure
                server-side action.
              </p>
            </div>

            <button
              onClick={deleteAccount}
              className="delete-button"
            >
              Delete account
            </button>
          </div>
        </section>

        <footer className="profile-footer">
          <span>TRACEMIND</span>
          <span>Personal information memory</span>
        </footer>
      </main>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f7f8fa;
          color: #17191e;
        }

        .profile-page {
          min-height: 100vh;
          margin-left: 238px;
          padding: 30px 42px 60px;
          background: #f7f8fa;
        }

        .profile-topbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .eyebrow,
        .section-label,
        .overview-label,
        .hero-label {
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.6px;
        }

        .eyebrow {
          color: #a1a4aa;
          margin-bottom: 7px;
        }

        .profile-topbar h1 {
          margin: 0;
          font-size: 29px;
          line-height: 1;
          letter-spacing: -1px;
          font-weight: 760;
        }

        .capture-button {
          border: 0;
          border-radius: 10px;
          background: #17191e;
          color: white;
          padding: 11px 17px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: transform .18s ease, opacity .18s ease;
        }

        .capture-button:hover {
          transform: translateY(-1px);
          opacity: .92;
        }

        .profile-hero {
          position: relative;
          min-height: 295px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 42px 48px;
          border-radius: 20px;
          background: #17191e;
          color: white;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
          max-width: 650px;
        }

        .hero-label {
          color: #9da1a8;
        }

        .profile-hero h2 {
          margin: 16px 0 17px;
          font-size: clamp(34px, 4vw, 53px);
          line-height: .98;
          letter-spacing: -2.8px;
          font-weight: 760;
        }

        .profile-hero h2 span {
          color: #8d9199;
        }

        .profile-hero p {
          max-width: 560px;
          margin: 0;
          color: #aeb2b9;
          font-size: 14px;
          line-height: 1.7;
        }

        .hero-orbit {
          position: absolute;
          right: 55px;
          top: 50%;
          width: 220px;
          height: 220px;
          transform: translateY(-50%);
        }

        .orbit {
          position: absolute;
          inset: 20px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 50%;
        }

        .orbit-two {
          inset: 0;
          transform: rotate(65deg) scaleY(.48);
          border-color: rgba(255,255,255,.11);
        }

        .orbit span {
          position: absolute;
          width: 8px;
          height: 8px;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 18px rgba(255,255,255,.35);
        }

        .orbit-two span {
          top: auto;
          bottom: 24px;
          width: 6px;
          height: 6px;
          opacity: .55;
        }

        .orbit-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 65px;
          height: 65px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.2);
          color: white;
          font-size: 20px;
          font-weight: 750;
          backdrop-filter: blur(8px);
        }

        .profile-overview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-top: 14px;
        }

        .overview-card {
          min-height: 105px;
          padding: 19px 20px;
          border: 1px solid #e5e6e9;
          border-radius: 15px;
          background: white;
        }

        .overview-label {
          display: block;
          margin-bottom: 11px;
          color: #a1a4aa;
        }

        .overview-card strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 15px;
          font-weight: 700;
        }

        .overview-card small {
          display: block;
          margin-top: 5px;
          color: #9a9da4;
          font-size: 11px;
        }

        .section {
          margin-top: 42px;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 15px;
        }

        .section-label {
          display: block;
          margin-bottom: 7px;
          color: #a1a4aa;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 21px;
          line-height: 1.1;
          letter-spacing: -.65px;
          font-weight: 750;
        }

        .section-note {
          color: #a0a3a9;
          font-size: 11px;
        }

        .settings-card,
        .settings-row,
        .account-actions,
        .delete-row {
          border: 1px solid #e4e5e8;
          border-radius: 15px;
          background: white;
        }

        .settings-card {
          padding: 25px;
        }

        .profile-heading {
          display: flex;
          align-items: center;
          gap: 15px;
          padding-bottom: 23px;
          border-bottom: 1px solid #ececef;
        }

        .large-avatar {
          width: 55px;
          height: 55px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #17191e;
          color: white;
          font-size: 20px;
          font-weight: 750;
        }

        .profile-heading h3,
        .settings-info h3,
        .privacy-card h3,
        .account-actions h3,
        .delete-row h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 720;
        }

        .profile-heading p,
        .settings-info p,
        .privacy-card p,
        .account-actions p,
        .delete-row p {
          margin: 5px 0 0;
          color: #92959c;
          font-size: 12px;
          line-height: 1.55;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 24px;
        }

        .field label {
          display: block;
          margin-bottom: 8px;
          color: #555960;
          font-size: 11px;
          font-weight: 700;
        }

        .field input {
          width: 100%;
          height: 47px;
          border: 1px solid #dfe1e5;
          border-radius: 10px;
          outline: none;
          padding: 0 13px;
          background: white;
          color: #17191e;
          font-family: inherit;
          font-size: 13px;
          transition: border-color .18s ease, box-shadow .18s ease;
        }

        .field input:focus {
          border-color: #b9bbc0;
          box-shadow: 0 0 0 3px rgba(23,25,30,.05);
        }

        .field input:disabled {
          background: #f5f6f7;
          color: #8e9198;
          cursor: not-allowed;
        }

        .field small {
          display: block;
          margin-top: 7px;
          color: #a0a3a9;
          font-size: 10px;
          line-height: 1.4;
        }

        .save-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 22px;
        }

        .primary-button,
        .secondary-button,
        .delete-button {
          border-radius: 10px;
          padding: 10px 15px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: .18s ease;
        }

        .primary-button {
          border: 0;
          background: #17191e;
          color: white;
        }

        .primary-button:hover {
          opacity: .88;
        }

        .primary-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .secondary-button {
          border: 1px solid #dfe1e5;
          background: white;
          color: #44474e;
        }

        .secondary-button:hover {
          background: #f5f6f7;
          color: #17191e;
        }

        .save-message {
          color: #777b83;
          font-size: 11px;
        }

        .settings-row {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 19px 20px;
        }

        .settings-icon {
          width: 39px;
          height: 39px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #f0f1f3;
          color: #555960;
          font-size: 19px;
        }

        .settings-info {
          flex: 1;
          min-width: 0;
        }

        .privacy-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
        }

        .account-section {
          margin-bottom: 20px;
        }

        .account-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 19px 20px;
        }

        .delete-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 10px;
          padding: 19px 20px;
          border-color: #eadcdd;
        }

        .delete-button {
          border: 1px solid #e5cacc;
          background: white;
          color: #b05259;
        }

        .delete-button:hover {
          background: #fff5f5;
        }

        .danger-label {
          color: #b05259;
        }

        .profile-footer {
          display: flex;
          justify-content: space-between;
          padding: 25px 3px 0;
          color: #a1a4aa;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.2px;
        }

        .profile-loading {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #f7f8fa;
          color: #888b92;
          font-size: 13px;
        }

        @media (max-width: 900px) {
          .profile-page {
            margin-left: 76px;
            padding: 28px 25px 50px;
          }

          .hero-orbit {
            right: 25px;
            opacity: .55;
          }
        }

        @media (max-width: 700px) {
          .profile-page {
            padding: 24px 18px 45px;
          }

          .profile-topbar {
            align-items: flex-start;
          }

          .profile-topbar h1 {
            font-size: 25px;
          }

          .capture-button {
            padding: 10px 12px;
            font-size: 11px;
          }

          .profile-hero {
            min-height: 300px;
            padding: 30px 27px;
          }

          .hero-orbit {
            display: none;
          }

          .profile-hero h2 {
            font-size: 37px;
            letter-spacing: -2px;
          }

          .profile-overview {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .privacy-card,
          .settings-row,
          .account-actions,
          .delete-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .secondary-button,
          .delete-button {
            width: 100%;
          }

          .save-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .profile-footer {
            flex-direction: column;
            gap: 7px;
          }
        }

        @media (max-width: 650px) {
          .profile-page {
            margin-left: 68px;
            padding: 22px 15px 45px;
          }
        }
      `}</style>
    </>
  );
}

