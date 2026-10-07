"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "../../components/Logo";
import { createClient } from "../../lib/supabase";

type Reminder = {
  id: string;
  title: string;
  reminder_at: string;
  completed: boolean;
  memory_id: string | null;
};

export default function RemindersPage() {
  const supabase = createClient();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("reminders")
      .select("id,title,reminder_at,completed,memory_id")
      .eq("user_id", user.id)
      .order("reminder_at", { ascending: true });

    if (!error) {
      setReminders(data || []);
    }

    setLoading(false);
  }

  async function toggleReminder(
    id: string,
    completed: boolean
  ) {
    const { error } = await supabase
      .from("reminders")
      .update({
        completed: !completed,
      })
      .eq("id", id);

    if (!error) {
      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === id
            ? {
                ...reminder,
                completed: !completed,
              }
            : reminder
        )
      );
    }
  }

  async function deleteReminder(id: string) {
    const confirmed = window.confirm(
      "Delete this reminder?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id);

    if (!error) {
      setReminders((current) =>
        current.filter((reminder) => reminder.id !== id)
      );
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function isPast(date: string) {
    return new Date(date).getTime() < Date.now();
  }

  const upcoming = reminders.filter(
    (reminder) =>
      !reminder.completed &&
      !isPast(reminder.reminder_at)
  );

  const overdue = reminders.filter(
    (reminder) =>
      !reminder.completed &&
      isPast(reminder.reminder_at)
  );

  const completed = reminders.filter(
    (reminder) => reminder.completed
  );

  return (
    <main className="page">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <Link href="/dashboard" className="logo">
          <Logo />
        </Link>

        <nav>

          <Link href="/dashboard" className="nav">
            <span>⌂</span>
            <label>Dashboard</label>
          </Link>

          <Link href="/capture" className="nav">
            <span>＋</span>
            <label>Capture</label>
          </Link>

          <Link href="/memories" className="nav">
            <span>▣</span>
            <label>Memories</label>
          </Link>

          <Link href="/timeline" className="nav">
            <span>◇</span>
            <label>Timeline</label>
          </Link>

          <Link
            href="/reminders"
            className="nav active"
          >
            <span>◷</span>
            <label>Reminders</label>
          </Link>

        </nav>

      </aside>

      {/* MAIN */}

      <div className="main">

        <header>

          <div>
            <p>PERSONAL MEMORY</p>
            <h1>Reminders</h1>
          </div>

          <Link href="/capture" className="capture">
            + Capture memory
          </Link>

        </header>

        {/* HERO */}

        <section className="hero">

          <div>

            <p className="label">
              DON'T FORGET WHAT MATTERS
            </p>

            <h2>
              Your important
              <br />
              moments, on time.
            </h2>

            <p className="description">
              TraceMind keeps track of reminders connected
              to the information you've saved.
            </p>

          </div>

          <div className="hero-number">
            <strong>{upcoming.length}</strong>
            <span>upcoming</span>
          </div>

        </section>

        {/* STATS */}

        <section className="stats">

          <div className="stat">
            <span>UPCOMING</span>
            <strong>{upcoming.length}</strong>
          </div>

          <div className="stat">
            <span>OVERDUE</span>
            <strong>{overdue.length}</strong>
          </div>

          <div className="stat">
            <span>COMPLETED</span>
            <strong>{completed.length}</strong>
          </div>

        </section>

        {/* REMINDERS */}

        <section>

          {loading ? (

            <div className="empty">
              Loading your reminders...
            </div>

          ) : reminders.length === 0 ? (

            <div className="empty">

              <div className="empty-icon">
                ◷
              </div>

              <h3>No reminders yet</h3>

              <p>
                Your saved information can have reminders
                attached to it.
              </p>

              <Link href="/capture">
                Capture a memory →
              </Link>

            </div>

          ) : (

            <>

              {/* OVERDUE */}

              {overdue.length > 0 && (
                <ReminderGroup
                  title="Needs attention"
                  subtitle="These reminders have passed."
                  reminders={overdue}
                  toggleReminder={toggleReminder}
                  deleteReminder={deleteReminder}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  overdue
                />
              )}

              {/* UPCOMING */}

              {upcoming.length > 0 && (
                <ReminderGroup
                  title="Upcoming"
                  subtitle="Things you asked TraceMind to remember."
                  reminders={upcoming}
                  toggleReminder={toggleReminder}
                  deleteReminder={deleteReminder}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              )}

              {/* COMPLETED */}

              {completed.length > 0 && (
                <ReminderGroup
                  title="Completed"
                  subtitle="Reminders you've already handled."
                  reminders={completed}
                  toggleReminder={toggleReminder}
                  deleteReminder={deleteReminder}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              )}

            </>

          )}

        </section>

      </div>

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background: #f7f8fb;
          color: #101828;

          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* SIDEBAR */

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;

          width: 125px;
          height: 100vh;

          background: white;
          border-right: 1px solid #eaecf0;

          display: flex;
          flex-direction: column;
          align-items: center;

          padding: 25px 12px;

          z-index: 20;
        }

        .logo {
          display: block;
          margin-bottom: 80px;
        }

        nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .nav {
          width: 70px;
          min-height: 58px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 4px;

          color: #98a2b3;
          text-decoration: none;

          border-radius: 16px;

          transition: .2s;
        }

        .nav span {
          font-size: 22px;
        }

        .nav label {
          font-size: 8px;
          font-weight: 700;
        }

        .nav:hover {
          background: #f2f4f7;
          color: #101828;
        }

        .nav.active {
          background: #17191f;
          color: white;
        }

        /* MAIN */

        .main {
          margin-left: 125px;
          width: calc(100% - 125px);

          max-width: 1200px;

          padding: 70px 6% 100px;
        }

        header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          margin-bottom: 35px;
        }

        header p {
          margin: 0 0 8px;

          color: #98a2b3;

          font-size: 11px;
          font-weight: 800;

          letter-spacing: .14em;
        }

        header h1 {
          margin: 0;

          font-size: 48px;
          letter-spacing: -.05em;
        }

        .capture {
          background: #17191f;
          color: white;

          text-decoration: none;

          padding: 16px 20px;

          border-radius: 13px;

          font-size: 13px;
          font-weight: 800;
        }

        /* HERO */

        .hero {
          background: #17191f;
          color: white;

          border-radius: 28px;

          padding: 48px 52px;

          margin-bottom: 12px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 30px;
        }

        .label {
          margin: 0;

          color: #98a2b3;

          font-size: 11px;
          font-weight: 800;

          letter-spacing: .15em;
        }

        .hero h2 {
          margin: 17px 0 20px;

          font-size: clamp(36px, 5vw, 58px);

          line-height: .98;

          letter-spacing: -.055em;
        }

        .description {
          max-width: 550px;

          margin: 0;

          color: #aeb3bd;

          font-size: 13px;

          line-height: 1.7;
        }

        .hero-number {
          min-width: 150px;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          padding: 25px;

          border: 1px solid rgba(255,255,255,.12);

          border-radius: 20px;
        }

        .hero-number strong {
          font-size: 55px;

          line-height: 1;

          letter-spacing: -.06em;
        }

        .hero-number span {
          margin-top: 8px;

          color: #98a2b3;

          font-size: 10px;

          text-transform: uppercase;

          letter-spacing: .12em;
        }

        /* STATS */

        .stats {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 10px;

          margin-bottom: 45px;
        }

        .stat {
          background: white;

          border: 1px solid #eaecf0;

          border-radius: 16px;

          padding: 22px;
        }

        .stat span {
          display: block;

          margin-bottom: 10px;

          color: #98a2b3;

          font-size: 9px;

          font-weight: 800;

          letter-spacing: .13em;
        }

        .stat strong {
          font-size: 30px;

          letter-spacing: -.04em;
        }

        /* GROUP */

        .group {
          margin-bottom: 40px;
        }

        .group-heading {
          margin-bottom: 15px;
        }

        .group-heading h2 {
          margin: 0 0 5px;

          font-size: 21px;

          letter-spacing: -.03em;
        }

        .group-heading p {
          margin: 0;

          color: #98a2b3;

          font-size: 11px;
        }

        /* REMINDER */

        .reminder-list {
          display: flex;

          flex-direction: column;

          gap: 10px;
        }

        .reminder {
          background: white;

          border: 1px solid #eaecf0;

          border-radius: 17px;

          padding: 18px;

          display: flex;

          align-items: center;

          gap: 15px;
        }

        .reminder.done {
          opacity: .6;
        }

        .check {
          width: 38px;
          height: 38px;

          flex-shrink: 0;

          border: 1px solid #d0d5dd;

          border-radius: 50%;

          background: white;

          cursor: pointer;

          display: grid;
          place-items: center;

          font-size: 15px;
        }

        .check.checked {
          background: #17191f;
          color: white;
          border-color: #17191f;
        }

        .reminder-info {
          flex: 1;

          min-width: 0;
        }

        .reminder-info h3 {
          margin: 0 0 6px;

          font-size: 14px;
        }

        .reminder-info p {
          margin: 0;

          color: #667085;

          font-size: 10px;
        }

        .overdue {
          color: #b42318 !important;
          font-weight: 800;
        }

        .open-memory {
          color: #667085;

          font-size: 10px;

          text-decoration: none;

          white-space: nowrap;
        }

        .delete {
          border: 0;

          background: transparent;

          color: #98a2b3;

          font-size: 18px;

          cursor: pointer;

          padding: 5px;
        }

        .delete:hover {
          color: #101828;
        }

        /* EMPTY */

        .empty {
          min-height: 260px;

          background: white;

          border: 1px solid #eaecf0;

          border-radius: 18px;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          text-align: center;

          padding: 30px;

          color: #98a2b3;
        }

        .empty-icon {
          width: 55px;
          height: 55px;

          display: grid;
          place-items: center;

          border: 1px dashed #d0d5dd;

          border-radius: 50%;

          margin-bottom: 15px;

          font-size: 20px;
        }

        .empty h3 {
          margin: 0 0 7px;

          color: #101828;

          font-size: 17px;
        }

        .empty p {
          margin: 0 0 16px;

          font-size: 12px;
        }

        .empty a {
          color: #101828;

          font-size: 12px;

          font-weight: 800;

          text-decoration: none;
        }

        /* MOBILE */

        @media (max-width: 700px) {

          .sidebar {
            width: 82px;
            padding: 20px 8px;
          }

          .main {
            margin-left: 82px;
            width: calc(100% - 82px);

            padding: 45px 5%;
          }

          .logo {
            margin-bottom: 55px;
          }

          .nav {
            width: 60px;
          }

          header {
            flex-direction: column;
            align-items: flex-start;
            gap: 18px;
          }

          header h1 {
            font-size: 40px;
          }

          .capture {
            width: 100%;
            text-align: center;
          }

          .hero {
            padding: 35px 25px;

            flex-direction: column;

            align-items: flex-start;
          }

          .hero h2 {
            font-size: 38px;
          }

          .hero-number {
            width: 100%;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .reminder {
            align-items: flex-start;
          }

          .open-memory {
            display: none;
          }

        }

      `}</style>

    </main>
  );
}

/* REMINDER GROUP */

function ReminderGroup({
  title,
  subtitle,
  reminders,
  toggleReminder,
  deleteReminder,
  formatDate,
  formatTime,
  overdue = false,
}: {
  title: string;
  subtitle: string;
  reminders: Reminder[];
  toggleReminder: (
    id: string,
    completed: boolean
  ) => void;
  deleteReminder: (id: string) => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  overdue?: boolean;
}) {
  return (
    <div className="group">

      <div className="group-heading">

        <h2>{title}</h2>

        <p>{subtitle}</p>

      </div>

      <div className="reminder-list">

        {reminders.map((reminder) => (

          <div
            className={`reminder ${
              reminder.completed ? "done" : ""
            }`}
            key={reminder.id}
          >

            <button
              className={`check ${
                reminder.completed ? "checked" : ""
              }`}
              onClick={() =>
                toggleReminder(
                  reminder.id,
                  reminder.completed
                )
              }
              aria-label="Complete reminder"
            >
              {reminder.completed ? "✓" : ""}
            </button>

            <div className="reminder-info">

              <h3>{reminder.title}</h3>

              <p className={overdue ? "overdue" : ""}>
                {overdue
                  ? "Overdue · "
                  : ""}
                {formatDate(reminder.reminder_at)}
                {" · "}
                {formatTime(reminder.reminder_at)}
              </p>

            </div>

            {reminder.memory_id && (
              <Link
                href={`/memories/${reminder.memory_id}`}
                className="open-memory"
              >
                Open memory →
              </Link>
            )}

            <button
              className="delete"
              onClick={() =>
                deleteReminder(reminder.id)
              }
              aria-label="Delete reminder"
            >
              ×
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}