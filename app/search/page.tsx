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

export default function SearchPage() {
  const supabase = createClient();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
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

  const filteredMemories = memories.filter((memory) => {
    const text = `
      ${memory.title}
      ${memory.summary || ""}
      ${memory.category || ""}
      ${memory.source_type}
    `.toLowerCase();

    return text.includes(query.toLowerCase());
  });

  const sourceIcon = (type: string) => {
    const value = type.toLowerCase();

    if (value.includes("pdf")) return "▤";
    if (value.includes("image") || value.includes("screenshot")) return "▧";
    if (value.includes("voice")) return "◉";
    if (value.includes("link") || value.includes("web")) return "↗";

    return "✦";
  };

  return (
    <main className="page">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <Link href="/dashboard" className="logo">
          <Logo />
        </Link>

        <nav>

          {/* DASHBOARD */}
          <Link href="/dashboard" className="nav">
            <span>⌂</span>
            <label>Dashboard</label>
          </Link>

          {/* CAPTURE */}
          <Link href="/capture" className="nav">
            <span>＋</span>
            <label>Capture</label>
          </Link>

          {/* MEMORIES */}
          <Link href="/memories" className="nav">
            <span>▣</span>
            <label>Memories</label>
          </Link>

          {/* TIMELINE */}
          <Link href="/timeline" className="nav">
            <span>◇</span>
            <label>Timeline</label>
          </Link>

          {/* REMINDERS */}
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
            <h1>Search</h1>
          </div>

          <Link href="/capture" className="capture">
            + Capture memory
          </Link>

        </header>

        {/* SEARCH HERO */}

        <section className="hero">

          <p className="label">FIND A MEMORY</p>

          <h2>
            What are you
            <br />
            trying to remember?
          </h2>

          <div className="search">

            <span>⌕</span>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your saved memories..."
              autoFocus
            />

            {query && (
              <button onClick={() => setQuery("")}>
                ×
              </button>
            )}

          </div>

          <p className="hint">
            Search through the information you have captured.
          </p>

        </section>

        {/* RESULTS */}

        <section className="results">

          <div className="results-header">

            <div>
              <p>YOUR MEMORIES</p>

              <h2>
                {query
                  ? `${filteredMemories.length} result${
                      filteredMemories.length === 1 ? "" : "s"
                    }`
                  : `${memories.length} saved`}
              </h2>
            </div>

          </div>

          {loading ? (

            <div className="empty">
              Loading your memories...
            </div>

          ) : filteredMemories.length === 0 ? (

            <div className="empty">

              <div className="empty-icon">
                {query ? "⌕" : "✦"}
              </div>

              <h3>
                {query
                  ? "No matching memories"
                  : "Nothing saved yet"}
              </h3>

              <p>
                {query
                  ? "Try different words or another detail."
                  : "Capture your first memory and it will appear here."}
              </p>

              {!query && (
                <Link href="/capture">
                  Capture a memory →
                </Link>
              )}

            </div>

          ) : (

            <div className="memory-list">

              {filteredMemories.map((memory) => (

                <Link
                  href={`/memories/${memory.id}`}
                  className="memory"
                  key={memory.id}
                >

                  <div className="memory-icon">
                    {sourceIcon(memory.source_type)}
                  </div>

                  <div className="memory-content">

                    <div className="meta">

                      <span>
                        {memory.category || "Other"}
                      </span>

                      <time>
                        {new Date(
                          memory.created_at
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>

                    </div>

                    <h3>{memory.title}</h3>

                    {memory.summary && (
                      <p>{memory.summary}</p>
                    )}

                    {memory.deadline && (
                      <small>
                        Deadline:{" "}
                        {new Date(
                          memory.deadline
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </small>
                    )}

                  </div>

                  <div className="arrow">
                    →
                  </div>

                </Link>

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

          transition: 0.2s;
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

          letter-spacing: 0.14em;
        }

        header h1 {
          margin: 0;

          font-size: 48px;

          letter-spacing: -0.05em;
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

          margin-bottom: 45px;

          overflow: hidden;
        }

        .label {
          color: #98a2b3;

          font-size: 11px;

          font-weight: 800;

          letter-spacing: 0.15em;
        }

        .hero h2 {
          margin: 18px 0 30px;

          font-size: clamp(35px, 5vw, 58px);

          line-height: 0.98;

          letter-spacing: -0.055em;
        }

        .search {
          height: 62px;

          max-width: 700px;

          display: flex;

          align-items: center;

          background: white;

          border-radius: 14px;

          padding: 0 18px;

          color: #667085;
        }

        .search span {
          font-size: 25px;

          margin-right: 12px;
        }

        .search input {
          flex: 1;

          border: 0;

          outline: 0;

          background: transparent;

          font-size: 14px;

          color: #101828;
        }

        .search button {
          border: 0;

          background: transparent;

          font-size: 24px;

          color: #98a2b3;

          cursor: pointer;
        }

        .hint {
          color: #98a2b3;

          font-size: 11px;
        }

        /* RESULTS */

        .results-header p {
          margin: 0 0 8px;

          color: #98a2b3;

          font-size: 11px;

          font-weight: 800;

          letter-spacing: 0.14em;
        }

        .results-header h2 {
          margin: 0 0 18px;

          font-size: 22px;
        }

        .memory-list {
          display: flex;

          flex-direction: column;

          gap: 10px;
        }

        .memory {
          background: white;

          border: 1px solid #eaecf0;

          border-radius: 17px;

          padding: 19px;

          display: grid;

          grid-template-columns:
            48px
            minmax(0, 1fr)
            30px;

          gap: 15px;

          align-items: center;

          color: inherit;

          text-decoration: none;

          transition: 0.2s;
        }

        .memory:hover {
          transform: translateY(-2px);

          border-color: #d0d5dd;

          box-shadow:
            0 12px 30px rgba(16, 24, 40, 0.06);
        }

        .memory-icon {
          width: 48px;

          height: 48px;

          border-radius: 13px;

          background: #f2f4f7;

          display: grid;

          place-items: center;

          font-size: 18px;
        }

        .memory-content {
          min-width: 0;
        }

        .meta {
          display: flex;

          gap: 15px;
        }

        .meta span {
          font-size: 9px;

          text-transform: uppercase;

          letter-spacing: 0.08em;

          font-weight: 800;

          color: #667085;
        }

        .meta time {
          font-size: 10px;

          color: #98a2b3;
        }

        .memory h3 {
          margin: 7px 0 5px;

          font-size: 15px;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

        .memory p {
          margin: 0;

          color: #667085;

          font-size: 11px;

          line-height: 1.5;
        }

        .memory small {
          display: inline-block;

          margin-top: 7px;

          color: #667085;

          font-size: 10px;

          font-weight: 700;
        }

        .arrow {
          color: #98a2b3;

          font-size: 20px;
        }

        /* EMPTY */

        .empty {
          background: white;

          border: 1px solid #eaecf0;

          border-radius: 18px;

          min-height: 250px;

          display: flex;

          align-items: center;

          justify-content: center;

          flex-direction: column;

          text-align: center;

          color: #98a2b3;

          padding: 30px;
        }

        .empty-icon {
          width: 52px;

          height: 52px;

          border-radius: 50%;

          border: 1px dashed #d0d5dd;

          display: grid;

          place-items: center;

          margin-bottom: 15px;
        }

        .empty h3 {
          color: #101828;

          margin: 0 0 7px;

          font-size: 16px;
        }

        .empty p {
          margin: 0 0 15px;

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

            min-height: 55px;
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

        }

      `}</style>

    </main>
  );
}