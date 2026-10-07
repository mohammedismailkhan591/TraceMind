"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={filled ? "tm-star-filled" : ""}>
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
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

/* =========================
   PAGE
========================= */

export default function MemoriesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [updatingFavorite, setUpdatingFavorite] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("memories")
      .select(
        "id, title, summary, category, source_type, deadline, is_favorite, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading memories:", error);
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

    if (updatingFavorite === memory.id) return;

    setUpdatingFavorite(memory.id);

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

    setUpdatingFavorite(null);
  }

  const categories = useMemo(() => {
    const values = memories
      .map((memory) => memory.category)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values))];
  }, [memories]);

  const filteredMemories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return memories.filter((memory) => {
      const matchesSearch =
        !query ||
        memory.title?.toLowerCase().includes(query) ||
        memory.summary?.toLowerCase().includes(query) ||
        memory.category?.toLowerCase().includes(query) ||
        memory.source_type?.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" ||
        memory.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [memories, search, selectedCategory]);

  const favoriteCount = memories.filter(
    (memory) => memory.is_favorite
  ).length;

  return (
    <div className="tm-page">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="tm-sidebar">

        <div className="tm-brand">
          <div className="tm-brand-mark">T</div>
          <span>TraceMind</span>
        </div>

        <nav className="tm-navigation">

          <Link href="/dashboard" className="tm-navigation-item">
            <span className="tm-icon">
              <DashboardIcon />
            </span>
            <span className="tm-label">Dashboard</span>
          </Link>

          <Link href="/capture" className="tm-navigation-item">
            <span className="tm-icon">
              <CaptureIcon />
            </span>
            <span className="tm-label">Capture</span>
          </Link>

          <Link
            href="/memories"
            className="tm-navigation-item tm-navigation-active"
          >
            <span className="tm-icon">
              <MemoriesIcon />
            </span>
            <span className="tm-label">Memories</span>
          </Link>

          <Link href="/timeline" className="tm-navigation-item">
            <span className="tm-icon">
              <TimelineIcon />
            </span>
            <span className="tm-label">Timeline</span>
          </Link>

          <Link href="/reminders" className="tm-navigation-item">
            <span className="tm-icon">
              <ReminderIcon />
            </span>
            <span className="tm-label">Reminders</span>
          </Link>

        </nav>

        <div className="tm-profile-navigation">

          <Link href="/profile" className="tm-navigation-item">
            <span className="tm-icon">
              <ProfileIcon />
            </span>
            <span className="tm-label">Profile</span>
          </Link>

        </div>

      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="tm-main">

        <div className="tm-content">

          {/* HEADER */}

          <header className="tm-header">

            <div>
              <p className="tm-eyebrow">
                YOUR INFORMATION
              </p>

              <h1>Memories</h1>

              <p className="tm-subtitle">
                Everything you&apos;ve saved, organized in one place.
              </p>
            </div>

            <Link href="/capture" className="tm-capture-button">
              <span>+</span>
              Capture
            </Link>

          </header>

          {/* SEARCH */}

          <div className="tm-search">

            <SearchIcon />

            <input
              type="text"
              placeholder="Search your memories..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="tm-clear"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}

          </div>

          {/* FILTERS */}

          <div className="tm-filters">

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? "tm-filter tm-filter-active"
                    : "tm-filter"
                }
                onClick={() =>
                  setSelectedCategory(category)
                }
              >
                {category}
              </button>
            ))}

          </div>

          {/* SUMMARY */}

          <div className="tm-summary">

            <span>
              <strong>
                {filteredMemories.length}
              </strong>{" "}
              {filteredMemories.length === 1
                ? "memory"
                : "memories"}
            </span>

            <span>
              {favoriteCount} favorites
            </span>

          </div>

          {/* LOADING */}

          {loading && (
            <div className="tm-loading">

              <div className="tm-spinner" />

              <p>Loading your memories...</p>

            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            filteredMemories.length === 0 && (
              <div className="tm-empty">

                <div className="tm-empty-icon">
                  <MemoriesIcon />
                </div>

                <h2>
                  {search ||
                  selectedCategory !== "All"
                    ? "No memories found"
                    : "No memories yet"}
                </h2>

                <p>
                  {search ||
                  selectedCategory !== "All"
                    ? "Try a different search or category."
                    : "Capture something you want TraceMind to remember."}
                </p>

                {!search &&
                  selectedCategory === "All" && (
                    <Link
                      href="/capture"
                      className="tm-empty-button"
                    >
                      Capture your first memory
                    </Link>
                  )}

              </div>
            )}

          {/* MEMORY CARDS */}

          {!loading &&
            filteredMemories.length > 0 && (
              <div className="tm-memory-grid">

                {filteredMemories.map((memory) => (

                  <Link
                    href={`/memories/${memory.id}`}
                    key={memory.id}
                    className="tm-memory-card"
                  >

                    <div className="tm-card-top">

                      <span className="tm-memory-type">
                        {memory.category ||
                          memory.source_type ||
                          "Other"}
                      </span>

                      <button
                        type="button"
                        className={
                          memory.is_favorite
                            ? "tm-favorite tm-favorite-active"
                            : "tm-favorite"
                        }
                        onClick={(event) =>
                          toggleFavorite(
                            event,
                            memory
                          )
                        }
                        disabled={
                          updatingFavorite ===
                          memory.id
                        }
                      >
                        <StarIcon
                          filled={
                            memory.is_favorite
                          }
                        />
                      </button>

                    </div>

                    <div className="tm-card-body">

                      <h2>
                        {memory.title ||
                          "Untitled memory"}
                      </h2>

                      {memory.summary ? (
                        <p>{memory.summary}</p>
                      ) : (
                        <p className="tm-no-summary">
                          No summary available.
                        </p>
                      )}

                    </div>

                    <div className="tm-card-bottom">

                      <div>
                        <span className="tm-meta-label">
                          SAVED
                        </span>

                        <strong className="tm-meta-value">
                          {formatDate(
                            memory.created_at
                          )}
                        </strong>
                      </div>

                      {memory.deadline && (
                        <div className="tm-deadline">

                          <span className="tm-meta-label">
                            DEADLINE
                          </span>

                          <strong className="tm-meta-value">
                            {formatDate(
                              memory.deadline
                            )}
                          </strong>

                        </div>
                      )}

                    </div>

                  </Link>

                ))}

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
           SEARCH
        ================================= */

        .tm-search {
          width: 100%;
          height: 52px;

          margin-bottom: 18px;

          padding: 0 16px;

          display: flex;
          align-items: center;

          gap: 12px;

          background: #ffffff;

          border: 1px solid #e4e4e4;

          border-radius: 11px;

          box-sizing: border-box;
        }

        .tm-search > svg {
          width: 19px;
          height: 19px;

          flex: 0 0 19px;

          fill: none;

          stroke: #8b8b8b;

          stroke-width: 1.8;
        }

        .tm-search input {
          width: 100%;
          height: 100%;

          padding: 0;

          border: none;

          outline: none;

          background: transparent;

          color: #171717;

          font-size: 14px;
        }

        .tm-search input::placeholder {
          color: #a1a1a1;
        }

        .tm-clear {
          border: none;

          background: transparent;

          color: #888888;

          cursor: pointer;

          font-size: 22px;

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
           MEMORY GRID
        ================================= */

        .tm-memory-grid {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 16px;
        }

        .tm-memory-card {
          min-width: 0;

          min-height: 245px;

          padding: 20px;

          display: flex;
          flex-direction: column;

          background: #ffffff;

          border: 1px solid #e5e5e5;

          border-radius: 13px;

          color: inherit;

          text-decoration: none;

          box-sizing: border-box;

          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            transform 0.18s ease;
        }

        .tm-memory-card:hover {
          border-color: #d4d4d4;

          box-shadow:
            0 8px 24px
            rgba(0, 0, 0, 0.05);

          transform: translateY(-2px);
        }

        .tm-card-top {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 12px;
        }

        .tm-memory-type {
          min-height: 26px;

          padding: 0 9px;

          display: inline-flex;

          align-items: center;

          border-radius: 6px;

          background: #f5f5f5;

          color: #686868;

          font-size: 10px;

          font-weight: 700;

          letter-spacing: 0.06em;

          text-transform: uppercase;
        }

        .tm-favorite {
          width: 34px;
          height: 34px;

          padding: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border: none;

          border-radius: 7px;

          background: transparent;

          color: #a0a0a0;

          cursor: pointer;
        }

        .tm-favorite:hover {
          background: #f5f5f5;
          color: #333333;
        }

        .tm-favorite svg {
          width: 20px;
          height: 20px;

          fill: none;

          stroke: currentColor;

          stroke-width: 1.8;
        }

        .tm-favorite .tm-star-filled {
          fill: currentColor;
        }

        .tm-favorite-active {
          color: #171717;
        }

        .tm-card-body {
          flex: 1;

          padding: 25px 0 22px;
        }

        .tm-card-body h2 {
          margin: 0;

          color: #171717;

          font-size: 19px;

          line-height: 1.35;

          font-weight: 700;

          letter-spacing: -0.018em;

          overflow-wrap: anywhere;
        }

        .tm-card-body p {
          margin: 10px 0 0;

          color: #777777;

          font-size: 13px;

          line-height: 1.65;

          display: -webkit-box;

          -webkit-line-clamp: 3;

          -webkit-box-orient: vertical;

          overflow: hidden;
        }

        .tm-card-body .tm-no-summary {
          color: #a0a0a0;
        }

        .tm-card-bottom {
          padding-top: 15px;

          display: flex;

          align-items: flex-start;

          justify-content: space-between;

          gap: 18px;

          border-top: 1px solid #eeeeee;
        }

        .tm-card-bottom > div {
          display: flex;

          flex-direction: column;

          gap: 4px;
        }

        .tm-deadline {
          text-align: right;
        }

        .tm-meta-label {
          color: #9a9a9a;

          font-size: 10px;

          font-weight: 700;

          letter-spacing: 0.06em;
        }

        .tm-meta-value {
          color: #5f5f5f;

          font-size: 12px;

          font-weight: 600;
        }

        .tm-deadline .tm-meta-value {
          color: #171717;
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

          animation: tm-spin 0.8s linear infinite;
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

          .tm-memory-grid {
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

          .tm-memory-grid {
            grid-template-columns: 1fr;
          }

          .tm-memory-card {
            min-height: 225px;
          }

        }

      `}</style>

    </div>
  );
}