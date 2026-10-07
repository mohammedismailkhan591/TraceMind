
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase";
import Sidebar from "../../components/sidebar";

type Memory = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  source_type: string;
  source_url: string | null;
  deadline: string | null;
  is_favorite: boolean;
  created_at: string;
};

const categories = [
  "All",
  "Important",
  "Document",
  "Screenshot",
  "Link",
  "Voice",
  "Text",
  "Other",
];

export default function MemoriesPage() {
  const supabase = createClient();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMemories([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("memories")
      .select(
        "id, title, summary, content, category, source_type, source_url, deadline, is_favorite, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Memories error:", error);
      setMemories([]);
    } else {
      setMemories(data || []);
    }

    setLoading(false);
  }

  async function toggleFavorite(
    event: React.MouseEvent,
    memory: Memory
  ) {
    event.preventDefault();
    event.stopPropagation();

    const newValue = !memory.is_favorite;

    setMemories((current) =>
      current.map((item) =>
        item.id === memory.id
          ? { ...item, is_favorite: newValue }
          : item
      )
    );

    const { error } = await supabase
      .from("memories")
      .update({ is_favorite: newValue })
      .eq("id", memory.id);

    if (error) {
      console.error("Favorite update error:", error);

      setMemories((current) =>
        current.map((item) =>
          item.id === memory.id
            ? { ...item, is_favorite: memory.is_favorite }
            : item
        )
      );
    }
  }

  async function deleteMemory(
    event: React.MouseEvent,
    memory: Memory
  ) {
    event.preventDefault();
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete "${memory.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(memory.id);

    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", memory.id);

    if (error) {
      console.error("Delete error:", error);
      alert("Unable to delete this memory.");
    } else {
      setMemories((current) =>
        current.filter((item) => item.id !== memory.id)
      );
    }

    setDeletingId(null);
  }

  async function saveEdit() {
    if (!editingMemory) return;

    if (!editingMemory.title.trim()) {
      alert("Title cannot be empty.");
      return;
    }

    setSavingEdit(true);

    const { data, error } = await supabase
      .from("memories")
      .update({
        title: editingMemory.title.trim(),
        summary: editingMemory.summary,
        category: editingMemory.category || "Other",
      })
      .eq("id", editingMemory.id)
      .select(
        "id, title, summary, content, category, source_type, source_url, deadline, is_favorite, created_at"
      )
      .single();

    if (error) {
      console.error("Edit error:", error);
      alert("Unable to update this memory.");
    } else if (data) {
      setMemories((current) =>
        current.map((item) =>
          item.id === data.id ? data : item
        )
      );

      setEditingMemory(null);
    }

    setSavingEdit(false);
  }

  const filteredMemories = useMemo(() => {
    let result = [...memories];

    if (activeCategory === "Important") {
      result = result.filter((memory) => memory.is_favorite);
    } else if (activeCategory !== "All") {
      result = result.filter((memory) => {
        const category = memory.category?.toLowerCase() || "";
        const source = memory.source_type?.toLowerCase() || "";
        const selected = activeCategory.toLowerCase();

        return category === selected || source === selected;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter((memory) =>
        [
          memory.title,
          memory.summary,
          memory.content,
          memory.category,
          memory.source_type,
        ]
          .filter(Boolean)
          .some((value) =>
            value!.toLowerCase().includes(q)
          )
      );
    }

    return result;
  }, [memories, activeCategory, search]);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getSourceIcon(source: string) {
    const type = source.toLowerCase();

    if (type.includes("pdf")) return "PDF";
    if (type.includes("screenshot") || type.includes("image"))
      return "IMG";
    if (type.includes("voice") || type.includes("audio"))
      return "VO";
    if (type.includes("link") || type.includes("url")) return "↗";

    return "TXT";
  }

  const favoriteCount = memories.filter(
    (memory) => memory.is_favorite
  ).length;

  return (
    <main className="page">
      <Sidebar />

      <section className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">PERSONAL MEMORY</div>
            <h1>Memories</h1>
          </div>

          <Link href="/capture" className="capture-button">
            + Capture memory
          </Link>
        </header>

        <section className="hero">
          <div>
            <span className="hero-label">YOUR MEMORY LIBRARY</span>

            <h2>
              Everything you saved.
              <br />
              <span>Ready when you need it.</span>
            </h2>

            <p>
              Keep your captured information organized in one place,
              searchable whenever you need to find it again.
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

        <div className="stats">
          <div className="stat-card">
            <span>TOTAL MEMORIES</span>
            <strong>{memories.length}</strong>
            <p>Saved to your library</p>
          </div>

          <div className="stat-card">
            <span>IMPORTANT</span>
            <strong>{favoriteCount}</strong>
            <p>Marked as important</p>
          </div>

          <div className="stat-card">
            <span>SHOWING</span>
            <strong>{filteredMemories.length}</strong>
            <p>Matching your current view</p>
          </div>
        </div>

        <section className="section search-section">
          <div className="section-heading">
            <div>
              <span>FIND A MEMORY</span>
              <h2>Search your library</h2>
            </div>
          </div>

          <div className="search-box">
            <span className="search-icon">⌕</span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles, content, categories..."
            />

            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>
        </section>

        <section className="section filter-section">
          <div className="section-heading">
            <div>
              <span>ORGANIZE</span>
              <h2>Browse by type</h2>
            </div>

            <div className="count">
              {filteredMemories.length}
            </div>
          </div>

          <div className="filters">
            {categories.map((category) => (
              <button
                key={category}
                className={
                  activeCategory === category
                    ? "filter active"
                    : "filter"
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="section memory-section">
          {loading ? (
            <div className="state">
              <div className="spinner" />
              <p>Loading your memories...</p>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="state empty">
              <div className="empty-icon">▣</div>

              <h3>
                {memories.length === 0
                  ? "No memories yet"
                  : "No memories match this view"}
              </h3>

              <p>
                {memories.length === 0
                  ? "Capture information from your everyday life and TraceMind will keep it organized."
                  : "Try another category or search term."}
              </p>

              {memories.length === 0 && (
                <Link
                  href="/capture"
                  className="empty-button"
                >
                  Capture something
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="section-heading">
                <div>
                  <span>
                    {activeCategory === "All"
                      ? "ALL MEMORIES"
                      : activeCategory.toUpperCase()}
                  </span>

                  <h2>
                    {filteredMemories.length}{" "}
                    {filteredMemories.length === 1
                      ? "memory"
                      : "memories"}
                  </h2>
                </div>
              </div>

              <div className="memory-grid">
                {filteredMemories.map((memory) => (
                  <Link
                    href={`/memories/${memory.id}`}
                    key={memory.id}
                    className="memory-card"
                  >
                    <div className="card-top">
                      <div className="source-icon">
                        {getSourceIcon(memory.source_type)}
                      </div>

                      <div className="card-actions">
                        <button
                          className={
                            memory.is_favorite
                              ? "icon-button favorite active"
                              : "icon-button"
                          }
                          title={
                            memory.is_favorite
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                          onClick={(e) =>
                            toggleFavorite(e, memory)
                          }
                        >
                          {memory.is_favorite ? "★" : "☆"}
                        </button>

                        <button
                          className="icon-button"
                          title="Edit memory"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingMemory({
                              ...memory,
                            });
                          }}
                        >
                          ✎
                        </button>

                        <button
                          className="icon-button delete-button"
                          title="Delete memory"
                          disabled={
                            deletingId === memory.id
                          }
                          onClick={(e) =>
                            deleteMemory(e, memory)
                          }
                        >
                          {deletingId === memory.id
                            ? "..."
                            : "×"}
                        </button>
                      </div>
                    </div>

                    <div className="card-content">
                      <span className="category">
                        {memory.category || "Other"}
                      </span>

                      <h3>{memory.title}</h3>

                      <p>
                        {memory.summary ||
                          memory.content ||
                          "This memory doesn't have a description yet."}
                      </p>
                    </div>

                    <div className="card-bottom">
                      <span>
                        {formatDate(memory.created_at)}
                      </span>

                      {memory.deadline && (
                        <span className="deadline">
                          Due {formatDate(memory.deadline)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </section>

      {editingMemory && (
        <div
          className="modal-backdrop"
          onClick={() => setEditingMemory(null)}
        >
          <div
            className="edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="modal-label">MEMORY</span>
                <h2>Edit memory</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setEditingMemory(null)}
              >
                ×
              </button>
            </div>

            <label>
              TITLE

              <input
                value={editingMemory.title}
                onChange={(e) =>
                  setEditingMemory({
                    ...editingMemory,
                    title: e.target.value,
                  })
                }
              />
            </label>

            <label>
              SUMMARY

              <textarea
                value={editingMemory.summary || ""}
                onChange={(e) =>
                  setEditingMemory({
                    ...editingMemory,
                    summary: e.target.value,
                  })
                }
                rows={4}
              />
            </label>

            <label>
              CATEGORY

              <select
                value={editingMemory.category || "Other"}
                onChange={(e) =>
                  setEditingMemory({
                    ...editingMemory,
                    category: e.target.value,
                  })
                }
              >
                <option>Document</option>
                <option>Screenshot</option>
                <option>Link</option>
                <option>Voice</option>
                <option>Text</option>
                <option>Other</option>
              </select>
            </label>

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setEditingMemory(null)}
              >
                Cancel
              </button>

              <button
                className="save-button"
                disabled={savingEdit}
                onClick={saveEdit}
              >
                {savingEdit
                  ? "Saving..."
                  : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

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

        .capture-button:hover {
          background: #292c33;
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
          max-width: 680px;
        }

        .hero h2 span {
          color: #a9adb5;
        }

        .hero p {
          color: #a9adb5;
          max-width: 560px;
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

        .section {
          margin-top: 38px;
        }

        .search-section {
          margin-top: 0;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-bottom: 15px;
        }

        .section-heading > div > span {
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

        .search-box {
          height: 52px;
          background: #fff;
          border: 1px solid #e7e8eb;
          border-radius: 14px;
          display: flex;
          align-items: center;
          padding: 0 15px;
          transition: 0.2s ease;
        }

        .search-box:focus-within {
          border-color: #b9bbc0;
          box-shadow: 0 0 0 3px rgba(23, 25, 30, 0.035);
        }

        .search-icon {
          color: #8d9097;
          font-size: 20px;
        }

        .search-box input {
          flex: 1;
          border: 0;
          outline: none;
          background: transparent;
          padding: 0 11px;
          color: #17191e;
          font-size: 13px;
          font-family: inherit;
        }

        .search-box input::placeholder {
          color: #b0b2b7;
        }

        .clear-search {
          width: 29px;
          height: 29px;
          border: 0;
          border-radius: 8px;
          background: #f0f1f3;
          color: #777b83;
          cursor: pointer;
          font-size: 17px;
        }

        .filter-section {
          margin-top: 28px;
        }

        .filters {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 2px;
        }

        .filters::-webkit-scrollbar {
          display: none;
        }

        .filter {
          flex-shrink: 0;
          border: 1px solid #e3e4e7;
          background: #fff;
          color: #777b83;
          border-radius: 9px;
          padding: 9px 13px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 650;
          font-family: inherit;
          transition: 0.2s ease;
        }

        .filter:hover {
          border-color: #c9cbd0;
          color: #17191e;
        }

        .filter.active {
          background: #17191e;
          border-color: #17191e;
          color: white;
        }

        .memory-section {
          margin-top: 42px;
        }

        .memory-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 13px;
        }

        .memory-card {
          min-height: 235px;
          padding: 18px;
          background: #fff;
          border: 1px solid #e7e8eb;
          border-radius: 15px;
          text-decoration: none;
          color: #17191e;
          display: flex;
          flex-direction: column;
          transition: 0.2s ease;
        }

        .memory-card:hover {
          transform: translateY(-3px);
          border-color: #d5d7dc;
          box-shadow: 0 15px 35px rgba(20, 24, 31, 0.07);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .source-icon {
          width: 39px;
          height: 39px;
          border-radius: 11px;
          background: #f0f1f3;
          color: #62666e;
          display: grid;
          place-items: center;
          font-size: 9px;
          font-weight: 800;
        }

        .card-actions {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .icon-button {
          width: 29px;
          height: 29px;
          border: 0;
          background: transparent;
          border-radius: 8px;
          color: #999ca4;
          cursor: pointer;
          font-size: 14px;
          font-family: inherit;
          transition: 0.15s ease;
        }

        .icon-button:hover {
          background: #f0f1f3;
          color: #17191e;
        }

        .icon-button.favorite.active {
          color: #17191e;
        }

        .delete-button:hover {
          color: #9e2b25;
          background: #fdf0ef;
        }

        .card-content {
          flex: 1;
          padding-top: 18px;
        }

        .category {
          display: inline-block;
          margin-bottom: 8px;
          color: #8c9098;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .card-content h3 {
          margin: 0;
          font-size: 15px;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-content p {
          margin: 8px 0 0;
          color: #858991;
          font-size: 11px;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-bottom {
          border-top: 1px solid #f0f1f3;
          padding-top: 13px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #a0a3aa;
          font-size: 10px;
        }

        .deadline {
          color: #686c74;
          font-weight: 650;
        }

        .state {
          min-height: 260px;
          border: 1px dashed #d9dce1;
          border-radius: 15px;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #999da5;
          text-align: center;
          padding: 30px;
        }

        .state p {
          font-size: 12px;
          max-width: 400px;
          line-height: 1.6;
        }

        .empty-icon {
          width: 52px;
          height: 52px;
          margin-bottom: 12px;
          border-radius: 50%;
          background: #f0f1f3;
          display: grid;
          place-items: center;
          color: #777b83;
          font-size: 20px;
        }

        .state h3 {
          margin: 0;
          color: #282b31;
          font-size: 15px;
        }

        .empty-button {
          margin-top: 8px;
          padding: 10px 15px;
          border-radius: 9px;
          background: #17191e;
          color: white;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
        }

        .spinner {
          width: 25px;
          height: 25px;
          border: 2px solid #e3e5e8;
          border-top-color: #24272d;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(15, 17, 21, 0.45);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .edit-modal {
          width: min(520px, 100%);
          background: #fff;
          border-radius: 18px;
          padding: 25px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .modal-label {
          color: #9b9ea5;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.4px;
        }

        .modal-header h2 {
          margin: 5px 0 0;
          font-size: 23px;
          letter-spacing: -0.7px;
        }

        .modal-close {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 9px;
          background: #f0f1f3;
          color: #777b83;
          font-size: 20px;
          cursor: pointer;
        }

        .modal-close:hover {
          background: #e7e8eb;
          color: #17191e;
        }

        .edit-modal label {
          display: block;
          margin-top: 16px;
          color: #777b83;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.2px;
        }

        .edit-modal input,
        .edit-modal textarea,
        .edit-modal select {
          width: 100%;
          margin-top: 8px;
          padding: 12px;
          border: 1px solid #dedfe3;
          border-radius: 10px;
          outline: none;
          background: white;
          color: #17191e;
          font-family: inherit;
          font-size: 12px;
        }

        .edit-modal input:focus,
        .edit-modal textarea:focus,
        .edit-modal select:focus {
          border-color: #999ca2;
          box-shadow: 0 0 0 3px rgba(23, 25, 30, 0.04);
        }

        .edit-modal textarea {
          resize: vertical;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 23px;
        }

        .cancel-button,
        .save-button {
          border: 0;
          border-radius: 9px;
          padding: 10px 15px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          font-family: inherit;
        }

        .cancel-button {
          background: #f0f1f3;
          color: #555961;
        }

        .cancel-button:hover {
          background: #e7e8eb;
        }

        .save-button {
          background: #17191e;
          color: white;
        }

        .save-button:hover:not(:disabled) {
          background: #292c33;
        }

        .save-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 1050px) {
          .memory-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 900px) {
          .content {
            margin-left: 76px;
            padding: 30px 28px 60px;
          }

          .hero-orbit {
            margin-right: 10px;
          }
        }

        @media (max-width: 650px) {
          .content {
            margin-left: 68px;
            padding: 22px 15px 50px;
          }

          .topbar {
            margin-bottom: 20px;
          }

          .topbar h1 {
            font-size: 25px;
          }

          .capture-button {
            padding: 9px 11px;
            font-size: 11px;
          }

          .hero {
            min-height: auto;
            padding: 29px 25px;
          }

          .hero h2 {
            font-size: 31px;
            letter-spacing: -1.4px;
          }

          .hero p {
            font-size: 12px;
          }

          .hero-orbit {
            display: none;
          }

          .stats {
            grid-template-columns: 1fr;
            gap: 8px;
            margin-bottom: 35px;
          }

          .stat-card {
            padding: 15px 17px;
          }

          .stat-card strong {
            font-size: 23px;
          }

          .memory-grid {
            grid-template-columns: 1fr;
          }

          .memory-card {
            min-height: 220px;
          }

          .edit-modal {
            padding: 20px;
          }
        }
      `}</style>
    </main>
  );
}

