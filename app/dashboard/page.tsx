"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase";

type Memory = {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  source_type: string;
  source_url: string | null;
  deadline: string | null;
  is_favorite: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type FilterType =
  | "all"
  | "favorites"
  | "deadlines"
  | "recent";

type SortType =
  | "newest"
  | "oldest"
  | "az"
  | "deadline";

const supabase = createClient();

const SOURCE_TYPES = [
  "Screenshot",
  "PDF",
  "Link",
  "Text",
  "Voice",
  "Image",
  "Website",
  "Other",
];

const CATEGORIES = [
  "Tech",
  "Hackathons",
  "Scholarships",
  "Jobs",
  "Events",
  "Messages",
  "Non-Tech",
  "Education",
  "Finance",
  "Other",
];

function formatDate(date: string | null) {
  if (!date) return null;

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  const now = Date.now();
  const diff = now - value.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diff < minute) return "Just now";
  if (diff < hour) {
    const n = Math.floor(diff / minute);
    return `${n} min ago`;
  }

  if (diff < day) {
    const n = Math.floor(diff / hour);
    return `${n} hr ago`;
  }

  if (diff < week) {
    const n = Math.floor(diff / day);
    return `${n} day${n === 1 ? "" : "s"} ago`;
  }

  return formatDate(date) || "";
}

function getDeadlineStatus(deadline: string | null) {
  if (!deadline) return null;

  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff < 0) {
    return {
      label: "Expired",
      type: "expired",
    };
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days <= 1) {
    return {
      label: "Due today",
      type: "urgent",
    };
  }

  if (days <= 7) {
    return {
      label: `${days} days left`,
      type: "soon",
    };
  }

  return {
    label: formatDate(deadline) || "Deadline",
    type: "normal",
  };
}

function getSourceLabel(source: string) {
  if (!source) return "Memory";

  const normalized = source.toLowerCase();

  if (normalized.includes("screenshot")) return "Screenshot";
  if (normalized.includes("pdf")) return "PDF";
  if (normalized.includes("voice")) return "Voice";
  if (normalized.includes("website")) return "Website";
  if (normalized.includes("link") || normalized.includes("url")) {
    return "Link";
  }
  if (normalized.includes("image")) return "Image";
  if (normalized.includes("text")) return "Text";

  return source;
}

function getInitials(title: string) {
  const words = title
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "M";

  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }

  return (
    words[0].slice(0, 1) +
    words[1].slice(0, 1)
  ).toUpperCase();
}

