"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase";

type Memory = {
  id: string;
  title: string;
  summary: string | null;
  deadline: string | null;
  category: string | null;
  source_type: string | null;
};

type Reminder = {
  id: string;
  title: string;
  reminder_at: string;
  completed: boolean;
  memory_id: string | null;
  reminder_kind: string | null;
};

const REMINDER_WINDOWS = [
  {
    kind: "7_days",
    label: "7 days before",
    milliseconds: 7 * 24 * 60 * 60 * 1000,
  },
  {
    kind: "24_hours",
    label: "24 hours before",
    milliseconds: 24 * 60 * 60 * 1000,
  },
  {
    kind: "7_hours",
    label: "7 hours before",
    milliseconds: 7 * 60 * 60 * 1000,
  },
  {
    kind: "1_hour",
    label: "1 hour before",
    milliseconds: 60 * 60 * 1000,
  },
];

export default function RemindersPage() {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);

  const [memories, setMemories] = useState<Memory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [error, setError] = useState("");

  const [filter, setFilter] = useState<
    "upcoming" | "completed" | "all"
  >("upcoming");

  const [search, setSearch] = useState("");

  /* =========================
     LOAD USER
  ========================= */

  const loadUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(session.user.id);
  }, [supabase]);

  /* =========================
     LOAD MEMORIES
  ========================= */

  const loadMemories = useCallback(
    async (uid: string) => {
      const { data, error } = await supabase
        .from("memories")
        .select(
          "id,title,summary,deadline,category,source_type"
        )
        .eq("user_id", uid)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setMemories((data || []) as Memory[]);
    },
    [supabase]
  );

  /* =========================
     LOAD REMINDERS
  ========================= */

  const loadReminders = useCallback(
    async (uid: string) => {
      const { data, error } = await supabase
        .from("reminders")
        .select(
          "id,title,reminder_at,completed,memory_id,reminder_kind"
        )
        .eq("user_id", uid)
        .order("reminder_at", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setReminders((data || []) as Reminder[]);
    },
    [supabase]
  );

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session?.user) {
          setUserId(null);
          setLoading(false);
          return;
        }

        const uid = session.user.id;

        setUserId(uid);

        await Promise.all([
          loadMemories(uid),
          loadReminders(uid),
        ]);

        if (mounted) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error(err);

        if (mounted) {
          setError(
            err?.message ||
              "Could not load reminders."
          );

          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [
    supabase,
    loadMemories,
    loadReminders,
  ]);

  /* =========================
     SYNC REMINDERS
  ========================= */

  const syncReminders = useCallback(
    async (uid: string, memoryList: Memory[]) => {
      setSyncing(true);
      setError("");

      try {
        const now = Date.now();

        const memoriesWithDeadlines =
          memoryList.filter((memory) => {
            if (!memory.deadline) {
              return false;
            }

            const deadlineTime = new Date(
              memory.deadline
            ).getTime();

            return (
              Number.isFinite(deadlineTime) &&
              deadlineTime > now
            );
          });

        for (const memory of memoriesWithDeadlines) {
          const deadlineTime = new Date(
            memory.deadline as string
          ).getTime();

          for (const window of REMINDER_WINDOWS) {
            const reminderTime =
              deadlineTime -
              window.milliseconds;

            if (reminderTime <= now) {
              continue;
            }

            /*
             * We deliberately do NOT use upsert/onConflict.
             * This avoids the constraint error you had earlier.
             */

            const { data: existing, error: findError } =
              await supabase
                .from("reminders")
                .select("id")
                .eq("user_id", uid)
                .eq("memory_id", memory.id)
                .eq(
                  "reminder_kind",
                  window.kind
                )
                .maybeSingle();

            if (findError) {
              throw findError;
            }

            const reminderTitle =
              memory.title +
              " · " +
              window.label;

            if (existing?.id) {
              const { error: updateError } =
                await supabase
                  .from("reminders")
                  .update({
                    title: reminderTitle,
                    reminder_at:
                      new Date(
                        reminderTime
                      ).toISOString(),
                  })
                  .eq(
                    "id",
                    existing.id
                  )
                  .eq(
                    "user_id",
                    uid
                  );

              if (updateError) {
                throw updateError;
              }
            } else {
              const { error: insertError } =
                await supabase
                  .from("reminders")
                  .insert({
                    user_id: uid,
                    memory_id:
                      memory.id,
                    title: reminderTitle,
                    reminder_at:
                      new Date(
                        reminderTime
                      ).toISOString(),
                    completed: false,
                    reminder_kind:
                      window.kind,
                  });

              if (insertError) {
                throw insertError;
              }
            }
          }
        }

        await loadReminders(uid);
      } catch (err: any) {
        console.error(
          "Reminder sync error:",
          err
        );

        setError(
          err?.message ||
            "Reminder schedule could not be synced."
        );
      } finally {
        setSyncing(false);
      }
    },
    [supabase, loadReminders]
  );

  /* =========================
     RUN SYNC ONCE
  ========================= */

  useEffect(() => {
    if (!userId || loading) {
      return;
    }

    if (memories.length === 0) {
      return;
    }

    syncReminders(userId, memories);

    // Intentionally run once after initial data load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loading]);

  /* =========================
     MEMORY LOOKUP
  ========================= */

  const memoryMap = useMemo(() => {
    const map = new Map<string, Memory>();

    memories.forEach((memory) => {
      map.set(memory.id, memory);
    });

    return map;
  }, [memories]);

  /* =========================
     FILTER
  ========================= */

  const visibleReminders = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    return reminders.filter((reminder) => {
      if (
        filter === "upcoming" &&
        reminder.completed
      ) {
        return false;
      }

      if (
        filter === "completed" &&
        !reminder.completed
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      const memory = reminder.memory_id
        ? memoryMap.get(
            reminder.memory_id
          )
        : null;

      const text = [
        reminder.title,
        memory?.title || "",
        memory?.summary || "",
        memory?.category || "",
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [
    reminders,
    filter,
    search,
    memoryMap,
  ]);

  /* =========================
     NEXT REMINDER
  ========================= */

  const nextReminder = useMemo(() => {
    return reminders.find(
      (reminder) =>
        !reminder.completed &&
        new Date(
          reminder.reminder_at
        ).getTime() > Date.now()
    );
  }, [reminders]);

  /* =========================
     COMPLETE
  ========================= */

  async function toggleCompleted(
    reminder: Reminder
  ) {
    if (!userId) return;

    const { error } =
      await supabase
        .from("reminders")
        .update({
          completed:
            !reminder.completed,
        })
        .eq("id", reminder.id)
        .eq("user_id", userId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadReminders(userId);
  }

  /* =========================
     DELETE
  ========================= */

  async function deleteReminder(
    reminder: Reminder
  ) {
    if (!userId) return;

    const { error } =
      await supabase
        .from("reminders")
        .delete()
        .eq("id", reminder.id)
        .eq("user_id", userId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadReminders(userId);
  }

  /* =========================
     FORMAT DATE
  ========================= */

  function formatDate(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    ).format(new Date(value));
  }

  /* =========================
     TIME UNTIL
  ========================= */

  function timeUntil(
    value: string
  ) {
    const difference =
      new Date(value).getTime() -
      Date.now();

    if (difference <= 0) {
      return "Due";
    }

    const minutes = Math.floor(
      difference / 60000
    );

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h`;
    }

    const days = Math.floor(
      hours / 24
    );

    return `${days}d`;
  }

  /* =========================
     NOT LOGGED IN
  ========================= */

  if (!loading && !userId) {
    return (
          <div className="reminders-page">
          <div className="empty-state">
            <div className="empty-icon">🔒</div>

            <h1>Sign in to view reminders</h1>

            <p>
              Your reminders are private and
              connected to your TraceMind account.
            </p>

            <a href="/login" className="primary-button">
              Sign in
            </a>
          </div>
        </div>
      );
  }

  /* =========================
     PAGE
  ========================= */

  return (
      <div className="reminders-page">

        {/* HEADER */}

        <header className="page-header">
          <div>
            <p className="eyebrow">
              MEMORY SYSTEM
            </p>

            <h1>Reminders</h1>

            <p className="subtitle">
              Never lose track of something
              important again.
            </p>
          </div>

          <div className="sync-status">
            <span
              className={
                syncing
                  ? "status-dot syncing"
                  : "status-dot"
              }
            />

            {syncing
              ? "Syncing"
              : "Synced"}
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="error-box">
            <strong>
              Reminder sync issue
            </strong>

            <span>{error}</span>
          </div>
        )}

        {/* NEXT REMINDER */}

        {nextReminder && (
          <section className="next-card">

            <div className="next-left">

              <div className="next-icon">
                🔔
              </div>

              <div>
                <p className="next-label">
                  NEXT REMINDER
                </p>

                <h2>
                  {nextReminder.title}
                </h2>

                <p>
                  {formatDate(
                    nextReminder.reminder_at
                  )}
                </p>
              </div>

            </div>

            <div className="countdown">
              {timeUntil(
                nextReminder.reminder_at
              )}
            </div>

          </section>
        )}

        {/* STATS */}

        <section className="stats">

          <div className="stat-card">
            <span>Total</span>
            <strong>
              {reminders.length}
            </strong>
          </div>

          <div className="stat-card">
            <span>Upcoming</span>
            <strong>
              {
                reminders.filter(
                  (r) =>
                    !r.completed
                ).length
              }
            </strong>
          </div>

          <div className="stat-card">
            <span>Completed</span>
            <strong>
              {
                reminders.filter(
                  (r) =>
                    r.completed
                ).length
              }
            </strong>
          </div>

          <div className="stat-card">
            <span>Memories</span>
            <strong>
              {
                memories.filter(
                  (m) =>
                    m.deadline
                ).length
              }
            </strong>
          </div>

        </section>

        {/* CONTROLS */}

        <section className="controls">

          <div className="filters">

            <button
              className={
                filter === "upcoming"
                  ? "filter active"
                  : "filter"
              }
              onClick={() =>
                setFilter("upcoming")
              }
            >
              Upcoming
            </button>

            <button
              className={
                filter === "completed"
                  ? "filter active"
                  : "filter"
              }
              onClick={() =>
                setFilter("completed")
              }
            >
              Completed
            </button>

            <button
              className={
                filter === "all"
                  ? "filter active"
                  : "filter"
              }
              onClick={() =>
                setFilter("all")
              }
            >
              All
            </button>

          </div>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search reminders..."
            className="search-input"
          />

        </section>

        {/* LIST */}

        {loading ? (
          <div className="loading">
            Loading reminders...
          </div>
        ) : visibleReminders.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              {memories.some(
                (m) => m.deadline
              )
                ? "🔔"
                : "📅"}
            </div>

            <h2>
              {memories.some(
                (m) => m.deadline
              )
                ? "No reminders yet"
                : "No deadlines found"}
            </h2>

            <p>
              {memories.some(
                (m) => m.deadline
              )
                ? "Your upcoming reminders will appear here."
                : "Add a deadline to a saved memory and TraceMind will create reminders automatically."}
            </p>

            {!memories.some(
              (m) => m.deadline
            ) && (
              <a
                href="/memories"
                className="primary-button"
              >
                View memories
              </a>
            )}

          </div>

        ) : (

          <section className="reminder-list">

            {visibleReminders.map(
              (reminder) => {

                const memory =
                  reminder.memory_id
                    ? memoryMap.get(
                        reminder.memory_id
                      )
                    : null;

                return (
                  <article
                    key={reminder.id}
                    className={
                      reminder.completed
                        ? "reminder-card completed"
                        : "reminder-card"
                    }
                  >

                    <button
                      className="check-button"
                      onClick={() =>
                        toggleCompleted(
                          reminder
                        )
                      }
                      aria-label={
                        reminder.completed
                          ? "Mark incomplete"
                          : "Mark complete"
                      }
                    >
                      {reminder.completed
                        ? "✓"
                        : ""}
                    </button>

                    <div className="reminder-main">

                      <div className="reminder-top">

                        <div>
                          <h3>
                            {reminder.title}
                          </h3>

                          {memory && (
                            <p className="memory-name">
                              From memory:{" "}
                              {memory.title}
                            </p>
                          )}
                        </div>

                        <span className="kind">
                          {REMINDER_WINDOWS.find(
                            (w) =>
                              w.kind ===
                              reminder.reminder_kind
                          )?.label ||
                            "Reminder"}
                        </span>

                      </div>

                      <div className="reminder-meta">

                        <span>
                          🕐{" "}
                          {formatDate(
                            reminder.reminder_at
                          )}
                        </span>

                        {memory?.deadline && (
                          <span>
                            Deadline:{" "}
                            {formatDate(
                              memory.deadline
                            )}
                          </span>
                        )}

                      </div>

                    </div>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteReminder(
                          reminder
                        )
                      }
                      aria-label="Delete reminder"
                    >
                      ×
                    </button>

                  </article>
                );
              }
            )}

          </section>
        )}

      </div>

      <style jsx>{`

        .reminders-page {
          min-height: 100vh;
          padding: 42px 48px 70px;
          color: #151922;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          margin-bottom: 28px;
        }

        .eyebrow {
          margin: 0 0 7px;
          color: #1769ff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        h1 {
          margin: 0;
          font-size: 34px;
          letter-spacing: -.04em;
        }

        .subtitle {
          margin: 8px 0 0;
          color: #7d8591;
          font-size: 14px;
        }

        .sync-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #e7eaf0;
          border-radius: 999px;
          background: white;
          color: #737b87;
          font-size: 11px;
          font-weight: 600;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #25a56a;
        }

        .status-dot.syncing {
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: .3;
          }
          50% {
            opacity: 1;
          }
        }

        .error-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px 16px;
          margin-bottom: 20px;
          border: 1px solid #f0d4d4;
          border-radius: 12px;
          background: #fff8f8;
          color: #a23b3b;
          font-size: 12px;
        }

        .next-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 25px;
          margin-bottom: 20px;
          border: 1px solid #dce8ff;
          border-radius: 18px;
          background: linear-gradient(
            135deg,
            #f5f9ff,
            #ffffff
          );
        }

        .next-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .next-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #e9f1ff;
          font-size: 21px;
        }

        .next-label {
          margin: 0 0 5px;
          color: #1769ff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .1em;
        }

        .next-card h2 {
          margin: 0;
          font-size: 17px;
          letter-spacing: -.02em;
        }

        .next-card p {
          margin: 5px 0 0;
          color: #7d8591;
          font-size: 11px;
        }

        .countdown {
          padding: 10px 14px;
          border-radius: 10px;
          background: #1769ff;
          color: white;
          font-size: 12px;
          font-weight: 750;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .stat-card {
          padding: 18px;
          border: 1px solid #e7eaf0;
          border-radius: 14px;
          background: white;
        }

        .stat-card span {
          display: block;
          color: #8a929d;
          font-size: 10px;
          font-weight: 600;
        }

        .stat-card strong {
          display: block;
          margin-top: 7px;
          font-size: 24px;
          letter-spacing: -.04em;
        }

        .controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 16px;
        }

        .filters {
          display: flex;
          gap: 5px;
        }

        .filter {
          border: 0;
          padding: 9px 13px;
          border-radius: 9px;
          background: transparent;
          color: #7d8591;
          cursor: pointer;
          font-size: 11px;
          font-weight: 650;
        }

        .filter.active {
          background: #edf4ff;
          color: #1769ff;
        }

        .search-input {
          width: 230px;
          padding: 10px 13px;
          border: 1px solid #e2e6eb;
          border-radius: 10px;
          outline: none;
          background: white;
          color: #20242b;
          font-size: 11px;
        }

        .search-input:focus {
          border-color: #1769ff;
          box-shadow: 0 0 0 3px #1769ff12;
        }

        .reminder-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .reminder-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border: 1px solid #e7eaf0;
          border-radius: 14px;
          background: white;
          transition: .15s ease;
        }

        .reminder-card:hover {
          border-color: #d7dce4;
          transform: translateY(-1px);
        }

        .reminder-card.completed {
          opacity: .58;
        }

        .check-button {
          width: 25px;
          height: 25px;
          flex-shrink: 0;
          border: 1.5px solid #ccd2da;
          border-radius: 50%;
          background: white;
          color: #1769ff;
          cursor: pointer;
          font-weight: 800;
        }

        .completed .check-button {
          border-color: #1769ff;
          background: #1769ff;
          color: white;
        }

        .reminder-main {
          min-width: 0;
          flex: 1;
        }

        .reminder-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .reminder-top h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
        }

        .memory-name {
          margin: 4px 0 0;
          color: #9299a3;
          font-size: 10px;
        }

        .kind {
          flex-shrink: 0;
          padding: 5px 8px;
          border-radius: 7px;
          background: #f5f7fa;
          color: #747c88;
          font-size: 9px;
          font-weight: 650;
        }

        .reminder-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 8px;
          color: #8b929c;
          font-size: 10px;
        }

        .delete-button {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #a3aab4;
          cursor: pointer;
          font-size: 20px;
        }

        .delete-button:hover {
          background: #fff1f1;
          color: #c94a4a;
        }

        .loading {
          padding: 70px 20px;
          text-align: center;
          color: #8a929d;
          font-size: 13px;
        }

        .empty-state {
          padding: 75px 20px;
          border: 1px dashed #dce1e7;
          border-radius: 16px;
          background: white;
          text-align: center;
        }

        .empty-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          border-radius: 15px;
          background: #f1f4f8;
          font-size: 21px;
        }

        .empty-state h2 {
          margin: 0;
          font-size: 18px;
        }

        .empty-state p {
          max-width: 420px;
          margin: 8px auto 18px;
          color: #858d98;
          font-size: 12px;
          line-height: 1.6;
        }

        .primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 15px;
          border-radius: 9px;
          background: #1769ff;
          color: white;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
        }

        @media (max-width: 800px) {

          .reminders-page {
            padding: 28px 20px 50px;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input {
            width: 100%;
          }

        }

        @media (max-width: 560px) {

          .page-header {
            flex-direction: column;
          }

          .next-card {
            align-items: flex-start;
            flex-direction: column;
          }

          .countdown {
            align-self: flex-start;
          }

          .reminder-top {
            flex-direction: column;
            gap: 8px;
          }

        }

      `}</style>
  );
}