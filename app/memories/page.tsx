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
  deadline: string | null;
  is_favorite: boolean;
  created_at: string;
};

export default function MemoriesPage() {
  const supabase = createClient();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [filtered, setFiltered] = useState<Memory[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  useEffect(() => {
    let result = memories;

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (memory) =>
          memory.title.toLowerCase().includes(query) ||
          memory.summary?.toLowerCase().includes(query) ||
          memory.category?.toLowerCase().includes(query) ||
          memory.source_type.toLowerCase().includes(query)
      );
    }

    if (category !== "All") {
      result = result.filter((memory) => memory.category === category);
    }

    setFiltered(result);
  }, [search, category, memories]);

  async function loadMemories() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("memories")
      .select(
        "id, title, summary, category, source_type, deadline, is_favorite, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMemories(data);
    }

    setLoading(false);
  }

  async function toggleFavorite(
    id: string,
    currentValue: boolean
  ) {
    const { error } = await supabase
      .from("memories")
      .update({ is_favorite: !currentValue })
      .eq("id", id);

    if (!error) {
      setMemories((current) =>
        current.map((memory) =>
          memory.id === id
            ? { ...memory, is_favorite: !currentValue }
            : memory
        )
      );
    }
  }

  const categories = [
    "All",
    ...Array.from(
      new Set(
        memories
          .map((memory) => memory.category)
          .filter(Boolean) as string[]
      )
    ),
  ];

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logoWrap">
          <Logo />
        </div>

        <nav>
          <Link href="/dashboard">⌂</Link>
          <Link href="/capture">＋</Link>
          <Link className="active" href="/memories">◉</Link>
          <Link href="/timeline">◷</Link>
          <Link href="/reminders">✓</Link>
        </nav>

        <Link href="/profile" className="profileButton">
          👤
        </Link>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <p className="eyebrow">YOUR INFORMATION</p>
            <h1>Memories</h1>
            <p className="subtitle">
              Everything you have captured, organized in one place.
            </p>
          </div>

          <Link href="/capture" className="captureButton">
            + Capture
          </Link>
        </header>

        <section className="toolbar">
          <div className="searchBox">
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your memories..."
            />
          </div>

          <div className="filters">
            {categories.map((item) => (
              <button
                key={item}
                className={category === item ? "selected" : ""}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <div className="stats">
          <div>
            <strong>{memories.length}</strong>
            <span>Total memories</span>
          </div>

          <div>
            <strong>
              {memories.filter((m) => m.is_favorite).length}
            </strong>
            <span>Favorites</span>
          </div>

          <div>
            <strong>{filtered.length}</strong>
            <span>Showing</span>
          </div>
        </div>

        {loading ? (
          <div className="empty">
            <div className="loader" />
            <p>Loading your memories...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="emptyIcon">◌</div>

            <h2>
              {memories.length === 0
                ? "Your memory space is empty"
                : "No memories found"}
            </h2>

            <p>
              {memories.length === 0
                ? "Capture something you want to remember and it will appear here."
                : "Try a different search or category."}
            </p>

            {memories.length === 0 && (
              <Link href="/capture" className="emptyButton">
                Capture your first memory
              </Link>
            )}
          </div>
        ) : (
          <section className="grid">
            {filtered.map((memory) => (
              <article className="card" key={memory.id}>
                <div className="cardTop">
                  <span className="source">
                    {memory.source_type}
                  </span>

                  <button
                    className={
                      memory.is_favorite
                        ? "favorite active"
                        : "favorite"
                    }
                    onClick={() =>
                      toggleFavorite(
                        memory.id,
                        memory.is_favorite
                      )
                    }
                  >
                    {memory.is_favorite ? "★" : "☆"}
                  </button>
                </div>

                <Link href={`/memories/${memory.id}`}>
                  <h2>{memory.title}</h2>

                  <p>
                    {memory.summary ||
                      "No summary available yet."}
                  </p>

                  <div className="cardBottom">
                    <span>
                      {memory.category || "Other"}
                    </span>

                    <span>
                      {formatDate(memory.created_at)}
                    </span>
                  </div>

                  {memory.deadline && (
                    <div className="deadline">
                      <span>◷</span>
                      Deadline: {formatDate(memory.deadline)}
                    </div>
                  )}
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 70% 0%,
              rgba(99, 102, 241, 0.08),
              transparent 32%
            ),
            #f8fafc;
          color: #111827;
        }

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: 82px;
          height: 100vh;
          background: rgba(255, 255, 255, 0.92);
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 20;
          backdrop-filter: blur(16px);
        }

        .logoWrap {
          padding-top: 24px;
        }

        nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 150px;
        }

        nav a,
        .profileButton {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #64748b;
          font-size: 20px;
          transition: 0.2s;
        }

        nav a:hover,
        nav a.active {
          background: #111827;
          color: white;
        }

        .profileButton {
          margin-top: auto;
          margin-bottom: 24px;
          background: #f1f5f9;
        }

        .main {
          margin-left: 82px;
          padding: 55px 7%;
          max-width: 1500px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 30px;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #6366f1;
          margin: 0 0 10px;
        }

        h1 {
          font-size: clamp(36px, 5vw, 58px);
          letter-spacing: -0.05em;
          margin: 0;
        }

        .subtitle {
          color: #64748b;
          margin-top: 12px;
          font-size: 16px;
        }

        .captureButton,
        .emptyButton {
          background: #111827;
          color: white;
          text-decoration: none;
          padding: 13px 20px;
          border-radius: 13px;
          font-weight: 600;
        }

        .toolbar {
          margin-top: 45px;
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          align-items: center;
        }

        .searchBox {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 15px;
          height: 50px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          flex: 1;
          min-width: 260px;
        }

        .searchBox span {
          font-size: 24px;
          color: #94a3b8;
          margin-right: 10px;
        }

        .searchBox input {
          border: 0;
          outline: 0;
          width: 100%;
          font-size: 15px;
          background: transparent;
        }

        .filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filters button {
          border: 1px solid #e2e8f0;
          background: white;
          padding: 10px 14px;
          border-radius: 11px;
          cursor: pointer;
          color: #64748b;
        }

        .filters button.selected {
          background: #111827;
          color: white;
          border-color: #111827;
        }

        .stats {
          display: flex;
          gap: 15px;
          margin: 28px 0;
        }

        .stats div {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          padding: 16px 22px;
          min-width: 130px;
        }

        .stats strong {
          display: block;
          font-size: 25px;
        }

        .stats span {
          font-size: 12px;
          color: #64748b;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fill,
            minmax(270px, 1fr)
          );
          gap: 18px;
        }

        .card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 21px;
          transition: 0.2s;
        }

        .card:hover {
          transform: translateY(-3px);
          border-color: #c7d2fe;
          box-shadow: 0 14px 35px rgba(15, 23, 42, 0.07);
        }

        .card a {
          color: inherit;
          text-decoration: none;
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .source {
          font-size: 11px;
          font-weight: 700;
          color: #6366f1;
          background: #eef2ff;
          padding: 6px 9px;
          border-radius: 8px;
        }

        .favorite {
          border: 0;
          background: transparent;
          font-size: 22px;
          color: #cbd5e1;
          cursor: pointer;
        }

        .favorite.active {
          color: #f59e0b;
        }

        .card h2 {
          font-size: 19px;
          margin: 25px 0 9px;
          line-height: 1.3;
        }

        .card p {
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          min-height: 45px;
        }

        .cardBottom {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #f1f5f9;
          color: #64748b;
          font-size: 12px;
        }

        .deadline {
          margin-top: 12px;
          padding: 9px 10px;
          background: #fff7ed;
          color: #c2410c;
          border-radius: 9px;
          font-size: 12px;
        }

        .empty {
          min-height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
        }

        .emptyIcon {
          font-size: 60px;
          color: #cbd5e1;
        }

        .empty h2 {
          color: #111827;
          margin: 15px 0 5px;
        }

        .empty p {
          max-width: 450px;
          line-height: 1.6;
        }

        .emptyButton {
          margin-top: 20px;
        }

        .loader {
          width: 30px;
          height: 30px;
          border: 3px solid #e2e8f0;
          border-top-color: #111827;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 700px) {
          .sidebar {
            width: 65px;
          }

          .main {
            margin-left: 65px;
            padding: 35px 18px;
          }

          .header {
            align-items: flex-start;
            flex-direction: column;
          }

          .toolbar {
            margin-top: 30px;
          }

          .stats {
            overflow-x: auto;
          }

          nav {
            margin-top: 100px;
          }

          .stats div {
            min-width: 110px;
          }
        }
      `}</style>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}