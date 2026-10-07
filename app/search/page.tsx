"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Memory = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  source_type: string | null;
  source_url: string | null;
  created_at: string;
  is_favorite: boolean;
};

export default function SearchPage() {
  const supabase = createClient();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [results, setResults] = useState<Memory[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          "id,title,summary,category,source_type,source_url,created_at,is_favorite"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        const memoryData = (data as Memory[]) || [];
        setMemories(memoryData);
        setResults(memoryData);
      }

      setLoading(false);
    }

    loadMemories();
  }, []);

  useEffect(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      setResults(memories);
      return;
    }

    const filtered = memories.filter((memory) => {
      return (
        memory.title?.toLowerCase().includes(search) ||
        memory.summary?.toLowerCase().includes(search) ||
        memory.category?.toLowerCase().includes(search) ||
        memory.source_type?.toLowerCase().includes(search)
      );
    });

    setResults(filtered);
  }, [query, memories]);

  return (
    <main className="page">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">T</div>
          <span>TraceMind</span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="nav">
          <a href="/dashboard">
            <span>⌂</span>
            Home
          </a>

          <a href="/search" className="active">
            <span>⌕</span>
            Search
          </a>

          <a href="/capture">
            <span>＋</span>
            Capture
          </a>

          <a href="/memories">
            <span>▣</span>
            Memories
          </a>

          <a href="/reminders">
            <span>◷</span>
            Reminders
          </a>
        </nav>

        <a href="/profile" className="account">
          <div className="avatar">M</div>

          <div>
            <strong>My Account</strong>
            <small>Profile & settings</small>
          </div>
        </a>
      </aside>

      {/* CONTENT */}
      <section className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">PERSONAL MEMORY</div>
            <h1>Search</h1>
          </div>

          <a href="/capture" className="capture-button">
            + Capture memory
          </a>
        </header>

        {/* HERO */}
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-label">MEMORY SEARCH</span>

            <h2>
              Find what you remember.
              <br />
              <span>Without remembering where.</span>
            </h2>

            <p>
              Search across the memories you have saved in TraceMind. Use a
              word, topic, category, or source type.
            </p>

            <div className="search-box">
              <span className="search-icon">⌕</span>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your memories..."
                autoComplete="off"
              />

              {query && (
                <button
                  type="button"
                  className="clear-button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="hero-orbit">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />

            <div className="orbit-dot dot-one" />
            <div className="orbit-dot dot-two" />
            <div className="orbit-dot dot-three" />

            <div className="orbit-center">⌕</div>
          </div>
        </section>

        {/* SEARCH INFO */}
        <section className="stats">
          <div className="stat-card">
            <span>MEMORIES</span>
            <strong>{memories.length}</strong>
            <p>Total saved memories</p>
          </div>

          <div className="stat-card">
            <span>RESULTS</span>
            <strong>{results.length}</strong>
            <p>
              {query.trim()
                ? "Matching your search"
                : "Showing all memories"}
            </p>
          </div>

          <div className="stat-card">
            <span>STATUS</span>
            <strong>{query.trim() ? "Active" : "Ready"}</strong>
            <p>Search is available</p>
          </div>
        </section>

        {/* RESULTS */}
        <section className="section">
          <div className="section-heading">
            <div>
              <span>{query.trim() ? "SEARCH RESULTS" : "MEMORY SPACE"}</span>

              <h2>
                {query.trim()
                  ? `Results for "${query}"`
                  : "Your memories"}
              </h2>
            </div>

            <div className="count">{results.length}</div>
          </div>

          {loading ? (
            <div className="empty-card">
              <div className="loader" />
              <p>Loading your memories...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">⌕</div>

              <h3>
                {query.trim()
                  ? "No memories found"
                  : "Your memory space is empty"}
              </h3>

              <p>
                {query.trim()
                  ? "Try a different word, topic, category, or source type."
                  : "Capture your first memory and it will appear here."}
              </p>

              {query.trim() ? (
                <button
                  type="button"
                  className="empty-button"
                  onClick={() => setQuery("")}
                >
                  Clear search
                </button>
              ) : (
                <a href="/capture" className="empty-button">
                  Capture a memory
                </a>
              )}
            </div>
          ) : (
            <div className="memory-list">
              {results.map((memory) => (
                <a
                  href={`/memories/${memory.id}`}
                  className="memory-card"
                  key={memory.id}
                >
                  <div className="memory-type">
                    {memory.source_type || "MEMORY"}
                  </div>

                  <div className="memory-main">
                    <h3>{memory.title}</h3>

                    {memory.summary && <p>{memory.summary}</p>}

                    <div className="memory-meta">
                      {memory.category && (
                        <span>{memory.category}</span>
                      )}

                      <span>
                        {new Date(memory.created_at).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>

                      {memory.is_favorite && <span>Favorite</span>}
                    </div>
                  </div>

                  <div className="memory-arrow">→</div>
                </a>
              ))}
            </div>
          )}
        </section>
      </section>

      <style jsx>{`
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

        .sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          width: 238px;
          background: #fff;
          border-right: 1px solid #e7e8eb;
          display: flex;
          flex-direction: column;
          padding: 28px 18px 20px;
          z-index: 20;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px;
          font-size: 18px;
          font-weight: 750;
          letter-spacing: -0.4px;
        }

        .logo-mark {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: #17191e;
          color: white;
          font-size: 15px;
          font-weight: 800;
        }

        .workspace-label {
          margin: 48px 12px 13px;
          color: #a1a4aa;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.5px;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .nav a {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 12px 13px;
          border-radius: 11px;
          text-decoration: none;
          color: #777b83;
          font-size: 14px;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .nav a span {
          width: 20px;
          text-align: center;
          font-size: 18px;
        }

        .nav a:hover {
          background: #f4f5f7;
          color: #17191e;
        }

        .nav a.active {
          background: #17191e;
          color: white;
        }

        .account {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px;
          border-top: 1px solid #ececef;
          padding-top: 18px;
          text-decoration: none;
          color: inherit;
        }

        .avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: #eceef1;
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 13px;
        }

        .account strong,
        .account small {
          display: block;
        }

        .account strong {
          font-size: 12px;
        }

        .account small {
          color: #999ca2;
          margin-top: 2px;
          font-size: 10px;
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
          transition: 0.2s ease;
        }

        .capture-button:hover {
          background: #272a31;
          transform: translateY(-1px);
        }

        /* HERO */

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

        .hero-copy {
          position: relative;
          z-index: 2;
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
          max-width: 700px;
        }

        .hero h2 span {
          color: #a9adb5;
        }

        .hero p {
          color: #a9adb5;
          max-width: 530px;
          font-size: 14px;
          line-height: 1.7;
          margin: 0 0 20px;
        }

        .search-box {
          width: min(510px, 100%);
          height: 48px;
          display: flex;
          align-items: center;
          gap: 11px;
          background: #24272d;
          border: 1px solid #3b3e45;
          border-radius: 11px;
          padding: 0 14px;
          transition: 0.2s ease;
        }

        .search-box:focus-within {
          border-color: #686c75;
          background: #292c32;
        }

        .search-icon {
          color: #aeb2b9;
          font-size: 21px;
          line-height: 1;
        }

        .search-box input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: white;
          font-size: 13px;
          font-family: inherit;
        }

        .search-box input::placeholder {
          color: #858991;
        }

        .clear-button {
          border: 0;
          background: transparent;
          color: #9da1a8;
          cursor: pointer;
          font-size: 21px;
          line-height: 1;
          padding: 2px 4px;
        }

        .clear-button:hover {
          color: white;
        }

        /* ORBIT */

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
          font-size: 21px;
          font-weight: 700;
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

        .dot-three {
          left: 14px;
          bottom: 58px;
          width: 6px;
          height: 6px;
          background: #777b83;
        }

        /* STATS */

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin: 18px 0 42px;
        }

        .stat-card {
          background: #fff;
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

        /* SECTION */

        .section {
          margin-top: 38px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-bottom: 15px;
        }

        .section-heading > div:first-child > span {
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

        /* MEMORY CARDS */

        .memory-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .memory-card {
          background: #fff;
          border: 1px solid #e7e8eb;
          border-radius: 15px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
          color: inherit;
          transition: 0.2s ease;
        }

        .memory-card:hover {
          border-color: #d5d7db;
          transform: translateY(-1px);
          box-shadow: 0 7px 20px rgba(23, 25, 30, 0.04);
        }

        .memory-type {
          width: 72px;
          height: 30px;
          border-radius: 8px;
          background: #f0f1f3;
          display: grid;
          place-items: center;
          color: #777b83;
          font-size: 8px;
          font-weight: 750;
          letter-spacing: 0.8px;
          flex-shrink: 0;
        }

        .memory-main {
          min-width: 0;
          flex: 1;
        }

        .memory-main h3 {
          margin: 0;
          font-size: 14px;
          letter-spacing: -0.2px;
        }

        .memory-main p {
          margin: 5px 0 0;
          color: #898c93;
          font-size: 11px;
          line-height: 1.5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .memory-meta {
          display: flex;
          gap: 10px;
          margin-top: 7px;
        }

        .memory-meta span {
          color: #a1a4aa;
          font-size: 9px;
        }

        .memory-meta span + span {
          padding-left: 10px;
          border-left: 1px solid #e1e2e5;
        }

        .memory-arrow {
          color: #a1a4aa;
          font-size: 18px;
          flex-shrink: 0;
        }

        /* EMPTY */

        .empty-card {
          background: #fff;
          border: 1px solid #e7e8eb;
          border-radius: 16px;
          padding: 45px 25px;
          text-align: center;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #f0f1f3;
          display: grid;
          place-items: center;
          margin: 0 auto 15px;
          font-size: 23px;
        }

        .empty-card h3 {
          margin: 0;
          font-size: 16px;
        }

        .empty-card p {
          color: #92959c;
          font-size: 12px;
          line-height: 1.6;
          max-width: 390px;
          margin: 8px auto 18px;
        }

        .empty-button {
          display: inline-block;
          border: 0;
          background: #17191e;
          color: white;
          text-decoration: none;
          padding: 10px 15px;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          font-family: inherit;
        }

        .loader {
          width: 22px;
          height: 22px;
          border: 2px solid #e4e5e8;
          border-top-color: #17191e;
          border-radius: 50%;
          margin: 0 auto 12px;
          animation: spin 0.7s linear infinite;
        }

        .empty-card > p {
          margin: 0;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* TABLET */

        @media (max-width: 1100px) {
          .hero-orbit {
            margin-right: 10px;
          }

          .content {
            padding-left: 30px;
            padding-right: 30px;
          }
        }

        @media (max-width: 900px) {
          .sidebar {
            width: 76px;
            padding: 28px 10px 20px;
          }

          .logo {
            justify-content: center;
            padding: 0;
          }

          .logo span,
          .workspace-label {
            display: none;
          }

          .nav a {
            justify-content: center;
            padding: 12px;
            font-size: 0;
          }

          .nav a span {
            font-size: 18px;
          }

          .account {
            justify-content: center;
          }

          .account > div:last-child {
            display: none;
          }

          .content {
            margin-left: 76px;
          }

          .hero-orbit {
            width: 150px;
            height: 150px;
          }
        }

        @media (max-width: 650px) {
          .content {
            padding: 22px 15px 50px;
          }

          .topbar {
            margin-bottom: 20px;
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
            padding: 28px 23px;
            border-radius: 19px;
          }

          .hero h2 {
            font-size: 31px;
            letter-spacing: -1.5px;
          }

          .hero p {
            font-size: 12px;
          }

          .hero-orbit {
            display: none;
          }

          .search-box {
            width: 100%;
          }

          .stats {
            gap: 8px;
            margin-bottom: 32px;
          }

          .stat-card {
            padding: 14px 12px;
            border-radius: 13px;
          }

          .stat-card strong {
            font-size: 22px;
          }

          .stat-card p {
            font-size: 9px;
          }

          .section {
            margin-top: 30px;
          }

          .section-heading h2 {
            font-size: 18px;
          }

          .memory-card {
            padding: 14px;
            gap: 10px;
          }

          .memory-type {
            width: 58px;
            height: 27px;
            font-size: 7px;
          }

          .memory-main h3 {
            font-size: 12px;
          }

          .memory-main p {
            font-size: 10px;
          }

          .memory-arrow {
            font-size: 15px;
          }
        }
      `}</style>
    </main>
  );
}