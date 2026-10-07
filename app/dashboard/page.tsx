"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";
import Sidebar from "../../components/sidebar";

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

export default function DashboardPage() {
  const supabase = createClient();

  const [memories, setMemories] = useState<Memory[]>([]);
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

      const { data } = await supabase
        .from("memories")
        .select(
          "id,title,summary,category,source_type,source_url,created_at,is_favorite"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);

      setMemories((data as Memory[]) || []);
      setLoading(false);
    }

    loadMemories();
  }, []);

  return (
    <main className="page">
      {/* SHARED SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <section className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">PERSONAL MEMORY</div>
            <h1>Dashboard</h1>
          </div>

          <Link href="/capture" className="capture-button">
            + Capture memory
          </Link>
        </header>

        {/* HERO */}
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-label">YOUR MEMORY SPACE</span>

            <h2>
              Remember what matters.
              <br />
              <span>Find it when you need it.</span>
            </h2>

            <p>
              TraceMind keeps the information you save organized so you can
              return to it without remembering exactly where you saw it.
            </p>

            <Link href="/memories" className="hero-search">
              <span>⌕</span>
              Search your memories
              <b>→</b>
            </Link>
          </div>

          <div className="hero-orbit">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />

            <div className="orbit-dot dot-one" />
            <div className="orbit-dot dot-two" />
            <div className="orbit-dot dot-three" />

            <div className="orbit-center">TM</div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats">
          <div className="stat-card">
            <span>MEMORIES</span>
            <strong>{memories.length}</strong>
            <p>Saved in your memory space</p>
          </div>

          <div className="stat-card">
            <span>FAVORITES</span>
            <strong>
              {memories.filter((memory) => memory.is_favorite).length}
            </strong>
            <p>Important memories</p>
          </div>

          <div className="stat-card">
            <span>RECENT</span>
            <strong>{memories.slice(0, 3).length}</strong>
            <p>Recently captured</p>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="section">
          <div className="section-heading">
            <div>
              <span>QUICK ACTIONS</span>
              <h2>Capture something</h2>
            </div>
          </div>

          <div className="quick-grid">
            <Link href="/capture" className="quick-card">
              <div className="quick-icon">＋</div>

              <div>
                <strong>Capture memory</strong>
                <p>Save something you want to remember.</p>
              </div>

              <span className="arrow">→</span>
            </Link>

            <Link href="/memories" className="quick-card">
              <div className="quick-icon">⌕</div>

              <div>
                <strong>Search memories</strong>
                <p>Find something you saved before.</p>
              </div>

              <span className="arrow">→</span>
            </Link>

            <Link href="/memories" className="quick-card">
              <div className="quick-icon">▣</div>

              <div>
                <strong>Browse memories</strong>
                <p>See everything in your memory space.</p>
              </div>

              <span className="arrow">→</span>
            </Link>
          </div>
        </section>

        {/* RECENT MEMORIES */}
        <section className="section">
          <div className="section-heading">
            <div>
              <span>MEMORY SPACE</span>
              <h2>Recently captured</h2>
            </div>

            <Link href="/memories" className="view-link">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="empty-card">
              <div className="loader" />
              <p>Loading your memories...</p>
            </div>
          ) : memories.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">＋</div>

              <h3>Your memory space is empty</h3>

              <p>
                Capture your first memory and start building your personal
                information space.
              </p>

              <Link href="/capture" className="empty-button">
                Capture your first memory
              </Link>
            </div>
          ) : (
            <div className="memory-list">
              {memories.map((memory) => (
                <Link
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
                      {memory.category && <span>{memory.category}</span>}

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
                    </div>
                  </div>

                  <div className="memory-arrow">→</div>
                </Link>
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
          transform: translateY(-1px);
          background: #272a31;
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

        .hero-search {
          width: 310px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #24272d;
          border: 1px solid #363941;
          color: #e8e9eb;
          text-decoration: none;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 12px;
          transition: 0.2s ease;
        }

        .hero-search:hover {
          background: #2c2f36;
        }

        .hero-search span {
          font-size: 18px;
          color: #aeb2b9;
        }

        .hero-search b {
          margin-left: auto;
          font-size: 16px;
          font-weight: 500;
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

        /* SECTIONS */

        .section {
          margin-top: 38px;
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

        .view-link {
          color: #777b83;
          text-decoration: none;
          font-size: 12px;
          font-weight: 650;
        }

        .view-link:hover {
          color: #17191e;
        }

        /* QUICK ACTIONS */

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .quick-card {
          background: #fff;
          border: 1px solid #e7e8eb;
          border-radius: 15px;
          padding: 17px;
          display: flex;
          align-items: center;
          gap: 13px;
          text-decoration: none;
          color: inherit;
          transition: 0.2s ease;
        }

        .quick-card:hover {
          transform: translateY(-2px);
          border-color: #d7d9dd;
          box-shadow: 0 8px 25px rgba(23, 25, 30, 0.05);
        }

        .quick-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: #f0f1f3;
          display: grid;
          place-items: center;
          font-size: 19px;
          flex-shrink: 0;
        }

        .quick-card strong {
          display: block;
          font-size: 13px;
        }

        .quick-card p {
          margin: 4px 0 0;
          color: #999ca2;
          font-size: 10px;
          line-height: 1.5;
        }

        .arrow {
          margin-left: auto;
          color: #a0a3a9;
          font-size: 16px;
        }

        /* MEMORIES */

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
          background: #17191e;
          color: white;
          text-decoration: none;
          padding: 10px 15px;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 650;
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

        /* SMALL TABLET */

        @media (max-width: 900px) {
          .content {
            margin-left: 76px;
          }

          .hero-orbit {
            width: 150px;
            height: 150px;
          }

          .quick-grid {
            grid-template-columns: 1fr;
          }
        }

        /* MOBILE */

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

          .hero-search {
            width: 100%;
          }

          .hero-orbit {
            display: none;
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