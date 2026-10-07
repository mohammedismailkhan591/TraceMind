"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import SearchBox from "../../components/SearchBox";
import MemoryCard from "../../components/MemoryCard";
import { createClient } from "../../lib/supabase";
import type { Memory } from "../../lib/types";

type Reminder = {
  id: string;
  title: string;
  reminder_at: string;
  memory_id: string | null;
  completed: boolean;
};

export default function Dashboard() {
  const supabase = createClient();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("there");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const displayName =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "there";

      setName(displayName);

      const [{ data: memoryData }, { data: reminderData }] =
        await Promise.all([
          supabase
            .from("memories")
            .select(
              "id,title,summary,category,source_type,source_url,deadline,created_at,is_favorite"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),

          supabase
            .from("reminders")
            .select("id,title,reminder_at,memory_id,completed")
            .eq("user_id", user.id)
            .eq("completed", false)
            .order("reminder_at", { ascending: true })
            .limit(5),
        ]);

      setMemories((memoryData || []) as Memory[]);
      setReminders((reminderData || []) as Reminder[]);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  const filteredMemories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return memories.slice(0, 4);
    }

    return memories
      .filter((memory) =>
        [
          memory.title,
          memory.summary,
          memory.category,
          memory.source_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 6);
  }, [memories, search]);

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const upcomingReminder = reminders[0];

  return (
    <AppShell>
      <main className="dashboard">
        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">DASHBOARD</p>

            <h1>
              Welcome back, {name.split(" ")[0]}
            </h1>

            <p className="date-line">{todayLabel}</p>
          </div>

          <Link href="/capture" className="capture-button">
            Capture
          </Link>
        </header>

        {/* SEARCH */}
        <section className="search-panel">
          <div className="search-copy">
            <p className="eyebrow">YOUR MEMORY</p>

            <h2>What are you trying to remember?</h2>

            <p>
              Search by anything you remember about the information.
            </p>
          </div>

          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="That scholarship I saw..."
          />
        </section>

        {/* RECENT MEMORIES */}
        <section className="memories-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {search ? "SEARCH RESULTS" : "RECENTLY SAVED"}
              </p>

              <h2>
                {search ? "Results" : "Your memories"}
              </h2>
            </div>

            <Link href="/memories" className="text-link">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="loading-box">
              <span className="spinner" />
              <span>Loading your memories...</span>
            </div>
          ) : filteredMemories.length > 0 ? (
            <div className="memory-grid">
              {filteredMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                />
              ))}
            </div>
          ) : (
            <div className="empty-box">
              <h3>
                {search
                  ? "No memories found"
                  : "Nothing saved yet"}
              </h3>

              <p>
                {search
                  ? "Try using different words or a broader description."
                  : "Capture something you want TraceMind to remember."}
              </p>

              {!search && (
                <Link
                  href="/capture"
                  className="empty-link"
                >
                  Capture your first memory
                </Link>
              )}
            </div>
          )}
        </section>

        {/* BOTTOM AREA */}
        <section className="bottom-grid">
          {/* CAPTURE */}
          <div className="capture-panel">
            <div>
              <p className="eyebrow">CAPTURE</p>

              <h2>Save something you found.</h2>

              <p>
                Add a screenshot, document, website or text.
                TraceMind will organize it for you.
              </p>
            </div>

            <Link
              href="/capture"
              className="secondary-button"
            >
              Open Capture
            </Link>
          </div>

          {/* REMINDER */}
          <div className="reminder-panel">
            <div className="section-heading small">
              <div>
                <p className="eyebrow">REMINDERS</p>

                <h2>Upcoming</h2>
              </div>

              <Link
                href="/reminders"
                className="text-link"
              >
                View all
              </Link>
            </div>

            {upcomingReminder ? (
              <div className="reminder-content">
                <h3>{upcomingReminder.title}</h3>

                <p>
                  {new Date(
                    upcomingReminder.reminder_at
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>

                <Link href="/reminders">
                  Open reminder
                </Link>
              </div>
            ) : (
              <div className="no-reminder">
                <h3>Nothing needs your attention.</h3>

                <p>
                  You have no upcoming reminders.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          padding: 48px 48px 80px;
          background: #f7f7f5;
          color: #18191c;
        }

        .dashboard-header,
        .search-panel,
        .memories-section,
        .bottom-grid {
          width: 100%;
          max-width: 1180px;
          margin-left: auto;
          margin-right: auto;
        }

        /* HEADER */

        .dashboard-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 38px;
        }

        .eyebrow {
          margin: 0;
          color: #96989d;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .dashboard-header h1 {
          margin: 9px 0 5px;
          font-size: clamp(30px, 4vw, 42px);
          line-height: 1;
          letter-spacing: -0.055em;
          font-weight: 700;
        }

        .date-line {
          margin: 0;
          color: #8d9095;
          font-size: 11px;
        }

        .capture-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 96px;
          padding: 11px 18px;
          border-radius: 8px;
          background: #18191c;
          color: #ffffff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          transition:
            transform 0.18s ease,
            opacity 0.18s ease;
        }

        .capture-button:hover {
          transform: translateY(-1px);
          opacity: 0.88;
        }

        /* SEARCH */

        .search-panel {
          padding: 34px;
          background: #ffffff;
          border: 1px solid #e4e4e1;
          border-radius: 14px;
        }

        .search-copy h2 {
          margin: 9px 0 6px;
          font-size: clamp(24px, 3vw, 32px);
          line-height: 1.1;
          letter-spacing: -0.045em;
        }

        .search-copy p:last-child {
          margin: 0 0 22px;
          color: #898c91;
          font-size: 11px;
          line-height: 1.5;
        }

        /* MEMORIES */

        .memories-section {
          margin-top: 48px;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 16px;
        }

        .section-heading h2 {
          margin: 5px 0 0;
          font-size: 19px;
          line-height: 1.2;
          letter-spacing: -0.035em;
        }

        .text-link {
          color: #686b70;
          font-size: 10px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }

        .text-link:hover {
          color: #18191c;
        }

        .memory-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        /* LOADING */

        .loading-box {
          min-height: 190px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e4e4e1;
          border-radius: 12px;
          color: #92959a;
          font-size: 10px;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #e3e3e0;
          border-top-color: #18191c;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* EMPTY */

        .empty-box {
          padding: 48px 30px;
          background: #ffffff;
          border: 1px dashed #d6d6d3;
          border-radius: 12px;
          text-align: center;
        }

        .empty-box h3 {
          margin: 0;
          font-size: 14px;
          letter-spacing: -0.02em;
        }

        .empty-box p {
          max-width: 350px;
          margin: 8px auto 17px;
          color: #92959a;
          font-size: 10px;
          line-height: 1.55;
        }

        .empty-link {
          color: #18191c;
          font-size: 10px;
          font-weight: 700;
          text-decoration: none;
        }

        /* BOTTOM */

        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 14px;
          margin-top: 48px;
        }

        .capture-panel,
        .reminder-panel {
          min-width: 0;
          padding: 25px;
          background: #ffffff;
          border: 1px solid #e4e4e1;
          border-radius: 14px;
        }

        .capture-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
        }

        .capture-panel h2 {
          margin: 7px 0 7px;
          font-size: 18px;
          letter-spacing: -0.035em;
        }

        .capture-panel p {
          max-width: 460px;
          margin: 0;
          color: #898c91;
          font-size: 10px;
          line-height: 1.6;
        }

        .secondary-button {
          flex: 0 0 auto;
          padding: 10px 14px;
          border: 1px solid #dcdcd9;
          border-radius: 8px;
          color: #18191c;
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
        }

        .secondary-button:hover {
          border-color: #18191c;
        }

        .section-heading.small {
          margin-bottom: 20px;
        }

        .section-heading.small h2 {
          font-size: 17px;
        }

        .reminder-content {
          padding-top: 2px;
        }

        .reminder-content h3 {
          margin: 0 0 6px;
          font-size: 13px;
          line-height: 1.4;
        }

        .reminder-content p {
          margin: 0;
          color: #898c91;
          font-size: 10px;
        }

        .reminder-content a {
          display: inline-block;
          margin-top: 17px;
          color: #18191c;
          font-size: 9px;
          font-weight: 700;
          text-decoration: none;
        }

        .no-reminder {
          padding-top: 2px;
        }

        .no-reminder h3 {
          margin: 0 0 6px;
          font-size: 12px;
        }

        .no-reminder p {
          margin: 0;
          color: #92959a;
          font-size: 10px;
        }

        /* TABLET */

        @media (max-width: 900px) {
          .dashboard {
            padding: 36px 28px 70px;
          }

          .bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        /* MOBILE */

        @media (max-width: 650px) {
          .dashboard {
            padding: 28px 16px 60px;
          }

          .dashboard-header {
            align-items: flex-start;
            margin-bottom: 28px;
          }

          .dashboard-header h1 {
            font-size: 27px;
          }

          .date-line {
            font-size: 10px;
          }

          .capture-button {
            min-width: auto;
            padding: 9px 13px;
            font-size: 10px;
          }

          .search-panel {
            padding: 25px 20px;
            border-radius: 12px;
          }

          .search-copy h2 {
            font-size: 23px;
          }

          .search-copy p:last-child {
            margin-bottom: 19px;
          }

          .memories-section {
            margin-top: 36px;
          }

          .section-heading h2 {
            font-size: 17px;
          }

          .memory-grid {
            grid-template-columns: 1fr;
          }

          .bottom-grid {
            margin-top: 36px;
          }

          .capture-panel,
          .reminder-panel {
            padding: 21px;
          }

          .capture-panel {
            align-items: flex-start;
            flex-direction: column;
            gap: 18px;
          }

          .secondary-button {
            width: 100%;
            text-align: center;
          }
        }

        @media (max-width: 420px) {
          .dashboard-header h1 {
            font-size: 24px;
          }

          .dashboard-header {
            gap: 12px;
          }

          .capture-button {
            padding: 8px 11px;
          }

          .search-copy h2 {
            font-size: 21px;
          }
        }
      `}</style>
    </AppShell>
  );
}