"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase";

type Memory = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  source_type: string;
  deadline: string | null;
  created_at: string;
};

type Reminder = {
  id: string;
  title: string;
  reminder_at: string;
  completed: boolean;
  memory_id: string | null;
};

export default function Dashboard() {
  const supabase = createClient();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("there");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const displayName =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "there";

    setName(displayName);

    const { data: memoryData } = await supabase
      .from("memories")
      .select(
        "id,title,summary,content,category,source_type,deadline,created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: reminderData } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .order("reminder_at", { ascending: true });

    setMemories(memoryData || []);
    setReminders(reminderData || []);

    setLoading(false);
  }

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return memories
      .filter((memory) => {
        const searchable = `
          ${memory.title}
          ${memory.summary || ""}
          ${memory.content || ""}
          ${memory.category || ""}
          ${memory.source_type}
        `.toLowerCase();

        return searchable.includes(query);
      })
      .slice(0, 5);
  }, [search, memories]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();

    return memories
      .filter(
        (memory) =>
          memory.deadline &&
          new Date(memory.deadline) >= now
      )
      .sort(
        (a, b) =>
          new Date(a.deadline!).getTime() -
          new Date(b.deadline!).getTime()
      )
      .slice(0, 4);
  }, [memories]);

  const capturedToday = memories.filter((memory) => {
    const date = new Date(memory.created_at);
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }).length;

  return (
    <main className="page">
      <aside className="sidebar">
        <div className="logo">T</div>

        <nav>
          <Link className="active" href="/dashboard">
            ⌂
          </Link>

          <Link href="/capture">＋</Link>

          <Link href="/memories">▣</Link>

          <Link href="/timeline">◷</Link>

          <Link href="/reminders">◌</Link>
        </nav>
      </aside>

      <section className="content">
        <header>
          <div>
            <p className="eyebrow">YOUR MEMORY ENGINE</p>

            <h1>
              Good to see you, {name}.
            </h1>

            <p className="subtitle">
              Find something you remember, or capture something new.
            </p>
          </div>

          <Link href="/capture" className="captureButton">
            + Capture
          </Link>
        </header>

        <section className="memorySearch">
          <div className="searchIcon">⌕</div>

          <div className="searchContent">
            <p>What are you trying to remember?</p>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try a keyword, phrase, topic, or detail..."
            />
          </div>

          {search && (
            <button
              className="clearButton"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </section>

        {search && (
          <section className="searchResults">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">MEMORY SEARCH</p>
                <h2>
                  {searchResults.length}{" "}
                  {searchResults.length === 1
                    ? "match"
                    : "matches"}{" "}
                  found
                </h2>
              </div>

              <Link href="/memories">
                View all
              </Link>
            </div>

            {searchResults.length === 0 ? (
              <div className="noResults">
                <span>⌕</span>
                <div>
                  <strong>Nothing found yet</strong>
                  <p>
                    Try another word or capture more information.
                  </p>
                </div>
              </div>
            ) : (
              <div className="resultList">
                {searchResults.map((memory) => (
                  <Link
                    key={memory.id}
                    href={`/memories/${memory.id}`}
                    className="resultCard"
                  >
                    <div className="resultIcon">
                      {memory.source_type === "PDF"
                        ? "PDF"
                        : "IMG"}
                    </div>

                    <div className="resultInfo">
                      <strong>{memory.title}</strong>

                      <p>
                        {memory.summary ||
                          memory.content?.slice(0, 140) ||
                          "No description available."}
                      </p>

                      <div>
                        <span>
                          {memory.category || "Other"}
                        </span>

                        <span>
                          {new Date(
                            memory.created_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <span className="arrow">→</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="quickCapture">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">CAPTURE</p>
              <h2>Save something</h2>
            </div>
          </div>

          <div className="captureOptions">
            <Link href="/capture" className="captureOption">
              <div>▧</div>
              <strong>Screenshot</strong>
              <span>Read text from an image</span>
            </Link>

            <Link href="/capture" className="captureOption">
              <div>□</div>
              <strong>PDF</strong>
              <span>Extract information from a document</span>
            </Link>

            <Link href="/capture" className="captureOption">
              <div>＋</div>
              <strong>Something else</strong>
              <span>Capture another memory</span>
            </Link>
          </div>
        </section>

        <section className="dashboardGrid">
          <div className="panel">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">RECENTLY SAVED</p>
                <h2>Your latest memories</h2>
              </div>

              <Link href="/memories">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="emptySmall">
                Loading...
              </div>
            ) : memories.length === 0 ? (
              <div className="emptySmall">
                <strong>No memories yet.</strong>
                <p>
                  Capture your first piece of information.
                </p>
              </div>
            ) : (
              <div className="recentList">
                {memories.slice(0, 5).map((memory) => (
                  <Link
                    key={memory.id}
                    href={`/memories/${memory.id}`}
                    className="recentItem"
                  >
                    <div className="recentDot" />

                    <div>
                      <strong>{memory.title}</strong>

                      <p>
                        {memory.category || "Other"} ·{" "}
                        {new Date(
                          memory.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <span>→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="sidePanels">
            <div className="panel">
              <div className="sectionHeader">
                <div>
                  <p className="eyebrow">NEEDS ATTENTION</p>
                  <h2>Upcoming deadlines</h2>
                </div>

                <Link href="/reminders">
                  All
                </Link>
              </div>

              {upcomingDeadlines.length === 0 ? (
                <div className="emptySmall">
                  <strong>No upcoming deadlines</strong>
                  <p>
                    Deadlines detected from your memories will appear here.
                  </p>
                </div>
              ) : (
                <div className="deadlineList">
                  {upcomingDeadlines.map((memory) => (
                    <Link
                      key={memory.id}
                      href={`/memories/${memory.id}`}
                      className="deadlineItem"
                    >
                      <div>
                        <strong>{memory.title}</strong>
                        <span>
                          {new Date(
                            memory.deadline!
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      <span>→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="miniStats">
              <div>
                <span>Memories</span>
                <strong>{memories.length}</strong>
              </div>

              <div>
                <span>Captured today</span>
                <strong>{capturedToday}</strong>
              </div>

              <div>
                <span>Reminders</span>
                <strong>{reminders.length}</strong>
              </div>
            </div>
          </div>
        </section>
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 80% 0%,
              rgba(99, 102, 241, 0.09),
              transparent 30%
            ),
            #f7f8fc;
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
          z-index: 20;
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
          background: #eef0ff;
          color: #4f46e5;
        }

        .content {
          margin-left: 82px;
          padding: 55px 6%;
          max-width: 1500px;
        }

        header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #73798a;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        h1 {
          margin: 0;
          font-size: clamp(32px, 4vw, 50px);
          letter-spacing: -0.04em;
        }

        .subtitle {
          margin: 12px 0 0;
          color: #73798a;
        }

        .captureButton {
          padding: 13px 18px;
          border-radius: 12px;
          background: #171923;
          color: white;
          text-decoration: none;
          font-weight: 700;
          white-space: nowrap;
        }

        .memorySearch {
          margin-top: 38px;
          min-height: 105px;
          background: #171923;
          border-radius: 24px;
          padding: 24px 27px;
          color: white;
          display: flex;
          align-items: center;
          gap: 18px;
          box-shadow: 0 20px 50px rgba(23, 25, 35, 0.13);
        }

        .searchIcon {
          width: 48px;
          height: 48px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.1);
          display: grid;
          place-items: center;
          font-size: 25px;
          flex-shrink: 0;
        }

        .searchContent {
          flex: 1;
        }

        .searchContent p {
          margin: 0 0 6px;
          font-size: 12px;
          color: #bfc3cf;
        }

        .searchContent input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: white;
          font-size: 19px;
        }

        .searchContent input::placeholder {
          color: #858997;
        }

        .clearButton {
          border: 0;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
        }

        .searchResults {
          margin-top: 24px;
          background: white;
          border: 1px solid #e7e9f0;
          border-radius: 22px;
          padding: 22px;
        }

        .sectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
        }

        .sectionHeader h2 {
          margin: 0;
          font-size: 21px;
          letter-spacing: -0.02em;
        }

        .sectionHeader a {
          color: #4f46e5;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
        }

        .resultList {
          margin-top: 17px;
          display: grid;
          gap: 9px;
        }

        .resultCard {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px;
          border: 1px solid #eceef3;
          border-radius: 14px;
          text-decoration: none;
          color: #171923;
          transition: 0.2s;
        }

        .resultCard:hover {
          border-color: #cdd0ff;
          background: #fafaff;
        }

        .resultIcon {
          width: 43px;
          height: 43px;
          border-radius: 12px;
          background: #f0f1ff;
          color: #4f46e5;
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .resultInfo {
          flex: 1;
          min-width: 0;
        }

        .resultInfo strong {
          display: block;
          font-size: 14px;
        }

        .resultInfo p {
          margin: 4px 0;
          color: #777d8c;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .resultInfo div {
          display: flex;
          gap: 12px;
          color: #999eab;
          font-size: 10px;
        }

        .arrow {
          color: #9ba0ad;
        }

        .noResults {
          margin-top: 16px;
          padding: 18px;
          border-radius: 14px;
          background: #f8f8fb;
          display: flex;
          gap: 13px;
          align-items: center;
        }

        .noResults > span {
          font-size: 25px;
          color: #818cf8;
        }

        .noResults strong {
          font-size: 13px;
        }

        .noResults p {
          margin: 4px 0 0;
          color: #858b9b;
          font-size: 12px;
        }

        .quickCapture {
          margin-top: 32px;
        }

        .captureOptions {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 13px;
        }

        .captureOption {
          padding: 18px;
          background: white;
          border: 1px solid #e7e9f0;
          border-radius: 18px;
          text-decoration: none;
          color: #171923;
          transition: 0.2s;
        }

        .captureOption:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(20, 25, 45, 0.06);
        }

        .captureOption > div {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: #f0f1ff;
          color: #4f46e5;
          display: grid;
          place-items: center;
          margin-bottom: 12px;
        }

        .captureOption strong {
          display: block;
          font-size: 14px;
        }

        .captureOption span {
          display: block;
          margin-top: 5px;
          color: #858b9b;
          font-size: 11px;
          line-height: 1.4;
        }

        .dashboardGrid {
          margin-top: 32px;
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 18px;
        }

        .panel {
          background: white;
          border: 1px solid #e7e9f0;
          border-radius: 21px;
          padding: 21px;
        }

        .recentList {
          margin-top: 17px;
        }

        .recentItem {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 4px;
          border-bottom: 1px solid #f0f1f4;
          text-decoration: none;
          color: #171923;
        }

        .recentItem:last-child {
          border-bottom: 0;
        }

        .recentDot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #818cf8;
          flex-shrink: 0;
        }

        .recentItem div {
          flex: 1;
          min-width: 0;
        }

        .recentItem strong {
          display: block;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .recentItem p {
          margin: 4px 0 0;
          color: #999eaa;
          font-size: 10px;
        }

        .recentItem > span {
          color: #a1a5b0;
        }

        .sidePanels {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .deadlineList {
          margin-top: 17px;
        }

        .deadlineItem {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 13px 0;
          border-bottom: 1px solid #f0f1f4;
          text-decoration: none;
          color: #171923;
        }

        .deadlineItem:last-child {
          border-bottom: 0;
        }

        .deadlineItem strong {
          display: block;
          font-size: 12px;
        }

        .deadlineItem div span {
          display: block;
          margin-top: 4px;
          color: #4f46e5;
          font-size: 10px;
        }

        .emptySmall {
          margin-top: 16px;
          padding: 18px;
          background: #f8f8fb;
          border-radius: 14px;
          color: #777d8c;
          font-size: 12px;
        }

        .emptySmall strong {
          color: #303442;
        }

        .emptySmall p {
          margin: 5px 0 0;
        }

        .miniStats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 9px;
        }

        .miniStats div {
          background: white;
          border: 1px solid #e7e9f0;
          border-radius: 15px;
          padding: 15px;
        }

        .miniStats span {
          display: block;
          color: #858b9b;
          font-size: 9px;
        }

        .miniStats strong {
          display: block;
          margin-top: 7px;
          font-size: 22px;
        }

        @media (max-width: 950px) {
          .dashboardGrid {
            grid-template-columns: 1fr;
          }

          .sidePanels {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 700px) {
          .sidebar {
            width: 65px;
          }

          .content {
            margin-left: 65px;
            padding: 35px 18px;
          }

          header {
            flex-direction: column;
            align-items: flex-start;
          }

          .captureOptions {
            grid-template-columns: 1fr;
          }

          .sidePanels {
            grid-template-columns: 1fr;
          }

          .memorySearch {
            padding: 19px;
          }

          .searchContent input {
            font-size: 15px;
          }
        }
      `}</style>
    </main>
  );
}