function escapeSearch(value: string) {
  return value
    .replace(/[%_]/g, "\\$&")
    .replace(/,/g, " ");
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [source, setSource] = useState("All");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  const loadMemories = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setMemories([]);
          setError("Please sign in to view your memories.");
          return;
        }

        const { data, error: memoriesError } = await supabase
          .from("memories")
          .select(
            `
              id,
              user_id,
              title,
              summary,
              content,
              category,
              source_type,
              source_url,
              deadline,
              is_favorite,
              metadata,
              created_at,
              updated_at
            `
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (memoriesError) {
          throw memoriesError;
        }

        setMemories((data as Memory[]) || []);
      } catch (err) {
        console.error("Memories load error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your memories."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const stats = useMemo(() => {
    const now = new Date();

    const upcomingDeadlines = memories.filter((memory) => {
      if (!memory.deadline) return false;

      const deadline = new Date(memory.deadline);

      return (
        !Number.isNaN(deadline.getTime()) &&
        deadline.getTime() >= now.getTime()
      );
    }).length;

    return {
      total: memories.length,
      favorites: memories.filter(
        (memory) => memory.is_favorite
      ).length,
      deadlines: upcomingDeadlines,
    };
  }, [memories]);

  const filteredMemories = useMemo(() => {
    let result = [...memories];

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((memory) => {
        const searchable = [
          memory.title,
          memory.summary,
          memory.content,
          memory.category,
          memory.source_type,
          memory.source_url,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
    }

    if (category !== "All") {
      result = result.filter(
        (memory) =>
          (memory.category || "Other").toLowerCase() ===
          category.toLowerCase()
      );
    }

    if (source !== "All") {
      result = result.filter(
        (memory) =>
          getSourceLabel(memory.source_type).toLowerCase() ===
          source.toLowerCase()
      );
    }

    if (filter === "favorites") {
      result = result.filter(
        (memory) => memory.is_favorite
      );
    }

    if (filter === "deadlines") {
      result = result.filter((memory) => {
        if (!memory.deadline) return false;

        return new Date(memory.deadline).getTime() >= Date.now();
      });
    }

    if (filter === "recent") {
      const sevenDaysAgo =
        Date.now() - 7 * 24 * 60 * 60 * 1000;

      result = result.filter(
        (memory) =>
          new Date(memory.created_at).getTime() >=
          sevenDaysAgo
      );
    }

    result.sort((a, b) => {
      if (sort === "newest") {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      }

      if (sort === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sort === "az") {
        return a.title.localeCompare(b.title);
      }

      if (sort === "deadline") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;

        return (
          new Date(a.deadline).getTime() -
          new Date(b.deadline).getTime()
        );
      }

      return 0;
    });

    return result;
  }, [
    memories,
    search,
    category,
    source,
    filter,
    sort,
  ]);

  async function toggleFavorite(memory: Memory) {
    try {
      setFavoriteId(memory.id);
      setActionError("");

      const nextValue = !memory.is_favorite;

      const { error } = await supabase
        .from("memories")
        .update({
          is_favorite: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", memory.id)
        .eq("user_id", memory.user_id);

      if (error) {
        throw error;
      }

      setMemories((current) =>
        current.map((item) =>
          item.id === memory.id
            ? {
                ...item,
                is_favorite: nextValue,
              }
            : item
        )
      );
    } catch (err) {
      console.error(err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not update favorite."
      );
    } finally {
      setFavoriteId(null);
    }
  }

  async function deleteMemory(memory: Memory) {
    const confirmed = window.confirm(
      `Delete "${memory.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(memory.id);
      setActionError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Supabase authentication error:", authError.message);
      }

      if (!user) {
        throw new Error(
          authError
            ? `Authentication failed: ${authError.message}`
            : "No authenticated user found. Please log in again."
        );
      }

      /*
       * Delete assets belonging to this memory first.
       * Database cascade handles related records such as reminders.
       */
      const { data: assets, error: assetsError } =
        await supabase
          .from("memory_assets")
          .select("storage_path")
          .eq("memory_id", memory.id)
          .eq("user_id", user.id);

      if (assetsError) {
        console.warn(
          "Could not read memory assets:",
          assetsError
        );
      }

      if (assets && assets.length > 0) {
        const paths = assets
          .map((asset: { storage_path: string | null }) => asset.storage_path)
          .filter(
            (path): path is string =>
              typeof path === "string" && path.length > 0
          );

        if (paths.length > 0) {
          const { error: storageError } =
            await supabase.storage
              .from("memory-assets")
              .remove(paths);

          if (storageError) {
            console.warn(
              "Storage cleanup warning:",
              storageError
            );
          }
        }
      }

      const { error: assetsDeleteError } =
        await supabase
          .from("memory_assets")
          .delete()
          .eq("memory_id", memory.id)
          .eq("user_id", user.id);

      if (assetsDeleteError) {
        console.warn(
          "Asset database cleanup warning:",
          assetsDeleteError
        );
      }

      const { error: memoryError } = await supabase
        .from("memories")
        .delete()
        .eq("id", memory.id)
        .eq("user_id", user.id);

      if (memoryError) {
        throw memoryError;
      }

      setMemories((current) =>
        current.filter((item) => item.id !== memory.id)
      );
    } catch (err) {
      console.error("Delete memory error:", err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Could not delete this memory."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setSource("All");
    setFilter("all");
    setSort("newest");
  }

  return (
    <>
      <main className="memories-page">
        <div className="memories-container">

          {/* HEADER */}
          <header className="memories-header">
            <div>
              <div className="eyebrow">
                YOUR PERSONAL LIBRARY
              </div>

              <h1>Memories</h1>

              <p>
                Everything you saved, organized in one place.
              </p>
            </div>

            <Link
              href="/capture"
              className="add-memory-button"
            >
              <span>+</span>
              Add memory
            </Link>
          </header>

          {/* SEARCH */}
          <section className="memory-search">
            <div className="search-symbol">⌕</div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search anything you remember..."
              aria-label="Search memories"
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}

            <div className="search-hint">
              {filteredMemories.length} result
              {filteredMemories.length === 1 ? "" : "s"}
            </div>
          </section>

          {/* STATS */}
          <section className="memory-stats">
            <div className="stat-card">
              <div className="stat-number">
                {stats.total}
              </div>

              <div>
                <div className="stat-title">
                  Memories
                </div>

                <div className="stat-subtitle">
                  Saved information
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-number">
                {stats.favorites}
              </div>

              <div>
                <div className="stat-title">
                  Favorites
                </div>

                <div className="stat-subtitle">
                  Important memories
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-number">
                {stats.deadlines}
              </div>

              <div>
                <div className="stat-title">
                  Deadlines
                </div>

                <div className="stat-subtitle">
                  Upcoming dates
                </div>
              </div>
            </div>
          </section>

          {/* FILTER BAR */}
          <section className="filter-section">

            <div className="filter-tabs">
              <button
                className={
                  filter === "all"
                    ? "filter-tab active"
                    : "filter-tab"
                }
                onClick={() => setFilter("all")}
              >
                All
              </button>

              <button
                className={
                  filter === "recent"
                    ? "filter-tab active"
                    : "filter-tab"
                }
                onClick={() => setFilter("recent")}
              >
                Recent
              </button>

              <button
                className={
                  filter === "favorites"
                    ? "filter-tab active"
                    : "filter-tab"
                }
                onClick={() =>
                  setFilter("favorites")
                }
              >
                Favorites
              </button>

              <button
                className={
                  filter === "deadlines"
                    ? "filter-tab active"
                    : "filter-tab"
                }
                onClick={() =>
                  setFilter("deadlines")
                }
              >
                Deadlines
              </button>
            </div>

            <div className="filter-controls">
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                aria-label="Filter by category"
              >
                <option value="All">
                  All categories
                </option>

                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={source}
                onChange={(event) =>
                  setSource(event.target.value)
                }
                aria-label="Filter by source"
              >
                <option value="All">
                  All sources
                </option>

                {SOURCE_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as SortType)
                }
                aria-label="Sort memories"
              >
                <option value="newest">
                  Newest
                </option>

                <option value="oldest">
                  Oldest
                </option>

                <option value="az">
                  A–Z
                </option>

                <option value="deadline">
                  Deadline
                </option>
              </select>

              {(search ||
                category !== "All" ||
                source !== "All" ||
                filter !== "all" ||
                sort !== "newest") && (
                <button
                  className="reset-button"
                  onClick={clearFilters}
                >
                  Reset
                </button>
              )}
            </div>
          </section>

          {/* ERROR */}
          {error && (
            <div className="error-box">
              <div>
                <strong>Something went wrong</strong>
                <span>{error}</span>
              </div>

              <button
                onClick={() => loadMemories(true)}
              >
                Try again
              </button>
            </div>
          )}

          {actionError && (
            <div className="action-error">
              {actionError}
              <button
                onClick={() => setActionError("")}
              >
                ×
              </button>
            </div>
          )}

          {/* RESULT HEADER */}
          <div className="results-header">
            <div>
              <strong>
                {filteredMemories.length}
              </strong>{" "}
              {filteredMemories.length === 1
                ? "memory"
                : "memories"}
            </div>

            <button
              className="refresh-button"
              onClick={() => loadMemories(true)}
              disabled={refreshing}
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="memory-grid">
              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    className="memory-skeleton"
                    key={index}
                  >
                    <div className="skeleton-line small" />
                    <div className="skeleton-line title" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line short" />

                    <div className="skeleton-footer" />
                  </div>
                )
              )}
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            !error &&
            filteredMemories.length === 0 && (
              <section className="empty-state">
                <div className="empty-mark">
                  TM
                </div>

                <h2>
                  {memories.length === 0
                    ? "Your memory library is empty"
                    : "No memories found"}
                </h2>

                <p>
                  {memories.length === 0
                    ? "Save your first screenshot, PDF, link, voice note, or text and TraceMind will keep it organized."
                    : "Try a different search or remove one of your filters."}
                </p>

                {memories.length === 0 ? (
                  <Link
                    href="/capture"
                    className="empty-button"
                  >
                    Capture your first memory
                  </Link>
                ) : (
                  <button
                    className="empty-button"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}
              </section>
            )}

          {/* MEMORY GRID */}
          {!loading &&
            filteredMemories.length > 0 && (
              <section className="memory-grid">
                {filteredMemories.map((memory) => {
                  const deadline = getDeadlineStatus(
                    memory.deadline
                  );

                  const source = getSourceLabel(
                    memory.source_type
                  );

                  return (
                    <article
                      className="memory-card"
                      key={memory.id}
                    >
                      <div className="card-top">
                        <span className="source-label">
                          {source}
                        </span>

                        <button
                          className={
                            memory.is_favorite
                              ? "favorite-button active"
                              : "favorite-button"
                          }
                          onClick={() =>
                            toggleFavorite(memory)
                          }
                          disabled={
                            favoriteId === memory.id
                          }
                          aria-label={
                            memory.is_favorite
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          {memory.is_favorite
                            ? "★"
                            : "☆"}
                        </button>
                      </div>

                      <Link
                        href={`/memories/${memory.id}`}
                        className="memory-card-main"
                      >
                        <div className="memory-avatar">
                          {getInitials(memory.title)}
                        </div>

                        <div className="memory-card-content">
                          <h2>
                            {memory.title ||
                              "Untitled memory"}
                          </h2>

                          <p>
                            {memory.summary ||
                              memory.content ||
                              "No description available for this memory."}
                          </p>
                        </div>
                      </Link>

                      <div className="memory-meta">
                        {memory.category && (
                          <span className="category-label">
                            {memory.category}
                          </span>
                        )}

                        {deadline && (
                          <span
                            className={`deadline-label ${deadline.type}`}
                          >
                            {deadline.label}
                          </span>
                        )}
                      </div>

                      <div className="card-bottom">
                        <span>
                          Saved{" "}
                          {formatRelativeDate(
                            memory.created_at
                          )}
                        </span>

                        <div className="card-actions">
                          <Link
                            href={`/memories/${memory.id}`}
                            className="view-link"
                          >
                            View memory
                            <span>→</span>
                          </Link>

                          <button
                            className="delete-button"
                            onClick={() =>
                              deleteMemory(memory)
                            }
                            disabled={
                              deletingId === memory.id
                            }
                          >
                            {deletingId === memory.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
        </div>
      </main>

      <style jsx global>{`
        :root {
          --tm-bg: #f7f9fc;
          --tm-surface: #ffffff;
          --tm-text: #172033;
          --tm-muted: #718096;
          --tm-soft: #f1f4f8;
          --tm-line: #e5e9ef;
          --tm-blue: #2563eb;
          --tm-blue-soft: #eff6ff;
          --tm-danger: #dc2626;
          --tm-success: #15803d;
          --tm-warning: #b45309;
        }

        * {
          box-sizing: border-box;
        }

        .memories-page {
          min-height: 100vh;
          background: var(--tm-bg);
          color: var(--tm-text);
          padding: 42px 42px 70px;
        }

        .memories-container {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        /* HEADER */

        .memories-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 30px;
        }

        .eyebrow {
          color: var(--tm-blue);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          margin-bottom: 9px;
        }

        .memories-header h1 {
          margin: 0;
          font-size: clamp(30px, 4vw, 42px);
          line-height: 1.05;
          letter-spacing: -0.035em;
          font-weight: 760;
        }

        .memories-header p {
          margin: 10px 0 0;
          color: var(--tm-muted);
          font-size: 15px;
        }

        .add-memory-button {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          height: 44px;
          padding: 0 18px;
          border-radius: 11px;
          background: var(--tm-text);
          color: white;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .add-memory-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 9px 25px rgba(15, 23, 42, 0.15);
        }

        .add-memory-button span {
          font-size: 19px;
          font-weight: 400;
          line-height: 1;
        }

        /* SEARCH */

        .memory-search {
          height: 66px;
          background: var(--tm-surface);
          border: 1px solid var(--tm-line);
          border-radius: 16px;
          display: flex;
          align-items: center;
          padding: 0 17px;
          box-shadow:
            0 8px 30px rgba(15, 23, 42, 0.035);
          margin-bottom: 20px;
        }

        .search-symbol {
          width: 34px;
          color: #8a94a6;
          font-size: 28px;
          font-family: Arial, sans-serif;
          transform: rotate(-10deg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .memory-search input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 16px;
          color: var(--tm-text);
          padding: 0 8px;
        }

        .memory-search input::placeholder {
          color: #9aa4b2;
        }

        .clear-search {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 50%;
          background: var(--tm-soft);
          color: #697386;
          cursor: pointer;
          font-size: 18px;
        }

        .search-hint {
          color: #9aa4b2;
          font-size: 12px;
          white-space: nowrap;
          margin-left: 10px;
        }

        /* STATS */

        .memory-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: var(--tm-surface);
          border: 1px solid var(--tm-line);
          border-radius: 14px;
          min-height: 86px;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 17px 20px;
        }

        .stat-number {
          font-size: 26px;
          font-weight: 760;
          letter-spacing: -0.04em;
        }

        .stat-title {
          font-size: 13px;
          font-weight: 700;
        }

        .stat-subtitle {
          margin-top: 3px;
          color: var(--tm-muted);
          font-size: 11px;
        }

        /* FILTERS */

        .filter-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid var(--tm-line);
          margin-bottom: 21px;
          padding-bottom: 13px;
        }

        .filter-tabs {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .filter-tab {
          border: 0;
          background: transparent;
          color: #778195;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .filter-tab:hover {
          color: var(--tm-text);
          background: var(--tm-soft);
        }

        .filter-tab.active {
          color: var(--tm-blue);
          background: var(--tm-blue-soft);
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .filter-controls select {
          height: 35px;
          padding: 0 28px 0 10px;
          border: 1px solid var(--tm-line);
          border-radius: 8px;
          background: white;
          color: #4a5568;
          font-size: 12px;
          outline: none;
          cursor: pointer;
        }

        .filter-controls select:focus {
          border-color: #a9c5f7;
          box-shadow: 0 0 0 3px #eff6ff;
        }

        .reset-button {
          height: 35px;
          border: 0;
          background: transparent;
          color: var(--tm-blue);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        /* RESULTS */

        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          color: var(--tm-muted);
          font-size: 13px;
        }

        .results-header strong {
          color: var(--tm-text);
        }

        .refresh-button {
          border: 0;
          background: transparent;
          color: var(--tm-blue);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: default;
        }

        /* GRID */

        .memory-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .memory-card {
          background: var(--tm-surface);
          border: 1px solid var(--tm-line);
          border-radius: 15px;
          padding: 17px;
          min-width: 0;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .memory-card:hover {
          transform: translateY(-2px);
          border-color: #d5dce6;
          box-shadow:
            0 14px 35px rgba(15, 23, 42, 0.07);
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .source-label {
          display: inline-flex;
          align-items: center;
          height: 24px;
          padding: 0 9px;
          border-radius: 6px;
          background: #f4f6f9;
          color: #667085;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .favorite-button {
          width: 29px;
          height: 29px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #a0a8b5;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .favorite-button:hover {
          background: #f7f8fa;
          color: #6b7280;
        }

        .favorite-button.active {
          color: #e19a21;
        }

        .favorite-button:disabled {
          opacity: 0.5;
        }

        .memory-card-main {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          text-decoration: none;
          color: inherit;
          margin-bottom: 15px;
        }

        .memory-avatar {
          width: 39px;
          height: 39px;
          flex: 0 0 39px;
          border-radius: 10px;
          background: #edf3ff;
          color: var(--tm-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.03em;
        }

        .memory-card-content {
          min-width: 0;
        }

        .memory-card-content h2 {
          margin: 0;
          font-size: 15px;
          line-height: 1.35;
          font-weight: 720;
          letter-spacing: -0.015em;
          color: #202938;
        }

        .memory-card-content p {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 6px 0 0;
          color: #798394;
          font-size: 12px;
          line-height: 1.55;
        }

        .memory-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          min-height: 24px;
          flex-wrap: wrap;
          margin-bottom: 13px;
        }

        .category-label,
        .deadline-label {
          display: inline-flex;
          align-items: center;
          height: 23px;
          padding: 0 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
        }

        .category-label {
          background: #f4f6f9;
          color: #687385;
        }

        .deadline-label {
          background: #f4f6f9;
          color: #697586;
        }

        .deadline-label.urgent {
          color: #b42318;
          background: #fff1f0;
        }

        .deadline-label.soon {
          color: var(--tm-warning);
          background: #fff8eb;
        }

        .deadline-label.expired {
          color: #8b1e1e;
          background: #fceaea;
        }

        .card-bottom {
          border-top: 1px solid #edf0f4;
          padding-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #9aa3b1;
          font-size: 10px;
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .view-link {
          color: var(--tm-blue);
          text-decoration: none;
          font-size: 11px;
          font-weight: 750;
          white-space: nowrap;
        }

        .view-link span {
          margin-left: 3px;
        }

        .delete-button {
          border: 0;
          background: transparent;
          color: #9ca3af;
          font-size: 10px;
          cursor: pointer;
        }

        .delete-button:hover {
          color: var(--tm-danger);
        }

        .delete-button:disabled {
          opacity: 0.5;
          cursor: default;
        }

        /* EMPTY */

        .empty-state {
          background: white;
          border: 1px dashed #d8dee8;
          border-radius: 18px;
          padding: 65px 25px;
          text-align: center;
        }

        .empty-mark {
          width: 48px;
          height: 48px;
          border-radius: 13px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #edf3ff;
          color: var(--tm-blue);
          font-size: 12px;
          font-weight: 800;
        }

        .empty-state h2 {
          margin: 0;
          font-size: 19px;
          letter-spacing: -0.02em;
        }

        .empty-state p {
          max-width: 460px;
          margin: 9px auto 20px;
          color: var(--tm-muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .empty-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0 15px;
          border-radius: 9px;
          background: var(--tm-text);
          color: white;
          text-decoration: none;
          border: 0;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        /* ERRORS */

        .error-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 13px 15px;
          margin-bottom: 18px;
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 11px;
        }

        .error-box div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .error-box strong {
          color: #991b1b;
          font-size: 12px;
        }

        .error-box span {
          color: #b45353;
          font-size: 11px;
        }

        .error-box button {
          border: 0;
          background: #991b1b;
          color: white;
          border-radius: 7px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .action-error {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 15px;
          padding: 10px 13px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
          border-radius: 9px;
          font-size: 11px;
        }

        .action-error button {
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 17px;
          cursor: pointer;
        }

        /* SKELETON */

        .memory-skeleton {
          min-height: 205px;
          border: 1px solid var(--tm-line);
          border-radius: 15px;
          padding: 18px;
          background: white;
          overflow: hidden;
          position: relative;
        }

        .memory-skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.75),
            transparent
          );
          animation: tm-shimmer 1.5s infinite;
        }

        .skeleton-line {
          width: 75%;
          height: 11px;
          border-radius: 6px;
          background: #edf0f4;
          margin-bottom: 13px;
        }

        .skeleton-line.small {
          width: 18%;
          height: 22px;
          margin-bottom: 17px;
        }

        .skeleton-line.title {
          width: 65%;
          height: 15px;
        }

        .skeleton-line.short {
          width: 45%;
        }

        .skeleton-footer {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          height: 1px;
          background: #edf0f4;
        }

        @keyframes tm-shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        /* RESPONSIVE */

        @media (max-width: 900px) {
          .memories-page {
            padding: 30px 22px 55px;
          }

          .memory-grid {
            grid-template-columns: 1fr;
          }

          .filter-section {
            align-items: flex-start;
            flex-direction: column;
          }

          .filter-controls {
            justify-content: flex-start;
          }
        }

        @media (max-width: 650px) {
          .memories-page {
            padding: 24px 15px 45px;
          }

          .memories-header {
            align-items: flex-start;
            flex-direction: column;
            margin-bottom: 22px;
          }

          .add-memory-button {
            width: 100%;
            justify-content: center;
          }

          .memory-search {
            height: 58px;
          }

          .search-hint {
            display: none;
          }

          .memory-stats {
            grid-template-columns: 1fr;
          }

          .stat-card {
            min-height: 72px;
          }

          .filter-controls {
            width: 100%;
          }

          .filter-controls select {
            flex: 1;
            min-width: 0;
          }

          .memory-card {
            padding: 15px;
          }

          .card-bottom {
            align-items: flex-start;
            flex-direction: column;
          }

          .card-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </>
  );
}