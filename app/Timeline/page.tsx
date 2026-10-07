"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "../../components/Logo";
import { createClient } from "../../lib/supabase";

type Memory = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  source_type: string;
  created_at: string;
  deadline: string | null;
  is_favorite: boolean;
};

export default function TimelinePage() {
  const supabase = createClient();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, []);

  async function loadTimeline() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("memories")
      .select(
        "id,title,summary,category,source_type,created_at,deadline,is_favorite"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setMemories(data || []);
    }

    setLoading(false);
  }

  function sourceIcon(type: string) {
    const value = type.toLowerCase();

    if (value.includes("pdf")) return "▤";
    if (value.includes("screenshot")) return "▧";
    if (value.includes("voice")) return "◉";
    if (value.includes("link")) return "↗";

    return "✦";
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

          <Link href="/timeline" className="nav active">
            <span>◇</span>
            <label>Timeline</label>
          </Link>

          <Link href="/reminders" className="nav">
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
            <h1>Timeline</h1>
          </div>

          <Link href="/capture" className="capture">
            + Capture memory
          </Link>

        </header>

        {/* HERO */}

        <section className="hero">

          <p className="label">MEMORY JOURNEY</p>

          <h2>
            Everything you've saved.
            <br />
            <span>In one timeline.</span>
          </h2>

          <p className="description">
            Trace your memories from the moment you captured them.
            Browse what you saved today, this week, or further back.
          </p>

        </section>

        {/* STATS */}

        <section className="stats">

          <div className="stat">
            <p>TOTAL MEMORIES</p>
            <strong>{memories.length}</strong>
            <span>Saved to your memory space</span>
          </div>

          <div className="stat">
            <p>CAPTURED TODAY</p>
            <strong>
              {
                memories.filter((memory) => {
                  const date = new Date(memory.created_at);
                  const today = new Date();

                  return (
                    date.toDateString() === today.toDateString()
                  );
                }).length
              }
            </strong>
            <span>New memories today</span>
          </div>

          <div className="stat">
            <p>IMPORTANT</p>
            <strong>
              {memories.filter((memory) => memory.is_favorite).length}
            </strong>
            <span>Marked as important</span>
          </div>

        </section>

        {/* TIMELINE */}

        <section className="timeline-section">

          <div className="section-heading">
            <div>
              <p>YOUR TIMELINE</p>
              <h2>Your memory journey</h2>
            </div>

            <span>{memories.length} memories</span>
          </div>

          {loading ? (

            <div className="empty">
              Loading your timeline...
            </div>

          ) : memories.length === 0 ? (

            <div className="empty">

              <div className="empty-icon">◇</div>

              <h3>Your timeline is empty</h3>

              <p>
                Capture something and it will appear here
                automatically.
              </p>

              <Link href="/capture">
                Capture your first memory →
              </Link>

            </div>

          ) : (

            <div className="timeline">

              {memories.map((memory, index) => (

                <div className="timeline-row" key={memory.id}>

                  {/* DATE */}

                  <div className="date">

                    <strong>
                      {formatDate(memory.created_at)}
                    </strong>

                    <span>
                      {formatTime(memory.created_at)}
                    </span>

                  </div>

                  {/* LINE */}

                  <div className="line">

                    <div className="dot" />

                    {index !== memories.length - 1 && (
                      <div className="connector" />
                    )}

                  </div>

                  {/* MEMORY */}

                  <Link
                    href={`/memories/${memory.id}`}
                    className="memory"
                  >

                    <div className="memory-top">

                      <div className="memory-icon">
                        {sourceIcon(memory.source_type)}
                      </div>

                      <div className="memory-info">

                        <div className="meta">

                          <span>
                            {memory.category || "Other"}
                          </span>

                          <span>
                            {memory.source_type}
                          </span>

                        </div>

                        <h3>{memory.title}</h3>

                      </div>

                      {memory.is_favorite && (
                        <div className="favorite">
                          ★
                        </div>
                      )}

                    </div>

                    {memory.summary && (
                      <p className="summary">
                        {memory.summary}
                      </p>
                    )}

                    {memory.deadline && (
                      <div className="deadline">
                        Deadline:{" "}
                        {formatDate(memory.deadline)}
                      </div>
                    )}

                    <div className="open">
                      Open memory →
                    </div>

                  </Link>

                </div>

              ))}

            </div>

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

          padding: 55px;

          margin-bottom: 20px;
        }

        .label {
          margin: 0;

          color: #98a2b3;

          font-size: 11px;
          font-weight: 800;

          letter-spacing: .15em;
        }

        .hero h2 {
          margin: 18px 0 25px;

          font-size: clamp(38px, 5vw, 62px);

          line-height: .98;

          letter-spacing: -.055em;
        }

        .hero h2 span {
          color: #8d919b;
        }

        .description {
          max-width: 580px;

          margin: 0;

          color: #aeb3bd;

          font-size: 15px;

          line-height: 1.7;
        }

        /* STATS */

        .stats {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 10px;

          margin-bottom: 55px;
        }

        .stat {
          background: white;

          border: 1px solid #eaecf0;

          border-radius: 18px;

          padding: 25px;
        }

        .stat p {
          margin: 0 0 13px;

          color: #98a2b3;

          font-size: 10px;

          font-weight: 800;

          letter-spacing: .13em;
        }

        .stat strong {
          display: block;

          font-size: 36px;

          letter-spacing: -.05em;
        }

        .stat span {
          color: #98a2b3;

          font-size: 11px;
        }

        /* SECTION */

        .section-heading {
          display: flex;

          align-items: flex-end;

          justify-content: space-between;

          margin-bottom: 25px;
        }

        .section-heading p {
          margin: 0 0 7px;

          color: #98a2b3;

          font-size: 10px;

          font-weight: 800;

          letter-spacing: .14em;
        }

        .section-heading h2 {
          margin: 0;

          font-size: 25px;

          letter-spacing: -.04em;
        }

        .section-heading > span {
          color: #98a2b3;

          font-size: 11px;
        }

        /* TIMELINE */

        .timeline {
          display: flex;

          flex-direction: column;
        }

        .timeline-row {
          display: grid;

          grid-template-columns:
            115px
            35px
            minmax(0, 1fr);

          gap: 15px;
        }

        .date {
          padding-top: 22px;

          display: flex;
          flex-direction: column;

          text-align: right;
        }

        .date strong {
          font-size: 12px;

          color: #344054;
        }

        .date span {
          margin-top: 4px;

          font-size: 10px;

          color: #98a2b3;
        }

        .line {
          position: relative;

          display: flex;
          justify-content: center;
        }

        .dot {
          position: relative;

          z-index: 2;

          width: 12px;
          height: 12px;

          margin-top: 25px;

          border-radius: 50%;

          background: #17191f;

          border: 3px solid #f7f8fb;
        }

        .connector {
          position: absolute;

          top: 36px;
          bottom: -1px;

          width: 1px;

          background: #d0d5dd;
        }

        /* MEMORY CARD */

        .memory {
          display: block;

          background: white;

          border: 1px solid #eaecf0;

          border-radius: 18px;

          padding: 22px;

          margin-bottom: 15px;

          color: inherit;

          text-decoration: none;

          transition: .2s;
        }

        .memory:hover {
          transform: translateY(-2px);

          border-color: #d0d5dd;

          box-shadow:
            0 12px 30px rgba(16,24,40,.06);
        }

        .memory-top {
          display: flex;

          align-items: center;

          gap: 14px;
        }

        .memory-icon {
          width: 48px;
          height: 48px;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          border-radius: 13px;

          background: #f2f4f7;

          font-size: 19px;
        }

        .memory-info {
          flex: 1;

          min-width: 0;
        }

        .meta {
          display: flex;

          gap: 12px;

          margin-bottom: 6px;
        }

        .meta span {
          font-size: 9px;

          font-weight: 800;

          text-transform: uppercase;

          letter-spacing: .08em;

          color: #667085;
        }

        .memory h3 {
          margin: 0;

          font-size: 17px;

          letter-spacing: -.02em;
        }

        .favorite {
          font-size: 18px;
        }

        .summary {
          margin: 17px 0 12px;

          color: #667085;

          font-size: 12px;

          line-height: 1.6;
        }

        .deadline {
          display: inline-block;

          padding: 7px 10px;

          border-radius: 8px;

          background: #f2f4f7;

          color: #667085;

          font-size: 10px;

          font-weight: 700;
        }

        .open {
          margin-top: 16px;

          color: #98a2b3;

          font-size: 10px;

          font-weight: 800;
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
          }

          .hero h2 {
            font-size: 38px;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .timeline-row {
            grid-template-columns: 65px 25px minmax(0, 1fr);

            gap: 8px;
          }

          .date strong {
            font-size: 10px;
          }

          .date span {
            font-size: 9px;
          }

          .memory {
            padding: 16px;
          }

          .memory h3 {
            font-size: 14px;
          }

        }

      `}</style>

    </main>
  );
}