"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

type Memory = {
  id: string;
  title: string | null;
  summary: string | null;
  content: string | null;
  category: string | null;
  source_type: string | null;
  source_url: string | null;
  created_at: string | null;
  deadline: string | null;
  is_favorite: boolean | null;
};

type Category = "all" | "favorites" | string;

const categories = [
  "all",
  "favorites",
  "personal",
  "work",
  "study",
  "ideas",
  "other",
];

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getSourceLabel(sourceType: string | null) {
  if (!sourceType) return "Memory";

  const labels: Record<string, string> = {
    image: "Image",
    pdf: "PDF",
    link: "Link",
    text: "Text",
    voice: "Voice",
    audio: "Audio",
  };

  return (
    labels[sourceType.toLowerCase()] ??
    sourceType.charAt(0).toUpperCase() +
      sourceType.slice(1)
  );
}

export default function SearchPage() {
  const router = useRouter();

  const [supabase] = useState(() => createClient());

  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<Category>("all");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(
    null
  );

  const [refreshing, setRefreshing] = useState(false);

  const loadMemories = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "TraceMind session error:",
            sessionError.message
          );

          setIsSignedIn(false);
          setMemories([]);

          setErrorMessage(
            "We couldn't check your login session. Please try again."
          );

          return;
        }

        if (!session?.user) {
          setIsSignedIn(false);
          setMemories([]);
          return;
        }

        setIsSignedIn(true);

        const { data, error } = await supabase
          .from("memories")
          .select(
            "id,title,summary,content,category,source_type,source_url,created_at,deadline,is_favorite"
          )
          .eq("user_id", session.user.id)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          console.error(
            "TraceMind memory loading error:",
            error.message
          );

          setMemories([]);

          setErrorMessage(
            "We couldn't load your memories. Please check your Supabase configuration and database permissions."
          );

          return;
        }

        setMemories((data ?? []) as Memory[]);
      } catch (error) {
        console.error(
          "Unexpected TraceMind search error:",
          error
        );

        setMemories([]);

        setErrorMessage(
          "Something went wrong while loading your memories. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    void loadMemories();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setIsSignedIn(false);
        setMemories([]);
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        void loadMemories();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadMemories, supabase]);

  const filteredMemories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return memories.filter((memory) => {
      const searchableText = [
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

      const matchesQuery =
        !query || searchableText.includes(query);

      const matchesCategory =
        selectedCategory === "all"
          ? true
          : selectedCategory === "favorites"
            ? memory.is_favorite === true
            : (memory.category ?? "").toLowerCase() ===
              selectedCategory.toLowerCase();

      return matchesQuery && matchesCategory;
    });
  }, [memories, searchQuery, selectedCategory]);

  const handleLogin = () => {
    router.push("/login?next=/search");
  };

  return (
    <main className="trace-search-page">
      <div className="search-container">

        {/* HEADER */}
        <header className="search-header">
          <div>
            {/* UPDATED TRACEMIND LOGO */}
            <Link
              href="/"
              className="brand"
              aria-label="TraceMind home"
            >
              <span className="brand-icon">T</span>

              <span className="brand-name">
                <span className="brand-trace">Trace</span>
                <span className="brand-mind">Mind</span>
              </span>
            </Link>

            <p className="eyebrow">
              YOUR PERSONAL MEMORY SPACE
            </p>

            <h1>
              Find what
              <span className="heading-accent">
                {" "}matters.
              </span>
            </h1>

            <p className="header-description">
              Search across your saved notes, links, documents,
              ideas, and memories.
            </p>
          </div>

          <Link href="/memories" className="back-link">
            <span aria-hidden="true">←</span>
            <span>All memories</span>
          </Link>
        </header>

        {/* SEARCH */}
        <section className="search-section">
          <div className="search-box">
            <span
              className="search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search your memories..."
              aria-label="Search your memories"
            />

            {searchQuery && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}

            <span className="search-shortcut">
              SEARCH
            </span>
          </div>

          <div className="search-hint">
            <span className="hint-dot" />
            Search titles, notes, categories, and saved links
          </div>
        </section>

        {/* FILTERS */}
        <section className="filter-section">
          <div className="filter-heading">
            <div>
              <h2>Explore memories</h2>
              <p>
                Find exactly what you're looking for.
              </p>
            </div>

            <button
              type="button"
              className="refresh-button"
              onClick={() => void loadMemories(true)}
              disabled={loading || refreshing}
            >
              <span aria-hidden="true">
                {refreshing ? "◌" : "↻"}
              </span>

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div
            className="category-filters"
            aria-label="Filter memories by category"
          >
            {categories.map((category) => {
              const isActive =
                selectedCategory === category;

              const label =
                category === "all"
                  ? "All memories"
                  : category === "favorites"
                    ? "★ Favorites"
                    : category.charAt(0).toUpperCase() +
                      category.slice(1);

              return (
                <button
                  key={category}
                  type="button"
                  className={`category-chip ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                  aria-pressed={isActive}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* RESULTS */}
        <section className="results-section">
          <div className="results-heading">
            <div>
              <h2>
                {loading
                  ? "Loading memories"
                  : searchQuery.trim()
                    ? "Search results"
                    : "Your memories"}
              </h2>

              {!loading &&
                isSignedIn &&
                !errorMessage && (
                  <p>
                    {filteredMemories.length}{" "}
                    {filteredMemories.length === 1
                      ? "memory"
                      : "memories"}{" "}
                    found
                  </p>
                )}
            </div>

            {searchQuery.trim() && (
              <span className="query-badge">
                “{searchQuery.trim()}”
              </span>
            )}
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="state-card">
              <div className="loading-spinner" />

              <h3>Finding your memories</h3>

              <p>
                TraceMind is loading your saved information.
              </p>
            </div>
          )}

          {/* SIGN-IN STATE */}
          {!loading &&
            isSignedIn === false &&
            !errorMessage && (
              <div className="state-card">
                <div className="state-icon">🔐</div>

                <h3>Sign in to find your memories</h3>

                <p>
                  Your saved information is connected to your
                  account. Sign in to search your personal
                  memory space.
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={handleLogin}
                >
                  Sign in to TraceMind
                  <span aria-hidden="true"> →</span>
                </button>

                <Link
                  href="/"
                  className="secondary-link"
                >
                  Back to home
                </Link>
              </div>
            )}

          {/* ERROR STATE */}
          {!loading && errorMessage && (
            <div className="state-card error-card">
              <div className="state-icon">!</div>

              <h3>We couldn't load your memories</h3>

              <p>{errorMessage}</p>

              <button
                type="button"
                className="primary-button"
                onClick={() => void loadMemories()}
              >
                Try again
              </button>

              {isSignedIn === false && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleLogin}
                >
                  Go to login
                </button>
              )}
            </div>
          )}

          {/* EMPTY DATABASE */}
          {!loading &&
            isSignedIn === true &&
            !errorMessage &&
            memories.length === 0 && (
              <div className="state-card">
                <div className="state-icon">✧</div>

                <h3>Your memory space is waiting</h3>

                <p>
                  You haven't saved any memories yet. Capture
                  something useful and it will appear here.
                </p>

                <Link
                  href="/capture"
                  className="primary-button"
                >
                  Capture a memory
                  <span aria-hidden="true"> →</span>
                </Link>
              </div>
            )}

          {/* NO SEARCH RESULTS */}
          {!loading &&
            isSignedIn === true &&
            !errorMessage &&
            memories.length > 0 &&
            filteredMemories.length === 0 && (
              <div className="state-card">
                <div className="state-icon">⌕</div>

                <h3>No matching memories</h3>

                <p>
                  Try another keyword or change the selected
                  category to find what you saved.
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}

          {/* MEMORY CARDS */}
          {!loading &&
            isSignedIn === true &&
            !errorMessage &&
            filteredMemories.length > 0 && (
              <div className="memory-grid">
                {filteredMemories.map((memory) => (
                  <Link
                    href={`/memories/${memory.id}`}
                    key={memory.id}
                    className="memory-card"
                  >
                    <div className="memory-card-top">
                      <span className="memory-type">
                        <span aria-hidden="true">
                          {memory.source_type === "image"
                            ? "▧"
                            : memory.source_type === "pdf"
                              ? "▤"
                              : memory.source_type === "link"
                                ? "↗"
                                : memory.source_type === "voice"
                                  ? "♫"
                                  : "▱"}
                        </span>

                        {getSourceLabel(memory.source_type)}
                      </span>

                      {memory.is_favorite && (
                        <span
                          className="favorite-indicator"
                          title="Favorite"
                          aria-label="Favorite"
                        >
                          ★
                        </span>
                      )}
                    </div>

                    <h3 className="memory-title">
                      {memory.title?.trim() ||
                        "Untitled memory"}
                    </h3>

                    <p className="memory-description">
                      {memory.summary?.trim() ||
                        memory.content?.trim() ||
                        "No description available for this memory."}
                    </p>

                    <div className="memory-card-footer">
                      <span className="memory-category">
                        {memory.category || "Uncategorized"}
                      </span>

                      <span className="memory-date">
                        {formatDate(memory.created_at)}
                      </span>
                    </div>

                    {memory.source_url && (
                      <div className="source-indicator">
                        <span aria-hidden="true">↗</span>
                        <span>Contains a saved link</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
        </section>

        {/* FOOTER */}
        <footer className="search-footer">
          <span className="footer-mark">T</span>

          <span>
            Your information, organized around you.
          </span>

          <span className="footer-status">
            <span className="status-dot" />
            TraceMind Search
          </span>
        </footer>
      </div>

      {/* STYLES */}
      <style jsx global>{`
        .trace-search-page {
          --search-bg: #f7f8fc;
          --search-surface: #ffffff;
          --search-text: #182033;
          --search-muted: #7b8498;
          --search-border: #e7eaf2;
          --search-accent: #6758e8;
          --search-accent-light: #f0edff;

          min-height: 100vh;
          background: var(--search-bg);
          color: var(--search-text);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          padding: 44px 24px 28px;
        }

        .trace-search-page *,
        .trace-search-page *::before,
        .trace-search-page *::after {
          box-sizing: border-box;
        }

        .trace-search-page a {
          color: inherit;
          text-decoration: none;
        }

        .search-container {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        /* ==================================
           TRACEMIND BRAND LOGO
        ================================== */

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 34px;
          line-height: 1;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .brand:hover {
          opacity: 0.88;
        }

        .brand-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border-radius: 11px;
          background: linear-gradient(
            145deg,
            #7865ff 0%,
            #6046e8 100%
          );
          color: #ffffff;
          font-size: 19px;
          font-weight: 800;
          line-height: 1;
          box-shadow: 0 4px 12px
            rgba(103, 88, 232, 0.22);
        }

        .brand-name {
          display: inline-flex;
          align-items: center;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.8px;
          line-height: 1;
        }

        .brand-trace {
          color: #171717;
        }

        .brand-mind {
          color: #6758e8;
        }

        /* HEADER */

        .search-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 36px;
        }

        .eyebrow {
          margin: 0 0 11px;
          color: var(--search-accent);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .search-header h1 {
          margin: 0;
          font-size: clamp(34px, 5vw, 49px);
          line-height: 1.12;
          font-weight: 800;
          letter-spacing: -2.1px;
        }

        .heading-accent {
          color: var(--search-accent);
        }

        .header-description {
          max-width: 570px;
          margin: 14px 0 0;
          color: var(--search-muted);
          font-size: 15px;
          line-height: 1.8;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          flex-shrink: 0;
          margin-top: 8px;
          padding: 11px 15px;
          border: 1px solid var(--search-border);
          border-radius: 12px;
          background: var(--search-surface);
          color: #4b5569 !important;
          font-size: 13px;
          font-weight: 700;
          transition:
            border-color 0.2s,
            color 0.2s,
            transform 0.2s;
        }

        .back-link:hover {
          border-color: var(--search-accent);
          color: var(--search-accent) !important;
          transform: translateY(-1px);
        }

        /* SEARCH */

        .search-section {
          margin-bottom: 37px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 14px;
          min-height: 72px;
          padding: 12px 17px 12px 22px;
          border: 1px solid #e8e9f3;
          border-radius: 19px;
          background: var(--search-surface);
          box-shadow: 0 8px 35px
            rgba(35, 39, 78, 0.045);
          transition:
            border-color 0.2s,
            box-shadow 0.2s;
        }

        .search-box:focus-within {
          border-color: #aaa0ff;
          box-shadow: 0 0 0 4px
            rgba(103, 88, 232, 0.08);
        }

        .search-icon {
          color: var(--search-accent);
          font-size: 33px;
          line-height: 1;
        }

        .search-box input {
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: var(--search-text);
          font: inherit;
          font-size: 15px;
        }

        .search-box input::placeholder {
          color: #a0a6b5;
        }

        .search-box input::-webkit-search-cancel-button {
          display: none;
        }

        .clear-search {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          border: none;
          border-radius: 8px;
          background: #f1f2f8;
          color: #667085;
          cursor: pointer;
          font-size: 22px;
        }

        .search-shortcut {
          flex-shrink: 0;
          padding: 7px 10px;
          border: 1px solid var(--search-border);
          border-radius: 8px;
          color: #9299aa;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .search-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding-left: 5px;
          color: var(--search-muted);
          font-size: 12px;
        }

        .hint-dot,
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #43bd8c;
        }

        /* FILTERS */

        .filter-section {
          margin-bottom: 35px;
        }

        .filter-heading,
        .results-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .filter-heading h2,
        .results-heading h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .filter-heading p,
        .results-heading p {
          margin: 6px 0 0;
          color: var(--search-muted);
          font-size: 12px;
        }

        .refresh-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          border: 1px solid var(--search-border);
          border-radius: 10px;
          background: #fff;
          color: #5c6477;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
        }

        .refresh-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .category-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 21px;
        }

        .category-chip {
          padding: 10px 15px;
          border: 1px solid var(--search-border);
          border-radius: 999px;
          background: #fff;
          color: #6c7488;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          transition: all 0.2s;
        }

        .category-chip:hover {
          border-color: #c7c0ff;
          color: var(--search-accent);
        }

        .category-chip.active {
          border-color: var(--search-accent);
          background: var(--search-accent);
          color: #fff;
          box-shadow: 0 4px 12px
            rgba(103, 88, 232, 0.16);
        }

        /* RESULTS */

        .results-section {
          min-height: 260px;
        }

        .results-heading {
          margin-bottom: 20px;
        }

        .query-badge {
          max-width: 45%;
          overflow: hidden;
          padding: 8px 12px;
          border-radius: 9px;
          background: var(--search-accent-light);
          color: var(--search-accent);
          font-size: 12px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* MEMORY GRID */

        .memory-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 17px;
        }

        .memory-card {
          display: flex;
          min-width: 0;
          flex-direction: column;
          padding: 20px;
          border: 1px solid var(--search-border);
          border-radius: 17px;
          background: var(--search-surface);
          box-shadow: 0 4px 18px
            rgba(35, 39, 78, 0.025);
          transition:
            transform 0.2s,
            border-color 0.2s,
            box-shadow 0.2s;
        }

        .memory-card:hover {
          transform: translateY(-3px);
          border-color: #c8c0ff;
          box-shadow: 0 12px 30px
            rgba(35, 39, 78, 0.07);
        }

        .memory-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 19px;
        }

        .memory-type {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #747c90;
          font-size: 11px;
          font-weight: 700;
        }

        .memory-type span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 27px;
          height: 27px;
          border-radius: 9px;
          background: #f0edff;
          color: var(--search-accent);
          font-size: 15px;
        }

        .favorite-indicator {
          color: #f2ad35;
          font-size: 18px;
        }

        .memory-title {
          overflow-wrap: anywhere;
          margin: 0;
          color: #20273a;
          font-size: 16px;
          font-weight: 800;
          line-height: 1.5;
          letter-spacing: -0.3px;
        }

        .memory-description {
          display: -webkit-box;
          overflow: hidden;
          min-height: 63px;
          margin: 10px 0 19px;
          color: #7d8598;
          font-size: 12px;
          line-height: 1.8;
          overflow-wrap: anywhere;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .memory-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 9px;
          margin-top: auto;
          padding-top: 14px;
          border-top: 1px solid #f0f1f6;
        }

        .memory-category {
          max-width: 60%;
          overflow: hidden;
          padding: 6px 9px;
          border-radius: 7px;
          background: #f5f4ff;
          color: #7567d9;
          font-size: 10px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .memory-date {
          flex-shrink: 0;
          color: #a0a6b5;
          font-size: 10px;
        }

        .source-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 12px;
          color: #858ca0;
          font-size: 10px;
        }

        /* STATES */

        .state-card {
          display: flex;
          align-items: center;
          flex-direction: column;
          padding: 52px 22px;
          border: 1px dashed #dfe2ef;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.75);
          text-align: center;
        }

        .state-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 53px;
          height: 53px;
          margin-bottom: 18px;
          border-radius: 17px;
          background: var(--search-accent-light);
          color: var(--search-accent);
          font-size: 23px;
          font-weight: 800;
        }

        .state-card h3 {
          margin: 0;
          color: #252b3c;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .state-card p {
          max-width: 430px;
          margin: 11px 0 23px;
          color: var(--search-muted);
          font-size: 13px;
          line-height: 1.8;
        }

        .error-card .state-icon {
          background: #fff0f0;
          color: #d94c4c;
        }

        /* BUTTONS */

        .primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 12px 18px;
          border: none;
          border-radius: 11px;
          background: var(--search-accent);
          color: #fff !important;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          transition:
            transform 0.2s,
            box-shadow 0.2s;
        }

        .primary-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px
            rgba(103, 88, 232, 0.22);
        }

        .secondary-link {
          margin-top: 17px;
          color: #777f92 !important;
          font-size: 12px;
          font-weight: 700;
        }

        .secondary-button {
          margin-top: 14px;
          padding: 10px 15px;
          border: 1px solid var(--search-border);
          border-radius: 10px;
          background: #fff;
          color: #5e667a;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
        }

        /* LOADING ANIMATION */

        .loading-spinner {
          width: 35px;
          height: 35px;
          margin-bottom: 18px;
          border: 3px solid #e9e5ff;
          border-top-color: var(--search-accent);
          border-radius: 50%;
          animation: trace-search-spin 0.8s linear infinite;
        }

        @keyframes trace-search-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* FOOTER */

        .search-footer {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 55px;
          padding-top: 22px;
          border-top: 1px solid #e8eaf2;
          color: #9299aa;
          font-size: 11px;
        }

        .footer-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 27px;
          height: 27px;
          flex-shrink: 0;
          border-radius: 9px;
          background: var(--search-accent);
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 4px 12px
            rgba(103, 88, 232, 0.16);
        }

        .footer-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-left: auto;
          color: #777f92;
          font-weight: 700;
        }

        /* TABLET */

        @media (max-width: 900px) {
          .memory-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        /* MOBILE */

        @media (max-width: 600px) {
          .trace-search-page {
            padding: 25px 16px;
          }

          .search-header {
            flex-direction: column;
            margin-bottom: 28px;
          }

          .brand {
            margin-bottom: 27px;
          }

          .brand-icon {
            width: 34px;
            height: 34px;
          }

          .brand-name {
            font-size: 19px;
          }

          .search-header h1 {
            font-size: 37px;
          }

          .header-description {
            font-size: 13px;
          }

          .back-link {
            margin-top: 0;
          }

          .search-box {
            min-height: 61px;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 14px;
          }

          .search-icon {
            font-size: 28px;
          }

          .search-box input {
            font-size: 13px;
          }

          .search-shortcut {
            display: none;
          }

          .filter-heading h2,
          .results-heading h2 {
            font-size: 17px;
          }

          .category-filters {
            gap: 7px;
          }

          .category-chip {
            padding: 9px 12px;
            font-size: 11px;
          }

          .memory-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 13px;
          }

          .memory-card {
            padding: 17px;
          }

          .memory-description {
            min-height: auto;
          }

          .state-card {
            padding: 38px 18px;
          }

          .search-footer {
            flex-wrap: wrap;
            margin-top: 35px;
          }

          .footer-status {
            width: 100%;
            margin: 8px 0 0;
          }
        }

        /* ACCESSIBILITY */

        @media (prefers-reduced-motion: reduce) {
          .trace-search-page *,
          .trace-search-page *::before,
          .trace-search-page *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}