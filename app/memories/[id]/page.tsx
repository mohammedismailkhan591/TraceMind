"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase";

type Memory = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  source_type: string;
  deadline: string | null;
  is_favorite: boolean;
  created_at: string;
  metadata: {
    keywords?: string[];
  } | null;
};

export default function MemoriesPage() {
  const supabase = createClient();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setMemories(data || []);
    }

    setLoading(false);
  }

  async function toggleFavorite(memory: Memory) {
    const newValue = !memory.is_favorite;

    const { error } = await supabase
      .from("memories")
      .update({ is_favorite: newValue })
      .eq("id", memory.id);

    if (!error) {
      setMemories((current) =>
        current.map((item) =>
          item.id === memory.id
            ? { ...item, is_favorite: newValue }
            : item
        )
      );
    }
  }

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          memories
            .map((memory) => memory.category)
            .filter(Boolean) as string[]
        )
      ),
    ];
  }, [memories]);

  const filteredMemories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return memories.filter((memory) => {
      const matchesCategory =
        category === "All" || memory.category === category;

      if (!matchesCategory) return false;

      if (!query) return true;

      const keywordText =
        memory.metadata?.keywords?.join(" ") || "";

      const searchableText = `
        ${memory.title}
        ${memory.summary || ""}
        ${memory.content || ""}
        ${memory.category || ""}
        ${memory.source_type}
        ${keywordText}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }, [memories, search, category]);

  return (
    <main className="page">
      <aside className="sidebar">
        <div className="logo">T</div>

        <nav>
          <Link href="/dashboard">⌂</Link>
          <Link href="/capture">＋</Link>
          <Link className="active" href="/memories">
            ▣
          </Link>
          <Link href="/timeline">◷</Link>
          <Link href="/reminders">◌</Link>
        </nav>
      </aside>

      <section className="content">
        <header>
          <div>
            <p className="eyebrow">YOUR INFORMATION</p>

            <h1>Memories</h1>

            <p className="subtitle">
              Everything you have captured, understood and saved.
            </p>
          </div>

          <Link className="captureButton" href="/capture">
            + Capture
          </Link>
        </header>

        <section className="stats">
          <div>
            <span>Total memories</span>
            <strong>{memories.length}</strong>
          </div>

          <div>
            <span>Favorites</span>
            <strong>
              {memories.filter((memory) => memory.is_favorite).length}
            </strong>
          </div>

          <div>
            <span>With extracted text</span>
            <strong>
              {
                memories.filter(
                  (memory) =>
                    Boolean(memory.content?.trim())
                ).length
              }
            </strong>
          </div>
        </section>

        <section className="controls">
          <div className="searchBox">
            <span>⌕</span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search what you remember..."
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

        {loading ? (
          <div className="empty">
            <h2>Loading memories...</h2>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="empty">
            <div className="emptyIcon">⌕</div>

            <h2>
              {memories.length === 0
                ? "Your memory space is empty"
                : "Nothing matched your search"}
            </h2>

            <p>
              {memories.length === 0
                ? "Capture something you want TraceMind to remember."
                : "Try another keyword or category."}
            </p>

            {memories.length === 0 && (
              <Link href="/capture">Capture something</Link>
            )}
          </div>
        ) : (
          <section className="memoryGrid">
            {filteredMemories.map((memory) => (
              <article className="memoryCard" key={memory.id}>
                <div className="cardTop">
                  <span className="category">
                    {memory.category || "Other"}
                  </span>

                  <button
                    className={
                      memory.is_favorite
                        ? "favorite active"
                        : "favorite"
                    }
                    onClick={() => toggleFavorite(memory)}
                    aria-label="Toggle favorite"
                  >
                    {memory.is_favorite ? "★" : "☆"}
                  </button>
                </div>

                <Link href={`/memories/${memory.id}`}>
                  <h2>{memory.title}</h2>
                </Link>

                <p className="summary">
                  {memory.summary ||
                    memory.content?.slice(0, 180) ||
                    "No description available."}
                </p>

                {memory.metadata?.keywords &&
                  memory.metadata.keywords.length > 0 && (
                    <div className="keywords">
                      {memory.metadata.keywords
                        .slice(0, 4)
                        .map((keyword) => (
                          <span key={keyword}>
                            {keyword}
                          </span>
                        ))}
                    </div>
                  )}

                <div className="cardBottom">
                  <span>
                    {new Date(
                      memory.created_at
                    ).toLocaleDateString()}
                  </span>

                  {memory.deadline && (
                    <span className="deadline">
                      Deadline{" "}
                      {new Date(
                        memory.deadline
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background: #f7f8fc;
          color: #171923;
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
          align-items: center;
          flex-direction: column;
          z-index: 10;
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

        nav a:hover,
        nav a.active {
          color: #4f46e5;
          background: #eef0ff;
        }

        .content {
          margin-left: 82px;
          padding: 55px 6%;
          max-width: 1500px;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 25px;
        }

        .eyebrow {
          margin: 0 0 9px;
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
          color: #73798a;
          margin: 12px 0 0;
        }

        .captureButton {
          text-decoration: none;
          background: #171923;
          color: white;
          padding: 13px 18px;
          border-radius: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .stats {
          margin-top: 35px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .stats div {
          background: white;
          border: 1px solid #e7e9f0;
          border-radius: 18px;
          padding: 19px;
        }

        .stats span {
          display: block;
          color: #858b9b;
          font-size: 12px;
        }

        .stats strong {
          display: block;
          margin-top: 8px;
          font-size: 27px;
        }

        .controls {
          margin-top: 25px;
        }

        .searchBox {
          background: white;
          border: 1px solid #e0e3eb;
          border-radius: 15px;
          padding: 0 17px;
          height: 53px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .searchBox span {
          font-size: 22px;
          color: #777d8d;
        }

        .searchBox input {
          flex: 1;
          border: 0;
          outline: 0;
          font-size: 15px;
          background: transparent;
        }

        .filters {
          margin-top: 14px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filters button {
          border: 1px solid #e0e3eb;
          background: white;
          border-radius: 20px;
          padding: 8px 13px;
          color: #686e7e;
          cursor: pointer;
        }

        .filters button.selected {
          background: #171923;
          color: white;
          border-color: #171923;
        }

        .memoryGrid {
          margin-top: 27px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .memoryCard {
          background: white;
          border: 1px solid #e7e9f0;
          border-radius: 20px;
          padding: 20px;
          min-height: 240px;
          display: flex;
          flex-direction: column;
          transition: 0.2s;
        }

        .memoryCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(20, 25, 45, 0.07);
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .category {
          background: #f0f1f6;
          color: #646a7b;
          padding: 6px 9px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
        }

        .favorite {
          border: 0;
          background: transparent;
          font-size: 21px;
          color: #b1b5c0;
          cursor: pointer;
        }

        .favorite.active {
          color: #4f46e5;
        }

        .memoryCard h2 {
          color: #171923;
          margin: 18px 0 9px;
          font-size: 19px;
          letter-spacing: -0.02em;
        }

        .memoryCard a {
          text-decoration: none;
        }

        .summary {
          color: #73798a;
          line-height: 1.55;
          font-size: 13px;
          margin: 0;
        }

        .keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 15px;
        }

        .keywords span {
          padding: 5px 8px;
          background: #fafafa;
          border: 1px solid #eceef3;
          border-radius: 7px;
          color: #747a89;
          font-size: 10px;
        }

        .cardBottom {
          margin-top: auto;
          padding-top: 18px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #9a9eaa;
          font-size: 11px;
        }

        .deadline {
          color: #4f46e5;
        }

        .empty {
          margin-top: 30px;
          min-height: 300px;
          background: white;
          border: 1px solid #e7e9f0;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          padding: 30px;
        }

        .emptyIcon {
          font-size: 38px;
          color: #818cf8;
        }

        .empty h2 {
          margin: 14px 0 5px;
        }

        .empty p {
          color: #858b9b;
        }

        .empty a {
          margin-top: 10px;
          color: #4f46e5;
          font-weight: 700;
          text-decoration: none;
        }

        @media (max-width: 1000px) {
          .memoryGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 650px) {
          .sidebar {
            width: 65px;
          }

          .content {
            margin-left: 65px;
            padding: 35px 18px;
          }

          header {
            align-items: flex-start;
            flex-direction: column;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .memoryGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}