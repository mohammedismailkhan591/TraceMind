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

type FilterType = "all" | "favorites" | "deadlines" | "recent";
type SortType = "newest" | "oldest" | "az" | "deadline";

const SOURCE_TYPES = ["Screenshot", "PDF", "Link", "Text", "Voice", "Image", "Website", "Other"];
const CATEGORIES = ["Tech", "Hackathons", "Scholarships", "Jobs", "Events", "Messages", "Non-Tech", "Education", "Finance", "Other"];

function formatDate(date: string | null) {
  if (!date) return null;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return value.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRelativeDate(date: string) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  const diff = Date.now() - value.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hr ago`;
  if (diff < week) {
    const n = Math.floor(diff / day);
    return `${n} day${n === 1 ? "" : "s"} ago`;
  }
  return formatDate(date) || "";
}

function getDeadlineStatus(deadline: string | null) {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  const diff = date.getTime() - Date.now();
  if (diff < 0) return { label: "Expired", type: "expired" };
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 1) return { label: "Due today", type: "urgent" };
  if (days <= 7) return { label: `${days} days left`, type: "soon" };
  return { label: formatDate(deadline) || "Deadline", type: "normal" };
}

function getSourceLabel(source: string) {
  if (!source) return "Memory";
  const normalized = source.toLowerCase();
  if (normalized.includes("screenshot")) return "Screenshot";
  if (normalized.includes("pdf")) return "PDF";
  if (normalized.includes("voice")) return "Voice";
  if (normalized.includes("website")) return "Website";
  if (normalized.includes("link") || normalized.includes("url")) return "Link";
  if (normalized.includes("image")) return "Image";
  if (normalized.includes("text")) return "Text";
  return source;
}

function getInitials(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "M";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0].slice(0, 1) + words[1].slice(0, 1)).toUpperCase();
}

export default function MemoriesPage() {
  const [supabase] = useState(() => createClient());
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [source, setSource] = useState("All");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  const loadMemories = useCallback(async (showRefresh = false) => {
    try {
      setError("");
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      // Check for a stored session first. getUser() can throw
      // AuthSessionMissingError when a visitor is simply signed out.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session?.user) {
        setSignedIn(false);
        setMemories([]);
        setError("");
        return;
      }

      const user = session.user;
      setSignedIn(true);
      const { data, error: memoriesError } = await supabase
        .from("memories")
        .select("id,user_id,title,summary,content,category,source_type,source_url,deadline,is_favorite,metadata,created_at,updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (memoriesError) throw memoriesError;
      setMemories((data as Memory[]) || []);
    } catch (err) {
      const authError = err as { name?: string; message?: string };
      const isMissingSession = authError?.name === "AuthSessionMissingError" ||
        /auth session missing|session missing/i.test(authError?.message || "");

      if (isMissingSession) {
        // A visitor without a session is simply signed out, not in an error state.
        setSignedIn(false);
        setMemories([]);
        setError("");
      } else {
        console.error("Memories load error:", err);
        setError(err instanceof Error ? err.message : "Unable to load your memories.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadMemories();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setSignedIn(false);
        setMemories([]);
        setError("");
        setLoading(false);
      } else {
        // Defer Supabase work until the auth callback has finished.
        window.setTimeout(() => { void loadMemories(); }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadMemories, supabase]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: memories.length,
      favorites: memories.filter((memory) => memory.is_favorite).length,
      deadlines: memories.filter((memory) => {
        if (!memory.deadline) return false;
        const deadline = new Date(memory.deadline).getTime();
        return !Number.isNaN(deadline) && deadline >= now;
      }).length,
    };
  }, [memories]);

  const filteredMemories = useMemo(() => {
    let result = [...memories];
    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((memory) =>
        [memory.title, memory.summary, memory.content, memory.category, memory.source_type, memory.source_url]
          .filter(Boolean).join(" ").toLowerCase().includes(query)
      );
    }
    if (category !== "All") {
      result = result.filter((memory) => (memory.category || "Other").toLowerCase() === category.toLowerCase());
    }
    if (source !== "All") {
      result = result.filter((memory) => getSourceLabel(memory.source_type).toLowerCase() === source.toLowerCase());
    }
    if (filter === "favorites") result = result.filter((memory) => memory.is_favorite);
    if (filter === "deadlines") {
      result = result.filter((memory) => memory.deadline && new Date(memory.deadline).getTime() >= Date.now());
    }
    if (filter === "recent") {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((memory) => new Date(memory.created_at).getTime() >= cutoff);
    }
    result.sort((a, b) => {
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "deadline") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return 0;
    });
    return result;
  }, [memories, search, category, source, filter, sort]);

  async function toggleFavorite(memory: Memory) {
    try {
      setFavoriteId(memory.id);
      setActionError("");
      const nextValue = !memory.is_favorite;
      const { error } = await supabase.from("memories")
        .update({ is_favorite: nextValue, updated_at: new Date().toISOString() })
        .eq("id", memory.id).eq("user_id", memory.user_id);
      if (error) throw error;
      setMemories((current) => current.map((item) => item.id === memory.id ? { ...item, is_favorite: nextValue } : item));
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : "Could not update favorite.");
    } finally {
      setFavoriteId(null);
    }
  }

  async function deleteMemory(memory: Memory) {
    if (!window.confirm(`Delete "${memory.title}"?\n\nThis action cannot be undone.`)) return;
    try {
      setDeletingId(memory.id);
      setActionError("");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = session?.user;
      if (!user) throw new Error("Please sign in again to delete a memory.");

      const { data: assets, error: assetsError } = await supabase.from("memory_assets")
        .select("storage_path").eq("memory_id", memory.id).eq("user_id", user.id);
      if (assetsError) console.warn("Could not read memory assets:", assetsError);

      const paths = (assets || [])
        .map((asset: { storage_path: string | null }) => asset.storage_path)
        .filter((path): path is string => typeof path === "string" && path.length > 0);

      if (paths.length) {
        const { error: storageError } = await supabase.storage.from("memory-assets").remove(paths);
        if (storageError) console.warn("Storage cleanup warning:", storageError);
      }

      const { error: assetsDeleteError } = await supabase.from("memory_assets")
        .delete().eq("memory_id", memory.id).eq("user_id", user.id);
      if (assetsDeleteError) console.warn("Asset database cleanup warning:", assetsDeleteError);

      const { error: memoryError } = await supabase.from("memories")
        .delete().eq("id", memory.id).eq("user_id", user.id);
      if (memoryError) throw memoryError;
      setMemories((current) => current.filter((item) => item.id !== memory.id));
    } catch (err) {
      console.error("Delete memory error:", err);
      setActionError(err instanceof Error ? err.message : "Could not delete this memory.");
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

  if (loading && signedIn === null) {
    return <main className="memories-page"><div className="memories-container"><div className="loading-panel"><span className="spinner" /><p>Opening your memory library…</p></div></div><Styles /></main>;
  }

  if (signedIn === false) {
    return (
      <>
        <main className="memories-page">
          <div className="memories-container">
            <header className="public-header">
              <Link href="/" className="brand"><span className="brand-mark">T</span><span className="brand-name"><span className="brand-trace">Trace</span><span className="brand-mind">Mind</span></span></Link>
              <Link href="/login?next=%2Fmemories" className="sign-in-link">Sign in <span>↗</span></Link>
            </header>
            <section className="public-hero">
              <div className="public-copy">
                <div className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL KNOWLEDGE SPACE</div>
                <h1>Everything you save.<br /><span>Never lost again.</span></h1>
                <p className="public-description">Keep screenshots, links, PDFs, notes, and important dates in one calm, searchable library. TraceMind helps you find the things you remember saving.</p>
                <div className="public-actions">
                  <Link href="/login?next=%2Fmemories" className="primary-button">Open my library <span>→</span></Link>
                  <Link href="/capture" className="secondary-button">Explore capture <span>↗</span></Link>
                </div>
                <div className="trust-note"><span className="trust-check">✓</span> Your memories stay private to your account.</div>
              </div>
              <div className="preview-wrap" aria-label="Preview of the TraceMind memory library">
                <div className="preview-window">
                  <div className="preview-top"><div className="window-dots"><i /><i /><i /></div><span>YOUR MEMORY LIBRARY</span><span className="preview-lock">Private space</span></div>
                  <div className="preview-title-row"><div><span className="preview-kicker">YOUR PERSONAL LIBRARY</span><h2>Memories</h2><p>Your life, neatly remembered.</p></div><span className="preview-add">＋</span></div>
                  <div className="preview-search">⌕ <span>Search anything you remember...</span><kbd>⌘ K</kbd></div>
                  <div className="preview-stats"><div><strong>128</strong><span>Memories</span></div><div><strong>24</strong><span>Favorites</span></div><div><strong>06</strong><span>Deadlines</span></div></div>
                  <div className="preview-card"><span className="preview-icon blue">PDF</span><div><strong>Scholarship application</strong><p>Eligibility, required documents and application details…</p><small>EDUCATION · SAVED RECENTLY</small></div><span className="preview-star">★</span></div>
                  <div className="preview-card"><span className="preview-icon purple">↗</span><div><strong>React performance notes</strong><p>Useful patterns and references for the next project…</p><small>TECH · SAVED 2 DAYS AGO</small></div><span className="preview-star muted">☆</span></div>
                  <div className="preview-card"><span className="preview-icon amber">◷</span><div><strong>Hackathon registration</strong><p>Submission date and checklist to revisit later…</p><small>EVENTS · DEADLINE SOON</small></div><span className="preview-star muted">☆</span></div>
                  <div className="preview-foot"><span><i /> All your saved details, in one place</span><span>Private by design</span></div>
                </div>
                <div className="floating-note"><span className="floating-note-icon">✦</span><span><strong>Find it when you need it</strong><small>Search across your saved knowledge</small></span></div>
              </div>
            </section>
            <section className="feature-row">
              <div><span className="feature-number">01</span><h3>One organized library</h3><p>Bring notes, links, screenshots, and files together.</p></div>
              <div><span className="feature-number">02</span><h3>Find it in seconds</h3><p>Search and filter your saved information when it matters.</p></div>
              <div><span className="feature-number">03</span><h3>Stay ahead of dates</h3><p>Keep important deadlines close to the information they belong to.</p></div>
            </section>
          </div>
        </main>
        <Styles />
      </>
    );
  }

  return (
    <>
      <main className="memories-page">
        <div className="memories-container">
          <header className="memories-header">
            <div className="memories-heading-group">
              <Link href="/" className="brand app-brand" aria-label="TraceMind home"><span className="brand-mark">T</span><span className="brand-name"><span className="brand-trace">Trace</span><span className="brand-mind">Mind</span></span></Link>
              <div className="eyebrow">YOUR PERSONAL LIBRARY</div><h1>Memories</h1><p>Everything you saved, organized in one place.</p>
            </div>
            <Link href="/capture" className="add-memory-button"><span>＋</span> Add memory</Link>
          </header>

          <section className="memory-search"><div className="search-symbol">⌕</div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search anything you remember..." aria-label="Search memories" />{search && <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">×</button>}<div className="search-hint">{filteredMemories.length} result{filteredMemories.length === 1 ? "" : "s"}</div></section>

          <section className="memory-stats">
            <div className="stat-card"><div className="stat-number">{stats.total}</div><div><div className="stat-title">Memories</div><div className="stat-subtitle">Saved information</div></div></div>
            <div className="stat-card"><div className="stat-number">{stats.favorites}</div><div><div className="stat-title">Favorites</div><div className="stat-subtitle">Important memories</div></div></div>
            <div className="stat-card"><div className="stat-number">{stats.deadlines}</div><div><div className="stat-title">Deadlines</div><div className="stat-subtitle">Upcoming dates</div></div></div>
          </section>

          <section className="filter-section">
            <div className="filter-tabs">
              {(["all", "recent", "favorites", "deadlines"] as FilterType[]).map((item) => <button key={item} className={filter === item ? "filter-tab active" : "filter-tab"} onClick={() => setFilter(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
            </div>
            <div className="filter-controls">
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option value="All">All categories</option>{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <select value={source} onChange={(event) => setSource(event.target.value)} aria-label="Filter by source"><option value="All">All sources</option>{SOURCE_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortType)} aria-label="Sort memories"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="az">A–Z</option><option value="deadline">Deadline</option></select>
              {(search || category !== "All" || source !== "All" || filter !== "all" || sort !== "newest") && <button className="reset-button" onClick={clearFilters}>Reset</button>}
            </div>
          </section>

          {error && <div className="error-box"><div><strong>Something went wrong</strong><span>{error}</span></div><button onClick={() => void loadMemories(true)}>Try again</button></div>}
          {actionError && <div className="action-error">{actionError}<button onClick={() => setActionError("")} aria-label="Dismiss error">×</button></div>}

          <div className="results-header"><div><strong>{filteredMemories.length}</strong> {filteredMemories.length === 1 ? "memory" : "memories"}</div><button className="refresh-button" onClick={() => void loadMemories(true)} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh ↻"}</button></div>

          {loading && <div className="memory-grid">{Array.from({ length: 6 }).map((_, index) => <div className="memory-skeleton" key={index}><div className="skeleton-line small" /><div className="skeleton-line title" /><div className="skeleton-line" /><div className="skeleton-line short" /><div className="skeleton-footer" /></div>)}</div>}

          {!loading && !error && filteredMemories.length === 0 && <section className="empty-state"><div className="empty-mark">TM</div><h2>{memories.length === 0 ? "Your memory library is empty" : "No memories found"}</h2><p>{memories.length === 0 ? "Save your first screenshot, PDF, link, voice note, or text and TraceMind will keep it organized." : "Try a different search or remove one of your filters."}</p>{memories.length === 0 ? <Link href="/capture" className="empty-button">Capture your first memory →</Link> : <button className="empty-button" onClick={clearFilters}>Clear filters</button>}</section>}

          {!loading && filteredMemories.length > 0 && <section className="memory-grid">{filteredMemories.map((memory) => {
            const deadline = getDeadlineStatus(memory.deadline);
            return <article className="memory-card" key={memory.id}>
              <div className="card-top"><span className="source-label">{getSourceLabel(memory.source_type)}</span><button className={memory.is_favorite ? "favorite-button active" : "favorite-button"} onClick={() => void toggleFavorite(memory)} disabled={favoriteId === memory.id} aria-label={memory.is_favorite ? "Remove from favorites" : "Add to favorites"}>{memory.is_favorite ? "★" : "☆"}</button></div>
              <Link href={`/memories/${memory.id}`} className="memory-card-main"><div className="memory-avatar">{getInitials(memory.title)}</div><div className="memory-card-content"><h2>{memory.title || "Untitled memory"}</h2><p>{memory.summary || memory.content || "No description available for this memory."}</p></div></Link>
              <div className="memory-meta">{memory.category && <span className="category-label">{memory.category}</span>}{deadline && <span className={`deadline-label ${deadline.type}`}>{deadline.label}</span>}</div>
              <div className="card-bottom"><span>Saved {formatRelativeDate(memory.created_at)}</span><div className="card-actions"><Link href={`/memories/${memory.id}`} className="view-link">View memory <span>→</span></Link><button className="delete-button" onClick={() => void deleteMemory(memory)} disabled={deletingId === memory.id}>{deletingId === memory.id ? "Deleting…" : "Delete"}</button></div></div>
            </article>;
          })}</section>}
        </div>
      </main>
      <Styles />
    </>
  );
}

function Styles() {
  return <style jsx global>{`
    :root{--tm-bg:#f6f8fc;--tm-surface:#fff;--tm-text:#172033;--tm-muted:#718096;--tm-soft:#f1f4f8;--tm-line:#e5e9ef;--tm-blue:#315ee8;--tm-blue-soft:#edf2ff;--tm-danger:#dc2626;--tm-warning:#b45309}
    .memories-page{min-height:100vh;background:radial-gradient(ellipse at 75% 0%,rgba(215,226,255,.35),transparent 36%),var(--tm-bg);color:var(--tm-text);padding:38px 34px 72px}
    .memories-container{width:min(1180px,100%);margin:0 auto}
    .eyebrow{color:var(--tm-blue);font-size:10px;font-weight:850;letter-spacing:.16em;margin-bottom:10px}
    .memories-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:28px}.memories-heading-group{min-width:0}.app-brand{margin-bottom:25px;width:max-content}.brand-mark{width:33px;height:33px;display:grid;place-items:center;border-radius:11px;background:linear-gradient(145deg,#7665ff,#5b4ce2);color:white;font-size:17px;font-weight:800;box-shadow:0 7px 16px #6657ee30}.brand-name{display:inline-flex;align-items:center;font-size:18px;font-weight:850;letter-spacing:-.045em;line-height:1}.brand-trace{color:#171717}.brand-mind{color:#6958f5}
    .memories-header h1{margin:0;font-size:clamp(32px,4vw,44px);line-height:1.05;letter-spacing:-.05em;font-weight:780}
    .memories-header p{margin:11px 0 0;color:var(--tm-muted);font-size:14px}
    .add-memory-button,.primary-button{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:45px;padding:0 18px;border-radius:12px;background:#172033;color:#fff;text-decoration:none;font-size:13px;font-weight:750;box-shadow:0 7px 18px #17203318;transition:transform .2s,box-shadow .2s}
    .add-memory-button:hover,.primary-button:hover{transform:translateY(-2px);box-shadow:0 12px 25px #17203322}
    .add-memory-button span{font-size:18px}
    .memory-search{height:64px;background:#fff;border:1px solid var(--tm-line);border-radius:16px;display:flex;align-items:center;padding:0 17px;box-shadow:0 8px 28px #0f172a06;margin-bottom:18px}
    .search-symbol{width:34px;color:#8792a5;font-size:28px;display:flex;align-items:center;justify-content:center}
    .memory-search input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;font-size:15px;color:var(--tm-text);padding:0 8px}
    .memory-search input::placeholder{color:#9aa4b2}
    .clear-search{width:30px;height:30px;border:0;border-radius:50%;background:var(--tm-soft);color:#697386;cursor:pointer;font-size:18px}
    .search-hint{color:#9aa4b2;font-size:12px;white-space:nowrap;margin-left:10px}
    .memory-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:27px}
    .stat-card{background:#ffffffd9;border:1px solid var(--tm-line);border-radius:15px;min-height:88px;display:flex;align-items:center;gap:15px;padding:17px 20px}
    .stat-number{font-size:27px;font-weight:800;letter-spacing:-.05em}
    .stat-title{font-size:13px;font-weight:750}.stat-subtitle{margin-top:4px;color:var(--tm-muted);font-size:11px}
    .filter-section{display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid var(--tm-line);margin-bottom:20px;padding-bottom:13px}
    .filter-tabs{display:flex;gap:5px;flex-wrap:wrap}
    .filter-tab{border:0;background:transparent;color:#778195;padding:9px 12px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;transition:background .18s,color .18s}
    .filter-tab:hover{color:var(--tm-text);background:var(--tm-soft)}.filter-tab.active{color:var(--tm-blue);background:var(--tm-blue-soft)}
    .filter-controls{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}
    .filter-controls select{height:36px;padding:0 27px 0 10px;border:1px solid var(--tm-line);border-radius:9px;background:#fff;color:#4a5568;font-size:12px;outline:none;cursor:pointer}
    .filter-controls select:focus{border-color:#a9c5f7;box-shadow:0 0 0 3px #eff6ff}
    .reset-button,.refresh-button{border:0;background:transparent;color:var(--tm-blue);font-size:12px;font-weight:750;cursor:pointer}.reset-button{height:35px}.refresh-button:disabled{opacity:.5;cursor:default}
    .results-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;color:var(--tm-muted);font-size:12px}.results-header strong{color:var(--tm-text)}
    .memory-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
    .memory-card{background:var(--tm-surface);border:1px solid var(--tm-line);border-radius:17px;padding:18px;min-width:0;box-shadow:0 4px 15px #0f172a04;transition:transform .2s,box-shadow .2s,border-color .2s}
    .memory-card:hover{transform:translateY(-2px);border-color:#d5dce6;box-shadow:0 14px 35px #0f172a0b}
    .card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
    .source-label{display:inline-flex;align-items:center;height:24px;padding:0 9px;border-radius:7px;background:#f3f5f9;color:#667085;font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
    .favorite-button{width:30px;height:30px;border:0;border-radius:9px;background:transparent;color:#a0a8b5;font-size:19px;cursor:pointer;transition:background .18s}.favorite-button:hover{background:#f7f8fa}.favorite-button.active{color:#e19a21}.favorite-button:disabled{opacity:.5}
    .memory-card-main{display:flex;align-items:flex-start;gap:13px;text-decoration:none;color:inherit;margin-bottom:15px}
    .memory-avatar{width:41px;height:41px;flex:0 0 41px;border-radius:12px;background:linear-gradient(135deg,#edf3ff,#e4eaff);color:var(--tm-blue);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:850}
    .memory-card-content{min-width:0}.memory-card-content h2{margin:0;font-size:15px;line-height:1.4;font-weight:760;letter-spacing:-.02em;color:#202938}.memory-card-main:hover h2{color:var(--tm-blue)}
    .memory-card-content p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:6px 0 0;color:#798394;font-size:12px;line-height:1.6;overflow-wrap:anywhere}
    .memory-meta{display:flex;align-items:center;gap:7px;min-height:24px;flex-wrap:wrap;margin-bottom:13px}
    .category-label,.deadline-label{display:inline-flex;align-items:center;min-height:23px;padding:0 8px;border-radius:7px;font-size:10px;font-weight:750}
    .category-label{background:#f4f6f9;color:#687385}.deadline-label{background:#f4f6f9;color:#697586}.deadline-label.urgent{color:#b42318;background:#fff1f0}.deadline-label.soon{color:var(--tm-warning);background:#fff8eb}.deadline-label.expired{color:#8b1e1e;background:#fceaea}
    .card-bottom{border-top:1px solid #edf0f4;padding-top:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:#9aa3b1;font-size:10px}
    .card-actions{display:flex;align-items:center;gap:13px}.view-link{color:var(--tm-blue);text-decoration:none;font-size:11px;font-weight:800;white-space:nowrap}.view-link span{margin-left:3px}
    .delete-button{border:0;background:transparent;color:#9ca3af;font-size:10px;cursor:pointer}.delete-button:hover{color:var(--tm-danger)}.delete-button:disabled{opacity:.5;cursor:default}
    .empty-state{background:#ffffffd9;border:1px dashed #d8dee8;border-radius:20px;padding:64px 25px;text-align:center}
    .empty-mark{width:49px;height:49px;border-radius:15px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:#edf3ff;color:var(--tm-blue);font-size:12px;font-weight:850}
    .empty-state h2{margin:0;font-size:20px;letter-spacing:-.03em}.empty-state p{max-width:460px;margin:10px auto 21px;color:var(--tm-muted);font-size:13px;line-height:1.7}
    .empty-button{display:inline-flex;align-items:center;justify-content:center;min-height:41px;padding:0 16px;border-radius:10px;background:#172033;color:white;text-decoration:none;border:0;font-size:12px;font-weight:750;cursor:pointer}
    .error-box{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 15px;margin-bottom:18px;background:#fff5f5;border:1px solid #fed7d7;border-radius:12px}
    .error-box div{display:flex;flex-direction:column;gap:4px}.error-box strong{color:#991b1b;font-size:12px}.error-box span{color:#b45353;font-size:11px;overflow-wrap:anywhere}
    .error-box button{flex-shrink:0;border:0;background:#991b1b;color:white;border-radius:8px;padding:8px 11px;font-size:11px;font-weight:750;cursor:pointer}
    .action-error{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:15px;padding:11px 13px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:10px;font-size:11px;overflow-wrap:anywhere}
    .action-error button{flex-shrink:0;border:0;background:transparent;color:inherit;font-size:17px;cursor:pointer}
    .memory-skeleton{min-height:205px;border:1px solid var(--tm-line);border-radius:17px;padding:18px;background:white;overflow:hidden;position:relative}
    .memory-skeleton:after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,#ffffffbf,transparent);animation:tm-shimmer 1.5s infinite}
    .skeleton-line{width:75%;height:11px;border-radius:6px;background:#edf0f4;margin-bottom:13px}.skeleton-line.small{width:18%;height:22px;margin-bottom:17px}.skeleton-line.title{width:65%;height:15px}.skeleton-line.short{width:45%}
    .skeleton-footer{position:absolute;left:18px;right:18px;bottom:18px;height:1px;background:#edf0f4}@keyframes tm-shimmer{100%{transform:translateX(100%)}}
    .loading-panel{min-height:55vh;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--tm-muted);font-size:13px}.spinner{width:28px;height:28px;border:3px solid #dce5ff;border-top-color:var(--tm-blue);border-radius:50%;animation:tm-spin .8s linear infinite}@keyframes tm-spin{to{transform:rotate(360deg)}}
    .public-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:58px}.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#172033;font-size:18px;font-weight:850;letter-spacing:-.04em}.public-header .brand-mark{width:33px;height:33px;display:grid;place-items:center;border-radius:11px;background:linear-gradient(145deg,#7665ff,#5b4ce2);color:white;font-size:17px;font-weight:800;box-shadow:0 7px 16px #6657ee30}.public-header .brand{gap:10px}.public-header .brand{color:#172033}.public-header .brand:not(:has(.brand-name)){font-size:18px}.public-header .brand-mark + .brand-name{display:inline-flex;align-items:center}.public-header .brand-trace{color:#171717}.public-header .brand-mind{color:#6958f5}
    .sign-in-link{display:inline-flex;align-items:center;gap:8px;color:#263248;text-decoration:none;font-size:13px;font-weight:750;padding:10px 14px;border:1px solid #dfe5ef;border-radius:11px;background:#ffffffb8}.sign-in-link:hover{background:white;border-color:#cbd5e1}
    .public-hero{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);align-items:center;gap:55px;padding:10px 0 64px}
    .public-copy{padding:8px 0}.public-copy .eyebrow{display:flex;align-items:center;gap:9px;margin-bottom:22px}.eyebrow-dot{width:7px;height:7px;background:#315ee8;border-radius:50%;box-shadow:0 0 0 4px #315ee81a}
    .public-copy h1{font-size:clamp(40px,5.2vw,65px);line-height:1.03;letter-spacing:-.065em;margin:0;font-weight:850;color:#172033}.public-copy h1 span{color:#315ee8}
    .public-description{max-width:490px;margin:22px 0 26px;color:#68758a;font-size:15px;line-height:1.85}
    .public-actions{display:flex;gap:11px;flex-wrap:wrap}.primary-button{min-height:48px;padding:0 19px}.primary-button span{font-size:18px}.secondary-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:48px;padding:0 17px;border:1px solid #dce2ec;border-radius:12px;background:#ffffffa6;color:#263248;text-decoration:none;font-size:13px;font-weight:750}.secondary-button:hover{background:white}
    .trust-note{display:flex;align-items:center;gap:9px;margin-top:21px;color:#758197;font-size:11px}.trust-check{display:grid;place-items:center;width:17px;height:17px;border-radius:50%;background:#e4f8ed;color:#17834b;font-size:11px;font-weight:900}
    .preview-wrap{position:relative;min-width:0;padding:10px 8px 22px}.preview-window{position:relative;background:#fff;border:1px solid #e1e7f0;border-radius:20px;padding:17px;box-shadow:0 25px 70px #1d315b16,0 3px 10px #1d315b08;transform:rotate(.5deg)}
    .preview-top{display:flex;align-items:center;gap:12px;border-bottom:1px solid #edf0f5;padding:0 0 14px;color:#a0a8b7;font-size:8px;font-weight:850;letter-spacing:.13em}.window-dots{display:flex;gap:4px}.window-dots i{width:6px;height:6px;border-radius:50%;background:#d8deea}.preview-lock{margin-left:auto;letter-spacing:0;text-transform:none;font-size:9px;color:#8290a4;background:#f4f6fa;padding:5px 8px;border-radius:7px}
    .preview-title-row{display:flex;justify-content:space-between;align-items:center;padding:19px 1px 15px}.preview-kicker{font-size:8px;letter-spacing:.13em;color:#315ee8;font-weight:850}.preview-title-row h2{font-size:25px;letter-spacing:-.05em;margin:5px 0 2px}.preview-title-row p{margin:0;color:#8993a4;font-size:10px}.preview-add{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#172033;color:white;font-size:20px}
    .preview-search{height:39px;display:flex;align-items:center;gap:9px;padding:0 11px;border:1px solid #e8ecf2;border-radius:10px;color:#a1aaba;font-size:19px}.preview-search span{font-size:9px;flex:1}.preview-search kbd{font-size:8px;border:1px solid #e8ecf2;border-radius:4px;padding:3px 5px;color:#9aa3b1}
    .preview-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.preview-stats div{display:flex;flex-direction:column;gap:4px;padding:10px 11px;border:1px solid #edf0f5;border-radius:10px}.preview-stats strong{font-size:17px;letter-spacing:-.04em}.preview-stats span{font-size:8px;color:#8993a4}
    .preview-card{display:flex;align-items:flex-start;gap:10px;padding:12px 2px;border-bottom:1px solid #f0f2f6}.preview-icon{width:31px;height:31px;flex:0 0 31px;display:grid;place-items:center;border-radius:9px;font-size:8px;font-weight:850}.preview-icon.blue{background:#edf3ff;color:#315ee8}.preview-icon.purple{background:#f1edff;color:#7755c7;font-size:17px}.preview-icon.amber{background:#fff4df;color:#b77918;font-size:16px}.preview-card>div{min-width:0;flex:1}.preview-card strong{display:block;font-size:10px;color:#283348}.preview-card p{margin:4px 0 5px;font-size:8px;color:#8a95a7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.preview-card small{font-size:7px;color:#a0a9b7;font-weight:800;letter-spacing:.08em}.preview-star{font-size:13px;color:#d69a29}.preview-star.muted{color:#c4cad4}
    .preview-foot{display:flex;justify-content:space-between;gap:10px;padding:13px 2px 0;color:#9aa4b3;font-size:8px}.preview-foot span:first-child{display:flex;align-items:center;gap:6px}.preview-foot i{width:5px;height:5px;background:#31a56b;border-radius:50%}
    .floating-note{position:absolute;right:-17px;bottom:0;display:flex;align-items:center;gap:10px;padding:12px 15px;background:#fff;border:1px solid #e5eaf2;border-radius:13px;box-shadow:0 12px 30px #17203312}.floating-note-icon{width:30px;height:30px;display:grid;place-items:center;background:#edf3ff;border-radius:9px;color:#315ee8}.floating-note strong,.floating-note small{display:block}.floating-note strong{font-size:10px;color:#253147}.floating-note small{margin-top:4px;font-size:8px;color:#8a95a7}
    .feature-row{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;padding:29px 0 12px;border-top:1px solid #e2e7f0}.feature-row>div{padding:7px 0}.feature-number{font-size:10px;font-weight:850;letter-spacing:.12em;color:#315ee8}.feature-row h3{margin:10px 0 7px;font-size:14px;letter-spacing:-.02em}.feature-row p{margin:0;max-width:280px;color:#778398;font-size:12px;line-height:1.7}
    @media(max-width:950px){.memories-page{padding:30px 22px 55px}.memory-grid{grid-template-columns:1fr}.filter-section{align-items:flex-start;flex-direction:column}.filter-controls{justify-content:flex-start}.public-hero{gap:30px}.public-copy h1{font-size:clamp(38px,5vw,54px)}.floating-note{right:-5px}}
    @media(max-width:700px){.memories-page{padding:23px 15px 45px}.memories-header{align-items:flex-start;flex-direction:column;margin-bottom:22px}.app-brand{margin-bottom:21px}.add-memory-button{width:100%}.memory-search{height:58px}.search-hint{display:none}.memory-stats{grid-template-columns:1fr}.stat-card{min-height:72px}.filter-controls{width:100%}.filter-controls select{flex:1;min-width:0}.memory-card{padding:15px}.card-bottom{align-items:flex-start;flex-direction:column}.card-actions{width:100%;justify-content:space-between}.public-header{margin-bottom:37px}.public-hero{grid-template-columns:1fr;gap:25px;padding-bottom:45px}.public-copy h1{font-size:clamp(42px,11vw,60px)}.public-description{font-size:14px}.preview-wrap{margin:0 4px;padding:4px 0 20px}.preview-window{padding:13px;border-radius:16px}.floating-note{right:0}.feature-row{grid-template-columns:1fr;gap:19px;padding-top:24px}.feature-row>div{padding:0}.feature-row h3{margin-top:6px}.public-actions>*{flex:1}.preview-foot{font-size:7px}}
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
  `}</style>;
}
