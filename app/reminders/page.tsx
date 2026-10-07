"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

type Reminder = {
  id: string;
  title: string;
  reminder_at: string;
  completed: boolean;
  memory_id: string | null;
  created_at: string;
  memories?: {
    title: string;
  } | null;
};

/* =========================
   ICONS
========================= */

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function CaptureIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function MemoriesIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ReminderIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

/* =========================
   HELPERS
========================= */

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

function isOverdue(reminder: Reminder) {
  return (
    !reminder.completed &&
    new Date(reminder.reminder_at).getTime() <
      Date.now()
  );
}

/* =========================
   PAGE
========================= */

export default function RemindersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "All" | "Upcoming" | "Overdue" | "Completed"
  >("All");

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("reminders")
      .select(
        `
          id,
          title,
          reminder_at,
          completed,
          memory_id,
          created_at,
          memories (
            title
          )
        `
      )
      .eq("user_id", user.id)
      .order("reminder_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error loading reminders:",
        error
      );

      setReminders([]);
    } else {
      const normalizedReminders = (
        data ?? []
      ).map((item) => ({
        ...item,
        memories: Array.isArray(item.memories)
          ? item.memories[0] ?? null
          : item.memories ?? null,
      })) as Reminder[];

      setReminders(normalizedReminders);
    }

    setLoading(false);
  }

  async function toggleCompleted(
    reminder: Reminder
  ) {
    if (updating === reminder.id) return;

    setUpdating(reminder.id);

    const { error } = await supabase
      .from("reminders")
      .update({
        completed: !reminder.completed,
      })
      .eq("id", reminder.id);

    if (!error) {
      setReminders((current) =>
        current.map((item) =>
          item.id === reminder.id
            ? {
                ...item,
                completed: !item.completed,
              }
            : item
        )
      );
    }

    setUpdating(null);
  }

  async function deleteReminder(
    reminder: Reminder
  ) {
    if (deleting === reminder.id) return;

    const confirmed = window.confirm(
      "Delete this reminder?"
    );

    if (!confirmed) return;

    setDeleting(reminder.id);

    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", reminder.id);

    if (!error) {
      setReminders((current) =>
        current.filter(
          (item) => item.id !== reminder.id
        )
      );
    }

    setDeleting(null);
  }

  const upcomingCount = reminders.filter(
    (reminder) =>
      !reminder.completed &&
      !isOverdue(reminder)
  ).length;

  const overdueCount = reminders.filter(
    (reminder) =>
      isOverdue(reminder)
  ).length;

  const completedCount = reminders.filter(
    (reminder) =>
      reminder.completed
  ).length;

  const filteredReminders = useMemo(() => {
    if (filter === "Upcoming") {
      return reminders.filter(
        (reminder) =>
          !reminder.completed &&
          !isOverdue(reminder)
      );
    }

    if (filter === "Overdue") {
      return reminders.filter(
        (reminder) =>
          isOverdue(reminder)
      );
    }

    if (filter === "Completed") {
      return reminders.filter(
        (reminder) =>
          reminder.completed
      );
    }

    return reminders;
  }, [reminders, filter]);

  return (
    <div className="tm-page">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="tm-sidebar">

        <div className="tm-brand">
          <div className="tm-brand-mark">
            T
          </div>

          <span>TraceMind</span>
        </div>

        <nav className="tm-navigation">

          <Link
            href="/dashboard"
            className="tm-navigation-item"
          >
            <span className="tm-icon">
              <DashboardIcon />
            </span>

            <span className="tm-label">
              Dashboard
            </span>
          </Link>

          <Link
            href="/capture"
            className="tm-navigation-item"
          >
            <span className="tm-icon">
              <CaptureIcon />
            </span>

            <span className="tm-label">
              Capture
            </span>
          </Link>

          <Link
            href="/memories"
            className="tm-navigation-item"
          >
            <span className="tm-icon">
              <MemoriesIcon />
            </span>

            <span className="tm-label">
              Memories
            </span>
          </Link>

          <Link
            href="/timeline"
            className="tm-navigation-item"
          >
            <span className="tm-icon">
              <TimelineIcon />
            </span>

            <span className="tm-label">
              Timeline
            </span>
          </Link>

          <Link
            href="/reminders"
            className="tm-navigation-item tm-navigation-active"
          >
            <span className="tm-icon">
              <ReminderIcon />
            </span>

            <span className="tm-label">
              Reminders
            </span>
          </Link>

        </nav>

        <div className="tm-profile-navigation">

          <Link
            href="/profile"
            className="tm-navigation-item"
          >
            <span className="tm-icon">
              <ProfileIcon />
            </span>

            <span className="tm-label">
              Profile
            </span>
          </Link>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="tm-main">

        <div className="tm-content">

          {/* HEADER */}

          <header className="tm-header">

            <div>

              <p className="tm-eyebrow">
                YOUR INFORMATION
              </p>

              <h1>Reminders</h1>

              <p className="tm-subtitle">
                Keep track of information you
                need to remember.
              </p>

            </div>

            <Link
              href="/capture"
              className="tm-capture-button"
            >
              <span>+</span>
              Capture
            </Link>

          </header>

          {/* FILTERS */}

          <div className="tm-filters">

            <button
              type="button"
              className={
                filter === "All"
                  ? "tm-filter tm-filter-active"
                  : "tm-filter"
              }
              onClick={() =>
                setFilter("All")
              }
            >
              All
            </button>

            <button
              type="button"
              className={
                filter === "Upcoming"
                  ? "tm-filter tm-filter-active"
                  : "tm-filter"
              }
              onClick={() =>
                setFilter("Upcoming")
              }
            >
              Upcoming
            </button>

            <button
              type="button"
              className={
                filter === "Overdue"
                  ? "tm-filter tm-filter-active"
                  : "tm-filter"
              }
              onClick={() =>
                setFilter("Overdue")
              }
            >
              Overdue
            </button>

            <button
              type="button"
              className={
                filter === "Completed"
                  ? "tm-filter tm-filter-active"
                  : "tm-filter"
              }
              onClick={() =>
                setFilter("Completed")
              }
            >
              Completed
            </button>

          </div>

          {/* SUMMARY */}

          <div className="tm-summary">

            <span>
              <strong>
                {filteredReminders.length}
              </strong>{" "}
              {filteredReminders.length === 1
                ? "reminder"
                : "reminders"}
            </span>

            <span>
              {upcomingCount} upcoming
            </span>

          </div>

          {/* LOADING */}

          {loading && (
            <div className="tm-loading">

              <div className="tm-spinner" />

              <p>
                Loading your reminders...
              </p>

            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            filteredReminders.length === 0 && (
              <div className="tm-empty">

                <div className="tm-empty-icon">
                  <ReminderIcon />
                </div>

                <h2>
                  {filter === "All"
                    ? "No reminders yet"
                    : `No ${filter.toLowerCase()} reminders`}
                </h2>

                <p>
                  {filter === "All"
                    ? "Reminders connected to your saved information will appear here."
                    : "There are no reminders in this category right now."}
                </p>

                {filter === "All" && (
                  <Link
                    href="/capture"
                    className="tm-empty-button"
                  >
                    Capture something
                  </Link>
                )}

              </div>
            )}

          {/* REMINDER CARDS */}

          {!loading &&
            filteredReminders.length > 0 && (
              <div className="tm-reminder-list">

                {filteredReminders.map(
                  (reminder) => {

                    const overdue =
                      isOverdue(reminder);

                    return (
                      <div
                        key={reminder.id}
                        className={
                          reminder.completed
                            ? "tm-reminder-card tm-reminder-completed"
                            : "tm-reminder-card"
                        }
                      >

                        {/* LEFT */}

                        <div className="tm-reminder-main">

                          <button
                            type="button"
                            className={
                              reminder.completed
                                ? "tm-check tm-check-active"
                                : "tm-check"
                            }
                            onClick={() =>
                              toggleCompleted(
                                reminder
                              )
                            }
                            disabled={
                              updating ===
                              reminder.id
                            }
                            aria-label={
                              reminder.completed
                                ? "Mark incomplete"
                                : "Mark complete"
                            }
                          >
                            <CheckIcon />
                          </button>

                          <div className="tm-reminder-content">

                            <h2>
                              {reminder.title}
                            </h2>

                            {reminder.memories?.title && (
                              <Link
                                href={`/memories/${reminder.memory_id}`}
                                className="tm-memory-link"
                              >
                                From memory:{" "}
                                {
                                  reminder
                                    .memories
                                    .title
                                }
                              </Link>
                            )}

                            <div className="tm-reminder-meta">

                              <span
                                className={
                                  overdue
                                    ? "tm-date tm-date-overdue"
                                    : "tm-date"
                                }
                              >
                                {formatDate(
                                  reminder.reminder_at
                                )}
                              </span>

                              <span className="tm-time">
                                {formatTime(
                                  reminder.reminder_at
                                )}
                              </span>

                              {overdue &&
                                !reminder.completed && (
                                  <span className="tm-overdue">
                                    OVERDUE
                                  </span>
                                )}

                              {reminder.completed && (
                                <span className="tm-completed">
                                  COMPLETED
                                </span>
                              )}

                            </div>

                          </div>

                        </div>

                        {/* DELETE */}

                        <button
                          type="button"
                          className="tm-delete"
                          onClick={() =>
                            deleteReminder(
                              reminder
                            )
                          }
                          disabled={
                            deleting ===
                            reminder.id
                          }
                          aria-label="Delete reminder"
                        >
                          <TrashIcon />
                        </button>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          {/* STATS */}

          {!loading &&
            reminders.length > 0 && (
              <div className="tm-stats">

                <div className="tm-stat">

                  <span className="tm-stat-label">
                    UPCOMING
                  </span>

                  <strong>
                    {upcomingCount}
                  </strong>

                </div>

                <div className="tm-stat">

                  <span className="tm-stat-label">
                    OVERDUE
                  </span>

                  <strong>
                    {overdueCount}
                  </strong>

                </div>

                <div className="tm-stat">

                  <span className="tm-stat-label">
                    COMPLETED
                  </span>

                  <strong>
                    {completedCount}
                  </strong>

                </div>

              </div>
            )}

        </div>

      </main>

      {/* =========================
          STYLES
      ========================= */}

      <style jsx>{`

        /* =================================
           PAGE
        ================================= */

        .tm-page {
          min-height: 100vh;
          background: #fafafa;
          color: #171717;
        }

        /* =================================
           SIDEBAR
        ================================= */

        .tm-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;

          width: 210px;

          padding: 26px 14px;

          background: #ffffff;

          border-right: 1px solid #e7e7e7;

          display: flex;
          flex-direction: column;

          z-index: 9999;

          box-sizing: border-box;
        }

        .tm-brand {
          display: flex;
          align-items: center;

          gap: 10px;

          padding: 0 10px;

          margin-bottom: 34px;

          color: #171717;

          font-size: 18px;
          font-weight: 700;

          white-space: nowrap;
        }

        .tm-brand-mark {
          width: 34px;
          height: 34px;

          flex: 0 0 34px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          background: #171717;
          color: #ffffff;

          font-size: 16px;
          font-weight: 700;
        }

        .tm-navigation {
          width: 100%;

          display: flex;
          flex-direction: column;

          gap: 5px;
        }

        .tm-navigation-item {
          width: 100%;
          height: 45px;

          box-sizing: border-box;

          padding: 0 12px;

          display: flex;
          align-items: center;

          gap: 12px;

          border-radius: 9px;

          background: transparent;

          color: #666666;

          text-decoration: none;

          font-size: 14px;
          font-weight: 500;

          line-height: 1;

          white-space: nowrap;

          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .tm-navigation-item:hover {
          background: #f5f5f5;
          color: #171717;
        }

        .tm-navigation-active {
          background: #eeeeee;
          color: #171717;
          font-weight: 650;
        }

        .tm-icon {
          width: 20px;
          height: 20px;

          min-width: 20px;
          min-height: 20px;

          max-width: 20px;
          max-height: 20px;

          flex: 0 0 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;
        }

        .tm-icon svg {
          width: 20px !important;
          height: 20px !important;

          min-width: 20px !important;
          min-height: 20px !important;

          max-width: 20px !important;
          max-height: 20px !important;

          display: block !important;

          fill: none !important;

          stroke: currentColor !important;

          stroke-width: 1.8 !important;
        }

        .tm-label {
          display: block;

          font-size: 14px;

          line-height: 1;

          white-space: nowrap;
        }

        .tm-profile-navigation {
          width: 100%;

          margin-top: auto;

          padding-top: 16px;

          border-top: 1px solid #eeeeee;
        }

        /* =================================
           MAIN
        ================================= */

        .tm-main {
          min-height: 100vh;

          margin-left: 210px;
        }

        .tm-content {
          width: min(
            1180px,
            calc(100% - 64px)
          );

          margin: 0 auto;

          padding: 52px 0 70px;
        }

        /* =================================
           HEADER
        ================================= */

        .tm-header {
          display: flex;

          align-items: flex-end;

          justify-content: space-between;

          gap: 30px;

          margin-bottom: 30px;
        }

        .tm-eyebrow {
          margin: 0 0 8px;

          color: #8a8a8a;

          font-size: 11px;
          font-weight: 700;

          letter-spacing: 0.14em;
        }

        .tm-header h1 {
          margin: 0;

          color: #171717;

          font-size: 36px;

          line-height: 1.1;

          letter-spacing: -0.035em;

          font-weight: 700;
        }

        .tm-subtitle {
          margin: 10px 0 0;

          color: #777777;

          font-size: 15px;
        }

        .tm-capture-button {
          height: 44px;

          padding: 0 18px;

          display: inline-flex;

          align-items: center;
          justify-content: center;

          gap: 9px;

          border-radius: 9px;

          background: #171717;

          color: #ffffff;

          text-decoration: none;

          font-size: 14px;
          font-weight: 600;
        }

        .tm-capture-button:hover {
          background: #303030;
        }

        .tm-capture-button span {
          font-size: 20px;
          line-height: 1;
        }

        /* =================================
           FILTERS
        ================================= */

        .tm-filters {
          display: flex;

          flex-wrap: wrap;

          gap: 8px;

          margin-bottom: 22px;
        }

        .tm-filter {
          height: 34px;

          padding: 0 13px;

          border: 1px solid #e2e2e2;

          border-radius: 7px;

          background: #ffffff;

          color: #707070;

          font-size: 12px;

          font-weight: 600;

          cursor: pointer;
        }

        .tm-filter:hover {
          border-color: #cccccc;
        }

        .tm-filter-active {
          background: #171717;

          border-color: #171717;

          color: #ffffff;
        }

        /* =================================
           SUMMARY
        ================================= */

        .tm-summary {
          display: flex;

          align-items: center;

          justify-content: space-between;

          padding: 0 2px 14px;

          color: #777777;

          font-size: 13px;
        }

        .tm-summary strong {
          color: #171717;

          font-weight: 700;
        }

        /* =================================
           REMINDER LIST
        ================================= */

        .tm-reminder-list {
          display: flex;

          flex-direction: column;

          gap: 12px;
        }

        .tm-reminder-card {
          min-height: 92px;

          padding: 17px 18px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 18px;

          background: #ffffff;

          border: 1px solid #e5e5e5;

          border-radius: 13px;

          box-sizing: border-box;

          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .tm-reminder-card:hover {
          border-color: #d4d4d4;

          box-shadow:
            0 8px 24px
            rgba(0, 0, 0, 0.04);
        }

        .tm-reminder-main {
          min-width: 0;

          display: flex;

          align-items: flex-start;

          gap: 14px;
        }

        /* =================================
           CHECK
        ================================= */

        .tm-check {
          width: 24px;
          height: 24px;

          margin-top: 1px;

          padding: 0;

          flex: 0 0 24px;

          display: flex;

          align-items: center;
          justify-content: center;

          border: 1.5px solid #cfcfcf;

          border-radius: 7px;

          background: #ffffff;

          color: #ffffff;

          cursor: pointer;
        }

        .tm-check:hover {
          border-color: #777777;
        }

        .tm-check svg {
          width: 15px;
          height: 15px;

          fill: none;

          stroke: currentColor;

          stroke-width: 2;
        }

        .tm-check-active {
          border-color: #171717;

          background: #171717;

          color: #ffffff;
        }

        /* =================================
           CONTENT
        ================================= */

        .tm-reminder-content {
          min-width: 0;

          display: flex;

          flex-direction: column;

          gap: 7px;
        }

        .tm-reminder-content h2 {
          margin: 0;

          color: #171717;

          font-size: 16px;

          line-height: 1.4;

          font-weight: 700;

          overflow-wrap: anywhere;
        }

        .tm-memory-link {
          width: fit-content;

          max-width: 100%;

          color: #777777;

          text-decoration: none;

          font-size: 12px;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        .tm-memory-link:hover {
          color: #171717;

          text-decoration: underline;
        }

        .tm-reminder-meta {
          display: flex;

          align-items: center;

          flex-wrap: wrap;

          gap: 9px;

          font-size: 12px;
        }

        .tm-date {
          color: #5f5f5f;

          font-weight: 600;
        }

        .tm-date-overdue {
          color: #171717;

          font-weight: 700;
        }

        .tm-time {
          color: #999999;

          font-size: 11px;
        }

        .tm-overdue {
          padding: 4px 7px;

          border-radius: 5px;

          background: #f1f1f1;

          color: #555555;

          font-size: 9px;

          font-weight: 700;

          letter-spacing: 0.06em;
        }

        .tm-completed {
          padding: 4px 7px;

          border-radius: 5px;

          background: #f3f3f3;

          color: #777777;

          font-size: 9px;

          font-weight: 700;

          letter-spacing: 0.06em;
        }

        .tm-reminder-completed {
          opacity: 0.65;
        }

        .tm-reminder-completed
          .tm-reminder-content h2 {
          text-decoration: line-through;

          color: #777777;
        }

        /* =================================
           DELETE
        ================================= */

        .tm-delete {
          width: 34px;
          height: 34px;

          padding: 0;

          flex: 0 0 34px;

          display: flex;

          align-items: center;
          justify-content: center;

          border: none;

          border-radius: 7px;

          background: transparent;

          color: #a0a0a0;

          cursor: pointer;
        }

        .tm-delete:hover {
          background: #f5f5f5;

          color: #333333;
        }

        .tm-delete svg {
          width: 18px;
          height: 18px;

          fill: none;

          stroke: currentColor;

          stroke-width: 1.7;
        }

        /* =================================
           STATS
        ================================= */

        .tm-stats {
          margin-top: 22px;

          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 12px;
        }

        .tm-stat {
          min-height: 76px;

          padding: 14px 16px;

          display: flex;

          flex-direction: column;

          justify-content: center;

          gap: 5px;

          background: #ffffff;

          border: 1px solid #e5e5e5;

          border-radius: 11px;
        }

        .tm-stat-label {
          color: #999999;

          font-size: 9px;

          font-weight: 700;

          letter-spacing: 0.08em;
        }

        .tm-stat strong {
          color: #171717;

          font-size: 19px;

          font-weight: 700;
        }

        /* =================================
           LOADING
        ================================= */

        .tm-loading {
          min-height: 300px;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          gap: 13px;

          color: #888888;
        }

        .tm-spinner {
          width: 25px;
          height: 25px;

          border: 2px solid #e5e5e5;

          border-top-color: #333333;

          border-radius: 50%;

          animation:
            tm-spin 0.8s linear infinite;
        }

        @keyframes tm-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =================================
           EMPTY
        ================================= */

        .tm-empty {
          min-height: 330px;

          padding: 40px 20px;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          text-align: center;

          background: #ffffff;

          border: 1px solid #e5e5e5;

          border-radius: 13px;
        }

        .tm-empty-icon {
          width: 52px;
          height: 52px;

          margin-bottom: 18px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 12px;

          background: #f3f3f3;

          color: #666666;
        }

        .tm-empty-icon svg {
          width: 24px;
          height: 24px;

          fill: none;

          stroke: currentColor;

          stroke-width: 1.8;
        }

        .tm-empty h2 {
          margin: 0;

          font-size: 19px;

          font-weight: 700;
        }

        .tm-empty p {
          max-width: 390px;

          margin: 9px 0 20px;

          color: #858585;

          font-size: 13px;

          line-height: 1.6;
        }

        .tm-empty-button {
          height: 40px;

          padding: 0 16px;

          display: inline-flex;

          align-items: center;

          border-radius: 8px;

          background: #171717;

          color: #ffffff;

          text-decoration: none;

          font-size: 13px;

          font-weight: 600;
        }

        /* =================================
           TABLET
        ================================= */

        @media (max-width: 850px) {

          .tm-sidebar {
            width: 190px;
          }

          .tm-main {
            margin-left: 190px;
          }

          .tm-content {
            width: calc(100% - 40px);
          }

          .tm-stats {
            grid-template-columns: 1fr;
          }

        }

        /* =================================
           MOBILE
        ================================= */

        @media (max-width: 650px) {

          .tm-sidebar {
            top: auto;
            bottom: 0;
            left: 0;

            width: 100%;
            height: 64px;

            padding: 6px 8px;

            border-right: none;

            border-top: 1px solid #e5e5e5;

            flex-direction: row;
          }

          .tm-brand {
            display: none;
          }

          .tm-navigation {
            width: 100%;

            display: grid;

            grid-template-columns:
              repeat(5, 1fr);

            gap: 3px;
          }

          .tm-navigation-item {
            width: 100%;
            height: 50px;

            padding: 4px 2px;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            gap: 4px;
          }

          .tm-icon {
            width: 18px;
            height: 18px;

            min-width: 18px;
            min-height: 18px;

            max-width: 18px;
            max-height: 18px;

            flex: 0 0 18px;
          }

          .tm-icon svg {
            width: 18px !important;
            height: 18px !important;

            min-width: 18px !important;
            min-height: 18px !important;

            max-width: 18px !important;
            max-height: 18px !important;
          }

          .tm-label {
            font-size: 9px;
          }

          .tm-profile-navigation {
            display: none;
          }

          .tm-main {
            margin-left: 0;

            padding-bottom: 70px;
          }

          .tm-content {
            width: calc(100% - 28px);

            padding: 30px 0 40px;
          }

          .tm-header {
            flex-direction: column;

            align-items: flex-start;

            gap: 18px;

            margin-bottom: 24px;
          }

          .tm-header h1 {
            font-size: 30px;
          }

          .tm-capture-button {
            width: 100%;
          }

          .tm-reminder-card {
            padding: 15px;

            align-items: flex-start;
          }

          .tm-reminder-main {
            gap: 10px;
          }

          .tm-reminder-content h2 {
            font-size: 15px;
          }

          .tm-delete {
            width: 32px;
            height: 32px;

            flex-basis: 32px;
          }

          .tm-stats {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

    </div>
  );
}