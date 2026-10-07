"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase";
import Sidebar from "../../components/sidebar";

type Reminder = {
  id: string;
  title: string;
  reminder_at: string;
  completed: boolean;
  created_at: string;
  memory_id: string | null;
};

type Memory = {
  id: string;
  title: string;
};

export default function RemindersPage() {
  const supabase = createClient();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const [reminderResult, memoryResult] = await Promise.all([
      supabase
        .from("reminders")
        .select("id,title,reminder_at,completed,created_at,memory_id")
        .eq("user_id", user.id)
        .order("reminder_at", { ascending: true }),

      supabase
        .from("memories")
        .select("id,title")
        .eq("user_id", user.id),
    ]);

    if (reminderResult.error) {
      setMessage(reminderResult.error.message);
    } else {
      setReminders(reminderResult.data || []);
    }

    if (!memoryResult.error) {
      setMemories(memoryResult.data || []);
    }

    setLoading(false);
  }

  function getMemoryTitle(memoryId: string | null) {
    if (!memoryId) return null;

    return (
      memories.find((memory) => memory.id === memoryId)?.title || null
    );
  }

  async function toggleComplete(id: string, completed: boolean) {
    const { error } = await supabase
      .from("reminders")
      .update({ completed: !completed })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === id
          ? { ...reminder, completed: !completed }
          : reminder
      )
    );
  }

  async function deleteReminder(id: string) {
    const confirmed = window.confirm("Delete this reminder?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setReminders((current) =>
      current.filter((reminder) => reminder.id !== id)
    );
  }

  const upcoming = useMemo(() => {
    return reminders.filter((reminder) => !reminder.completed);
  }, [reminders]);

  const completed = useMemo(() => {
    return reminders.filter((reminder) => reminder.completed);
  }, [reminders]);

  function formatDate(value: string) {
    const date = new Date(value);

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(value: string) {
    const date = new Date(value);

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function isOverdue(value: string) {
    return new Date(value).getTime() < Date.now();
  }

  function ReminderCard({
    reminder,
  }: {
    reminder: Reminder;
  }) {
    const memoryTitle = getMemoryTitle(reminder.memory_id);

    const overdue =
      !reminder.completed && isOverdue(reminder.reminder_at);

    return (
      <div className="reminder-card">
        <button
          className={`check ${reminder.completed ? "checked" : ""}`}
          onClick={() =>
            toggleComplete(reminder.id, reminder.completed)
          }
          aria-label="Mark reminder complete"
        >
          {reminder.completed ? "✓" : ""}
        </button>

        <div className="reminder-main">
          <div className="reminder-title-row">
            <h3
              className={
                reminder.completed ? "completed-title" : ""
              }
            >
              {reminder.title}
            </h3>

            {overdue && (
              <span className="overdue">
                Overdue
              </span>
            )}
          </div>

          <div className="reminder-date">
            <span>◷</span>
            {formatDate(reminder.reminder_at)}
            <span>·</span>
            {formatTime(reminder.reminder_at)}
          </div>

          {memoryTitle && (
            <a
              href={`/memories/${reminder.memory_id}`}
              className="linked-memory"
            >
              <span>↗</span>
              {memoryTitle}
            </a>
          )}
        </div>

        <button
          className="delete-button"
          onClick={() => deleteReminder(reminder.id)}
          aria-label="Delete reminder"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <main className="page">
      {/* SHARED SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <section className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">
              PERSONAL MEMORY
            </div>

            <h1>Reminders</h1>
          </div>

          <a href="/capture" className="capture-button">
            + Capture memory
          </a>
        </header>

        {/* HERO */}
        <section className="hero">
          <div>
            <span className="hero-label">
              MEMORY TIMELINE
            </span>

            <h2>
              Don&apos;t just remember it.
              <br />
              <span>Remember when it matters.</span>
            </h2>

            <p>
              Keep important dates and follow-ups connected
              to the memories you saved.
            </p>
          </div>

          <div className="hero-orbit">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />
            <div className="orbit-dot dot-one" />
            <div className="orbit-dot dot-two" />
            <div className="orbit-center">TM</div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats">
          <div className="stat-card">
            <span>UPCOMING</span>
            <strong>{upcoming.length}</strong>
            <p>reminders waiting</p>
          </div>

          <div className="stat-card">
            <span>COMPLETED</span>
            <strong>{completed.length}</strong>
            <p>things you handled</p>
          </div>

          <div className="stat-card">
            <span>TOTAL</span>
            <strong>{reminders.length}</strong>
            <p>saved reminders</p>
          </div>
        </section>

        {message && (
          <div className="error-message">
            {message}
          </div>
        )}

        {/* UPCOMING */}
        <section className="section">
          <div className="section-heading">
            <div>
              <span>YOUR TIMELINE</span>
              <h2>Upcoming</h2>
            </div>

            <span className="count">
              {upcoming.length}
            </span>
          </div>

          {loading ? (
            <div className="empty">
              <div className="loader" />
              <p>Loading your reminders...</p>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">◷</div>

              <h3>No upcoming reminders</h3>

              <p>
                When you create reminders for your memories,
                they will appear here.
              </p>

              <a href="/memories">
                View your memories →
              </a>
            </div>
          ) : (
            <div className="reminder-list">
              {upcoming.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                />
              ))}
            </div>
          )}
        </section>

        {/* COMPLETED */}
        {!loading && completed.length > 0 && (
          <section className="section completed-section">
            <div className="section-heading">
              <div>
                <span>HISTORY</span>
                <h2>Completed</h2>
              </div>

              <span className="count">
                {completed.length}
              </span>
            </div>

            <div className="reminder-list">
              {completed.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                />
              ))}
            </div>
          </section>
        )}
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background: #f7f8fa;
          color: #17191e;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .content {
          margin-left: 238px;
          padding: 34px 46px 70px;
          max-width: 1500px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .eyebrow {
          color: #9b9ea5;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.4px;
          margin-bottom: 5px;
        }

        .topbar h1 {
          margin: 0;
          font-size: 30px;
          letter-spacing: -1px;
        }

        .capture-button {
          background: #17191e;
          color: white;
          text-decoration: none;
          padding: 11px 17px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 650;
        }

        .hero {
          min-height: 255px;
          border-radius: 24px;
          background: #17191e;
          color: white;
          padding: 38px 42px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          overflow: hidden;
          position: relative;
        }

        .hero-label {
          color: #9ea2aa;
          font-size: 10px;
          letter-spacing: 1.7px;
          font-weight: 750;
        }

        .hero h2 {
          margin: 12px 0;
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.03;
          letter-spacing: -2px;
          max-width: 650px;
        }

        .hero h2 span {
          color: #a9adb5;
        }

        .hero p {
          color: #a9adb5;
          max-width: 500px;
          font-size: 14px;
          line-height: 1.7;
          margin: 0;
        }

        .hero-orbit {
          width: 190px;
          height: 190px;
          position: relative;
          margin-right: 45px;
          flex-shrink: 0;
        }

        .orbit-ring {
          position: absolute;
          inset: 0;
          border: 1px solid #383b42;
          border-radius: 50%;
        }

        .ring-two {
          inset: 27px;
          border-color: #454850;
        }

        .orbit-center {
          position: absolute;
          width: 55px;
          height: 55px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: #fff;
          color: #17191e;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 800;
        }

        .orbit-dot {
          position: absolute;
          width: 9px;
          height: 9px;
          background: white;
          border-radius: 50%;
        }

        .dot-one {
          top: 11px;
          left: 93px;
        }

        .dot-two {
          bottom: 22px;
          right: 8px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin: 18px 0 42px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e8e9ec;
          border-radius: 16px;
          padding: 20px;
        }

        .stat-card span {
          color: #9b9ea5;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.4px;
        }

        .stat-card strong {
          display: block;
          font-size: 28px;
          margin-top: 7px;
          letter-spacing: -1px;
        }

        .stat-card p {
          color: #92959c;
          font-size: 11px;
          margin: 3px 0 0;
        }

        .section {
          margin-top: 38px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-bottom: 15px;
        }

        .section-heading span:first-child {
          color: #9b9ea5;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.4px;
        }

        .section-heading h2 {
          margin: 5px 0 0;
          font-size: 21px;
          letter-spacing: -0.5px;
        }

        .count {
          width: 29px;
          height: 29px;
          border-radius: 9px;
          background: #e9eaed;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 700;
        }

        .reminder-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .reminder-card {
          background: white;
          border: 1px solid #e7e8eb;
          border-radius: 15px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: 0.2s ease;
        }

        .reminder-card:hover {
          border-color: #d5d7dc;
          transform: translateY(-1px);
        }

        .check {
          width: 24px;
          height: 24px;
          border: 1.5px solid #c7c9ce;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 800;
        }

        .check.checked {
          background: #17191e;
          color: white;
          border-color: #17191e;
        }

        .reminder-main {
          flex: 1;
          min-width: 0;
        }

        .reminder-title-row {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .reminder-title-row h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .completed-title {
          text-decoration: line-through;
          color: #9b9da3;
        }

        .overdue {
          font-size: 9px;
          font-weight: 750;
          color: #a44949;
          background: #faeeee;
          padding: 4px 7px;
          border-radius: 6px;
        }

        .reminder-date {
          display: flex;
          gap: 7px;
          align-items: center;
          color: #8d9097;
          font-size: 11px;
          margin-top: 7px;
        }

        .linked-memory {
          display: inline-flex;
          gap: 5px;
          align-items: center;
          margin-top: 8px;
          color: #777a82;
          text-decoration: none;
          font-size: 10px;
        }

        .linked-memory:hover {
          color: #17191e;
        }

        .delete-button {
          border: none;
          background: transparent;
          color: #b0b2b7;
          font-size: 21px;
          cursor: pointer;
          width: 30px;
          height: 30px;
          border-radius: 8px;
        }

        .delete-button:hover {
          background: #f1f2f4;
          color: #55585f;
        }

        .empty {
          background: white;
          border: 1px dashed #d9dbe0;
          border-radius: 18px;
          min-height: 190px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
        }

        .empty-icon {
          width: 43px;
          height: 43px;
          border-radius: 13px;
          background: #f0f1f3;
          display: grid;
          place-items: center;
          font-size: 20px;
          margin-bottom: 12px;
        }

        .empty h3 {
          margin: 0;
          font-size: 15px;
        }

        .empty p {
          color: #9699a0;
          font-size: 12px;
          max-width: 390px;
          line-height: 1.6;
          margin: 7px 0 12px;
        }

        .empty a {
          color: #17191e;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }

        .loader {
          width: 23px;
          height: 23px;
          border: 2px solid #e3e4e7;
          border-top-color: #17191e;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-bottom: 10px;
        }

        .error-message {
          background: #fff1f1;
          border: 1px solid #f0d2d2;
          color: #9a4141;
          padding: 12px 15px;
          border-radius: 10px;
          font-size: 12px;
          margin-bottom: 20px;
        }

        .completed-section {
          opacity: 0.85;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .content {
            padding-left: 30px;
            padding-right: 30px;
          }

          .hero-orbit {
            margin-right: 10px;
          }
        }

        @media (max-width: 900px) {
          .content {
            margin-left: 76px;
            padding: 28px 24px 60px;
          }

          .hero-orbit {
            width: 150px;
            height: 150px;
            margin-right: 0;
          }
        }

        @media (max-width: 650px) {
          .content {
            padding: 22px 15px 50px;
          }

          .topbar {
            align-items: flex-end;
          }

          .topbar h1 {
            font-size: 25px;
          }

          .capture-button {
            padding: 9px 12px;
            font-size: 11px;
          }

          .hero {
            min-height: auto;
            padding: 28px 24px;
          }

          .hero h2 {
            font-size: 30px;
          }

          .hero-orbit {
            display: none;
          }

          .stats {
            gap: 8px;
          }

          .stat-card {
            padding: 14px;
          }

          .stat-card strong {
            font-size: 22px;
          }

          .stat-card p {
            display: none;
          }

          .reminder-card {
            padding: 14px;
          }
        }
      `}</style>
    </main>
  );
}