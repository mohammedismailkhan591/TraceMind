"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

export default function ProfilePage() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [memoryCount, setMemoryCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUser(user);

    const currentName =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      "";

    setName(currentName);
    setEmail(user.email || "");

    const { count: memories } = await supabase
      .from("memories")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id);

    const { count: favorites } = await supabase
      .from("memories")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .eq("is_favorite", true);

    const { count: reminders } = await supabase
      .from("reminders")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .eq("completed", false);

    setMemoryCount(memories || 0);
    setFavoriteCount(favorites || 0);
    setReminderCount(reminders || 0);
  }

  async function saveProfile() {
    if (!user) return;

    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      data: {
        name: name.trim(),
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profile updated successfully.");
      setEditing(false);

      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          name: name.trim(),
        },
      });
    }

    setSaving(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!user) {
    return (
      <main className="loading">
        Loading profile...
      </main>
    );
  }

  const firstLetter =
    name?.trim()?.charAt(0)?.toUpperCase() ||
    email?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <main className="page">
      <aside className="sidebar">
        <div className="logo">T</div>

        <nav>
          <Link href="/dashboard">⌂</Link>
          <Link href="/capture">＋</Link>
          <Link href="/memories">▣</Link>
          <Link href="/timeline">◷</Link>
          <Link href="/reminders">◌</Link>
        </nav>

        <Link className="profileNav active" href="/profile">
          {firstLetter}
        </Link>
      </aside>

      <section className="content">
        <header>
          <div>
            <p className="eyebrow">YOUR ACCOUNT</p>

            <h1>Profile</h1>

            <p className="subtitle">
              Manage your TraceMind account and personal information.
            </p>
          </div>
        </header>

        <section className="profileHero">
          <div className="avatar">
            {firstLetter}
          </div>

          <div className="heroInfo">
            <h2>{name || "TraceMind user"}</h2>
            <p>{email}</p>
            <span>TraceMind member</span>
          </div>

          {!editing && (
            <button
              className="editButton"
              onClick={() => setEditing(true)}
            >
              Edit profile
            </button>
          )}
        </section>

        <section className="stats">
          <div>
            <span>Memories</span>
            <strong>{memoryCount}</strong>
            <small>Information saved</small>
          </div>

          <div>
            <span>Favorites</span>
            <strong>{favoriteCount}</strong>
            <small>Important memories</small>
          </div>

          <div>
            <span>Reminders</span>
            <strong>{reminderCount}</strong>
            <small>Still to remember</small>
          </div>
        </section>

        <div className="profileGrid">
          <section className="card">
            <div className="cardHeader">
              <div>
                <p className="eyebrow">PERSONAL INFORMATION</p>
                <h2>Account details</h2>
              </div>
            </div>

            <div className="form">
              <label>Name</label>

              {editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              ) : (
                <div className="value">
                  {name || "Not set"}
                </div>
              )}

              <label>Email</label>

              <div className="value muted">
                {email}
              </div>

              {editing && (
                <div className="actions">
                  <button
                    className="cancel"
                    onClick={() => {
                      setEditing(false);
                      setMessage("");
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="save"
                    onClick={saveProfile}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              )}

              {message && (
                <p className="message">{message}</p>
              )}
            </div>
          </section>

          <section className="card">
            <div className="cardHeader">
              <div>
                <p className="eyebrow">QUICK ACCESS</p>
                <h2>Your TraceMind</h2>
              </div>
            </div>

            <div className="links">
              <Link href="/memories">
                <div>
                  <strong>My memories</strong>
                  <span>Browse everything you've saved</span>
                </div>
                <span>→</span>
              </Link>

              <Link href="/timeline">
                <div>
                  <strong>Memory timeline</strong>
                  <span>See when you captured information</span>
                </div>
                <span>→</span>
              </Link>

              <Link href="/reminders">
                <div>
                  <strong>Reminders</strong>
                  <span>Keep track of important dates</span>
                </div>
                <span>→</span>
              </Link>

              <Link href="/capture">
                <div>
                  <strong>Capture something</strong>
                  <span>Save new information</span>
                </div>
                <span>→</span>
              </Link>
            </div>
          </section>
        </div>

        <section className="security card">
          <div>
            <p className="eyebrow">ACCOUNT</p>
            <h2>Sign out</h2>
            <p>
              Sign out of your TraceMind account on this device.
            </p>
          </div>

          <button className="signOut" onClick={signOut}>
            Sign out
          </button>
        </section>
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 80% 0%,
              rgba(99, 102, 241, 0.08),
              transparent 30%
            ),
            #f7f8fc;
          color: #171923;
        }

        .loading {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #f7f8fc;
          color: #73798a;
        }

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 82px;
          background: rgba(255, 255, 255, 0.94);
          border-right: 1px solid #e7e9f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 20;
        }

        .logo {
          width: 42px;
          height: 42px;
          margin-top: 24px;
          border-radius: 13px;
          background: #171923;
          color: white;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 20px;
        }

        nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        nav a {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #858b9b;
          text-decoration: none;
          font-size: 21px;
          transition: 0.2s;
        }

        nav a:hover {
          background: #eef0ff;
          color: #4f46e5;
        }

        .profileNav {
          position: absolute;
          bottom: 24px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #eef0ff;
          color: #4f46e5;
          display: grid;
          place-items: center;
          text-decoration: none;
          font-weight: 800;
          border: 2px solid transparent;
        }

        .profileNav.active {
          border-color: #818cf8;
        }

        .content {
          margin-left: 82px;
          padding: 55px 6%;
          max-width: 1400px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #73798a;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        h1 {
          margin: 0;
          font-size: clamp(34px, 4vw, 50px);
          letter-spacing: -0.04em;
        }

        .subtitle {
          margin: 12px 0 0;
          color: #73798a;
        }

        .profileHero {
          margin-top: 35px;
          padding: 28px;
          background: white;
          border: 1px solid #e7e9f0;
          border-radius: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .avatar {
          width: 78px;
          height: 78px;
          border-radius: 24px;
          background: #171923;
          color: white;
          display: grid;
          place-items: center;
          font-size: 29px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .heroInfo {
          flex: 1;
        }

        .heroInfo h2 {
          margin: 0;
          font-size: 25px;
        }

        .heroInfo p {
          margin: 5px 0;
          color: #73798a;
        }

        .heroInfo span {
          color: #4f46e5;
          font-size: 11px;
          font-weight: 700;
        }

        .editButton {
          border: 1px solid #dfe2eb;
          background: white;
          border-radius: 11px;
          padding: 11px 16px;
          cursor: pointer;
          font-weight: 700;
        }

        .stats {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .stats div {
          background: white;
          border: 1px solid #e7e9f0;
          border-radius: 18px;
          padding: 20px;
        }

        .stats span {
          display: block;
          color: #73798a;
          font-size: 12px;
        }

        .stats strong {
          display: block;
          margin-top: 7px;
          font-size: 28px;
        }

        .stats small {
          display: block;
          margin-top: 3px;
          color: #a0a4af;
          font-size: 10px;
        }

        .profileGrid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .card {
          background: white;
          border: 1px solid #e7e9f0;
          border-radius: 21px;
          padding: 22px;
        }

        .cardHeader h2 {
          margin: 0;
          font-size: 21px;
        }

        .form {
          margin-top: 22px;
        }

        label {
          display: block;
          margin-bottom: 7px;
          color: #555b6b;
          font-size: 12px;
          font-weight: 700;
        }

        input {
          width: 100%;
          padding: 13px;
          border: 1px solid #dfe2eb;
          border-radius: 11px;
          outline: none;
          font-size: 14px;
        }

        input:focus {
          border-color: #818cf8;
        }

        .value {
          padding: 13px;
          margin-bottom: 18px;
          border-radius: 11px;
          background: #f7f8fc;
          font-size: 14px;
        }

        .muted {
          color: #73798a;
        }

        .actions {
          margin-top: 18px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .actions button {
          border: 0;
          border-radius: 10px;
          padding: 11px 15px;
          cursor: pointer;
          font-weight: 700;
        }

        .cancel {
          background: #eef0f4;
          color: #555b6b;
        }

        .save {
          background: #171923;
          color: white;
        }

        .save:disabled {
          opacity: 0.5;
        }

        .message {
          margin: 13px 0 0;
          color: #4f46e5;
          font-size: 12px;
        }

        .links {
          margin-top: 18px;
        }

        .links a {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid #f0f1f4;
          text-decoration: none;
          color: #171923;
        }

        .links a:last-child {
          border-bottom: 0;
        }

        .links strong {
          display: block;
          font-size: 13px;
        }

        .links span {
          color: #858b9b;
          font-size: 11px;
        }

        .links a > span {
          font-size: 17px;
        }

        .security {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .security h2 {
          margin: 0;
          font-size: 18px;
        }

        .security p:last-child {
          margin: 5px 0 0;
          color: #858b9b;
          font-size: 12px;
        }

        .signOut {
          border: 1px solid #e2d7d7;
          background: white;
          color: #b33a3a;
          padding: 11px 16px;
          border-radius: 11px;
          cursor: pointer;
          font-weight: 700;
        }

        @media (max-width: 750px) {
          .sidebar {
            width: 65px;
          }

          .content {
            margin-left: 65px;
            padding: 35px 18px;
          }

          .profileHero {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .editButton {
            width: 100%;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .profileGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}