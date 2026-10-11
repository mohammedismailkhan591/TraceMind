"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

type Memory = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  source_type: string;
  source_url: string | null;
  created_at: string;
  deadline: string | null;
  is_favorite: boolean;
};

const categories = [
  "All",
  "Tech",
  "Hackathons",
  "Scholarships",
  "Jobs",
  "Events",
  "Messages",
  "Non-Tech",
  "Other",
];

export default function SearchPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

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
        "id,title,summary,category,source_type,source_url,created_at,deadline,is_favorite"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMemories(data);
    }

    setLoading(false);
  }

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();

    return memories.filter((memory) => {
      const searchableText = [
        memory.title,
        memory.summary,
        memory.category,
        memory.source_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search || searchableText.includes(search);

      const matchesCategory =
        category === "All" ||
        (memory.category || "Other") === category;

      const matchesFavorite =
        !favoritesOnly || memory.is_favorite;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesFavorite
      );
    });
  }, [memories, query, category, favoritesOnly]);

  function clearFilters() {
    setQuery("");
    setCategory("All");
    setFavoritesOnly(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f8fb",
        padding: "42px 48px 70px",
        color: "#17191f",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1120px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <header style={{ marginBottom: "30px" }}>
          <div
            style={{
              marginBottom: "8px",
              color: "#8b9099",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "1.2px",
            }}
          >
            FIND YOUR INFORMATION
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "31px",
              lineHeight: 1.2,
              fontWeight: 700,
              letterSpacing: "-0.7px",
            }}
          >
            Search your memories
          </h1>

          <p
            style={{
              maxWidth: "600px",
              margin: "9px 0 0",
              color: "#777d87",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Find the information you've saved and quickly
            return to where you found it.
          </p>
        </header>

        {/* SEARCH PANEL */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e7eb",
            borderRadius: "15px",
            padding: "17px",
            boxShadow: "0 4px 18px rgba(20,25,35,0.035)",
          }}
        >
          {/* SEARCH INPUT */}
          <div
            style={{
              height: "58px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "0 16px",
              background: "#f8f9fa",
              border: "1px solid #e1e3e7",
              borderRadius: "11px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              style={{
                flexShrink: 0,
                color: "#777d87",
              }}
            >
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 5 5" />
            </svg>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you trying to remember?"
              aria-label="Search memories"
              style={{
                width: "100%",
                border: 0,
                outline: 0,
                background: "transparent",
                color: "#17191f",
                fontFamily: "inherit",
                fontSize: "15px",
              }}
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{
                  width: "27px",
                  height: "27px",
                  flexShrink: 0,
                  border: 0,
                  borderRadius: "50%",
                  background: "#e8e9ec",
                  color: "#656b74",
                  fontSize: "19px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* FILTERS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "15px",
              marginTop: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                overflowX: "auto",
                paddingBottom: "2px",
              }}
            >
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  style={{
                    flexShrink: 0,
                    padding: "7px 11px",
                    border:
                      category === item
                        ? "1px solid #17191f"
                        : "1px solid transparent",
                    borderRadius: "7px",
                    background:
                      category === item
                        ? "#17191f"
                        : "transparent",
                    color:
                      category === item
                        ? "#ffffff"
                        : "#7a808a",
                    fontFamily: "inherit",
                    fontSize: "11px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setFavoritesOnly(!favoritesOnly)
              }
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                border: favoritesOnly
                  ? "1px solid #d8dae0"
                  : "1px solid #e1e3e7",
                borderRadius: "8px",
                background: favoritesOnly
                  ? "#f1f1f3"
                  : "#ffffff",
                color: "#666c76",
                fontFamily: "inherit",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span>★</span>
              Favorites
            </button>
          </div>
        </section>

        {/* RESULTS HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            margin: "35px 2px 13px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 650,
              }}
            >
              {query
                ? "Search results"
                : "Your saved information"}
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                color: "#9499a2",
                fontSize: "11px",
              }}
            >
              {loading
                ? "Loading..."
                : `${results.length} ${
                    results.length === 1
                      ? "item"
                      : "items"
                  } found`}
            </p>
          </div>

          {(query ||
            category !== "All" ||
            favoritesOnly) && (
            <button
              type="button"
              onClick={clearFilters}
              style={{
                border: 0,
                background: "transparent",
                color: "#6e747e",
                fontFamily: "inherit",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div
            style={{
              minHeight: "300px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              border: "1px dashed #dfe1e5",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "25px",
                height: "25px",
                marginBottom: "14px",
                border: "2px solid #e3e5e8",
                borderTopColor: "#5e646d",
                borderRadius: "50%",
                animation: "traceSearchSpin 0.8s linear infinite",
              }}
            />

            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 650,
              }}
            >
              Finding your information
            </h3>

            <p
              style={{
                margin: "7px 0 0",
                color: "#8a9099",
                fontSize: "12px",
              }}
            >
              Loading your saved memories...
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && results.length === 0 && (
          <div
            style={{
              minHeight: "300px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
              background: "#ffffff",
              border: "1px dashed #dfe1e5",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
                borderRadius: "13px",
                background: "#f0f1f3",
                color: "#777d87",
              }}
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 5 5" />
              </svg>
            </div>

            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 650,
              }}
            >
              {query
                ? "No matching information"
                : "Nothing saved yet"}
            </h3>

            <p
              style={{
                margin: "7px 0 17px",
                color: "#8a9099",
                fontSize: "12px",
              }}
            >
              {query
                ? "Try different words or remove one of the filters."
                : "Capture something first and it will appear here."}
            </p>

            {!query && (
              <Link
                href="/capture"
                style={{
                  padding: "9px 14px",
                  borderRadius: "8px",
                  background: "#17191f",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Capture something
              </Link>
            )}
          </div>
        )}

        {/* RESULTS */}
        {!loading && results.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "9px",
            }}
          >
            {results.map((memory) => (
              <Link
                key={memory.id}
                href={`/memories/${memory.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "25px",
                  padding: "19px 20px",
                  background: "#ffffff",
                  border: "1px solid #e7e8ec",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        color: "#1b1e24",
                        fontSize: "15px",
                        fontWeight: 650,
                      }}
                    >
                      {memory.title}
                    </h3>

                    {memory.is_favorite && (
                      <span
                        style={{
                          color: "#777d87",
                          fontSize: "12px",
                        }}
                      >
                        ★
                      </span>
                    )}
                  </div>

                  {memory.summary && (
                    <p
                      style={{
                        maxWidth: "760px",
                        margin: "6px 0 0",
                        color: "#777d87",
                        fontSize: "12px",
                        lineHeight: 1.55,
                      }}
                    >
                      {memory.summary}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "7px",
                      marginTop: "11px",
                      color: "#969ba4",
                      fontSize: "10px",
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 7px",
                        background: "#f1f2f4",
                        borderRadius: "5px",
                        color: "#666c75",
                        fontWeight: 600,
                      }}
                    >
                      {memory.category || "Other"}
                    </span>

                    <span>
                      {formatSource(memory.source_type)}
                    </span>

                    <span>•</span>

                    <span>
                      {formatDate(memory.created_at)}
                    </span>

                    {memory.deadline && (
                      <>
                        <span>•</span>

                        <span>
                          Deadline{" "}
                          {formatDate(memory.deadline)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <span
                  style={{
                    flexShrink: 0,
                    color: "#a0a5ad",
                    fontSize: "19px",
                  }}
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes traceSearchSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 800px) {
          .trace-search-page-mobile {
            padding: 30px 20px !important;
          }
        }
      `}</style>
    </main>
  );
}

function formatSource(source: string) {
  return source
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}