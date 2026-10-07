"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";
import Sidebar from "../../components/sidebar";

type Memory = {
id: string;
title: string;
summary: string | null;
category: string | null;
source_type: string;
created_at: string;
deadline: string | null;
is_favorite: boolean;
};

export default function TimelinePage() {
const router = useRouter();
const supabase = createClient();

const [memories, setMemories] = useState<Memory[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
loadTimeline();
}, []);

async function loadTimeline() {
setLoading(true);


const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  router.replace("/login");
  return;
}

const { data, error } = await supabase
  .from("memories")
  .select(
    "id,title,summary,category,source_type,created_at,deadline,is_favorite"
  )
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

if (!error && data) {
  setMemories(data);
}

setLoading(false);


}

function formatDate(date: string) {
return new Date(date).toLocaleDateString("en-IN", {
day: "numeric",
month: "short",
year: "numeric",
});
}

function formatTime(date: string) {
return new Date(date).toLocaleTimeString("en-IN", {
hour: "numeric",
minute: "2-digit",
});
}

function groupDate(date: string) {
const d = new Date(date);
const now = new Date();


const today = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate()
);

const itemDate = new Date(
  d.getFullYear(),
  d.getMonth(),
  d.getDate()
);

const difference =
  (today.getTime() - itemDate.getTime()) /
  (1000 * 60 * 60 * 24);

if (difference === 0) return "Today";
if (difference === 1) return "Yesterday";
if (difference <= 7) return "This Week";
return "Earlier";

}

const groups = ["Today", "Yesterday", "This Week", "Earlier"];

return ( <div className="tm-timeline-page"> <Sidebar />


  <main className="tm-timeline-content">
    <div className="tm-timeline-inner">

      {/* TOP BAR */}
      <header className="tm-topbar">
        <div>
          <p className="tm-eyebrow">PERSONAL MEMORY</p>
          <h1>Timeline</h1>
        </div>

        <button
          type="button"
          className="tm-capture-button"
          onClick={() => router.push("/capture")}
        >
          <span>＋</span>
          Capture memory
        </button>
      </header>

      {/* HERO */}
      <section className="tm-hero">
        <div className="tm-hero-copy">
          <p className="tm-hero-label">MEMORY JOURNEY</p>

          <h2>
            Everything you&apos;ve saved.
            <br />
            <span>In one timeline.</span>
          </h2>

          <p className="tm-hero-description">
            Trace your memories from the moment you captured them.
            Browse what you saved today, this week, or further back.
          </p>
        </div>

        <div className="tm-orbit">
          <div className="tm-orbit-ring tm-ring-one" />
          <div className="tm-orbit-ring tm-ring-two" />
          <div className="tm-orbit-ring tm-ring-three" />

          <div className="tm-orbit-core">T</div>

          <div className="tm-orbit-node tm-node-one">
            <span>PDF</span>
          </div>

          <div className="tm-orbit-node tm-node-two">
            <span>LINK</span>
          </div>

          <div className="tm-orbit-node tm-node-three">
            <span>NOTE</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="tm-stats">
        <div className="tm-stat-card">
          <span>Total memories</span>
          <strong>{memories.length}</strong>
        </div>

        <div className="tm-stat-card">
          <span>Captured today</span>
          <strong>
            {
              memories.filter(
                (memory) => groupDate(memory.created_at) === "Today"
              ).length
            }
          </strong>
        </div>

        <div className="tm-stat-card">
          <span>Favorites</span>
          <strong>
            {memories.filter((memory) => memory.is_favorite).length}
          </strong>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="tm-timeline-section">
        <div className="tm-section-heading">
          <div>
            <p>YOUR HISTORY</p>
            <h2>Memory timeline</h2>
          </div>

          <span>{memories.length} memories</span>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="tm-state-card">
            <div className="tm-spinner" />
            <h3>Loading your timeline</h3>
            <p>Your memories are being arranged by time.</p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && memories.length === 0 && (
          <div className="tm-empty-card">
            <div className="tm-empty-icon">◷</div>

            <p className="tm-empty-label">NO MEMORIES YET</p>

            <h3>Your timeline is waiting.</h3>

            <p>
              Start capturing information and your memory journey
              will appear here automatically.
            </p>

            <button
              type="button"
              onClick={() => router.push("/capture")}
            >
              ＋ Capture your first memory
            </button>
          </div>
        )}

        {/* GROUPED TIMELINE */}
        {!loading && memories.length > 0 && (
          <div className="tm-groups">
            {groups.map((group) => {
              const groupMemories = memories.filter(
                (memory) =>
                  groupDate(memory.created_at) === group
              );

              if (groupMemories.length === 0) return null;

              return (
                <section
                  key={group}
                  className="tm-timeline-group"
                >
                  <div className="tm-group-heading">
                    <h3>{group}</h3>
                    <div />
                    <span>{groupMemories.length}</span>
                  </div>

                  <div className="tm-timeline-list">
                    {groupMemories.map((memory) => (
                      <button
                        key={memory.id}
                        type="button"
                        className="tm-memory-row"
                        onClick={() =>
                          router.push(
                            `/memories/${memory.id}`
                          )
                        }
                      >
                        <div className="tm-timeline-line">
                          <div className="tm-timeline-dot" />
                        </div>

                        <div className="tm-memory-card">
                          <div className="tm-memory-main">
                            <div className="tm-memory-meta">
                              {memory.category && (
                                <span className="tm-category">
                                  {memory.category}
                                </span>
                              )}

                              <span className="tm-source">
                                {memory.source_type}
                              </span>

                              {memory.is_favorite && (
                                <span className="tm-favorite">
                                  ★
                                </span>
                              )}
                            </div>

                            <h4>{memory.title}</h4>

                            {memory.summary && (
                              <p>{memory.summary}</p>
                            )}

                            {memory.deadline && (
                              <div className="tm-deadline">
                                Deadline ·{" "}
                                {formatDate(memory.deadline)}
                              </div>
                            )}
                          </div>

                          <div className="tm-memory-time">
                            <strong>
                              {formatDate(memory.created_at)}
                            </strong>

                            <span>
                              {formatTime(memory.created_at)}
                            </span>
                          </div>

                          <div className="tm-arrow">→</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </div>
  </main>

  <style jsx global>{`
    .tm-timeline-page {
      min-height: 100vh;
      background: #f7f8fa;
      color: #17191e;
    }

    .tm-timeline-content {
      min-height: 100vh;
      margin-left: 238px;
    }

    .tm-timeline-inner {
      width: 100%;
      max-width: 1180px;
      margin: 0 auto;
      padding: 30px 42px 70px;
      box-sizing: border-box;
    }

    .tm-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 28px;
    }

    .tm-eyebrow {
      margin: 0 0 6px;
      color: #a1a4aa;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.6px;
    }

    .tm-topbar h1 {
      margin: 0;
      font-size: 29px;
      line-height: 1;
      letter-spacing: -1px;
      font-weight: 760;
    }

    .tm-capture-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 0;
      border-radius: 10px;
      padding: 11px 16px;
      background: #17191e;
      color: #fff;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: transform .18s ease, background .18s ease;
    }

    .tm-capture-button:hover {
      background: #292c32;
      transform: translateY(-1px);
    }

    .tm-capture-button span {
      font-size: 16px;
      line-height: 1;
    }

    /* HERO */

    .tm-hero {
      position: relative;
      min-height: 285px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 30px;
      padding: 42px 48px;
      border-radius: 20px;
      background: #17191e;
      box-sizing: border-box;
    }

    .tm-hero-copy {
      position: relative;
      z-index: 2;
      max-width: 650px;
    }

    .tm-hero-label {
      margin: 0 0 18px;
      color: #9da1a9;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.7px;
    }

    .tm-hero h2 {
      margin: 0;
      color: #fff;
      font-size: clamp(34px, 4vw, 53px);
      line-height: .98;
      letter-spacing: -2.7px;
      font-weight: 760;
    }

    .tm-hero h2 span {
      color: #777b83;
    }

    .tm-hero-description {
      max-width: 560px;
      margin: 22px 0 0;
      color: #9da1a9;
      font-size: 13px;
      line-height: 1.8;
    }

    .tm-orbit {
      position: absolute;
      right: 40px;
      top: 50%;
      width: 275px;
      height: 275px;
      transform: translateY(-50%);
    }

    .tm-orbit-ring {
      position: absolute;
      inset: 50%;
      border: 1px solid rgba(255,255,255,.10);
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }

    .tm-ring-one {
      width: 150px;
      height: 150px;
    }

    .tm-ring-two {
      width: 215px;
      height: 215px;
    }

    .tm-ring-three {
      width: 275px;
      height: 275px;
      border-color: rgba(255,255,255,.07);
    }

    .tm-orbit-core {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 58px;
      height: 58px;
      transform: translate(-50%, -50%);
      display: grid;
      place-items: center;
      border-radius: 18px;
      background: #fff;
      color: #17191e;
      font-size: 21px;
      font-weight: 850;
      box-shadow: 0 15px 40px rgba(0,0,0,.25);
    }

    .tm-orbit-node {
      position: absolute;
      display: grid;
      place-items: center;
      width: 43px;
      height: 43px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 50%;
      background: #202329;
      color: #b7bac0;
      font-size: 7px;
      font-weight: 800;
      letter-spacing: .8px;
    }

    .tm-node-one {
      top: 18px;
      left: 115px;
    }

    .tm-node-two {
      right: 9px;
      bottom: 66px;
    }

    .tm-node-three {
      left: 15px;
      bottom: 45px;
    }

    /* STATS */

    .tm-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 12px;
    }

    .tm-stat-card {
      min-height: 92px;
      padding: 18px 20px;
      border: 1px solid #e5e6e9;
      border-radius: 14px;
      background: #fff;
      box-sizing: border-box;
    }

    .tm-stat-card span {
      display: block;
      color: #9a9da4;
      font-size: 10px;
      font-weight: 750;
      letter-spacing: 1.1px;
      text-transform: uppercase;
    }

    .tm-stat-card strong {
      display: block;
      margin-top: 8px;
      color: #17191e;
      font-size: 25px;
      line-height: 1;
      letter-spacing: -.7px;
    }

    /* SECTION */

    .tm-timeline-section {
      margin-top: 48px;
    }

    .tm-section-heading {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 22px;
    }

    .tm-section-heading p {
      margin: 0 0 5px;
      color: #a1a4aa;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.5px;
    }

    .tm-section-heading h2 {
      margin: 0;
      font-size: 22px;
      line-height: 1.1;
      letter-spacing: -.6px;
    }

    .tm-section-heading > span {
      color: #999ca3;
      font-size: 11px;
    }

    /* LOADING */

    .tm-state-card {
      padding: 55px 25px;
      border: 1px solid #e5e6e9;
      border-radius: 17px;
      background: #fff;
      text-align: center;
    }

    .tm-spinner {
      width: 28px;
      height: 28px;
      margin: 0 auto 16px;
      border: 2px solid #e4e5e8;
      border-top-color: #17191e;
      border-radius: 50%;
      animation: tm-spin .8s linear infinite;
    }

    @keyframes tm-spin {
      to {
        transform: rotate(360deg);
      }
    }

    .tm-state-card h3 {
      margin: 0;
      font-size: 15px;
    }

    .tm-state-card p {
      margin: 7px 0 0;
      color: #999ca3;
      font-size: 12px;
    }

    /* EMPTY */

    .tm-empty-card {
      padding: 70px 25px;
      border: 1px dashed #d9dade;
      border-radius: 18px;
      background: #fff;
      text-align: center;
    }

    .tm-empty-icon {
      width: 58px;
      height: 58px;
      margin: 0 auto 20px;
      display: grid;
      place-items: center;
      border-radius: 16px;
      background: #f0f1f3;
      color: #555960;
      font-size: 25px;
    }

    .tm-empty-label {
      margin: 0 0 8px;
      color: #a1a4aa;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.5px;
    }

    .tm-empty-card h3 {
      margin: 0;
      font-size: 23px;
      letter-spacing: -.6px;
    }

    .tm-empty-card > p:not(.tm-empty-label) {
      max-width: 440px;
      margin: 10px auto 0;
      color: #858990;
      font-size: 13px;
      line-height: 1.7;
    }

    .tm-empty-card button {
      margin-top: 22px;
      padding: 11px 17px;
      border: 0;
      border-radius: 10px;
      background: #17191e;
      color: #fff;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    /* GROUPS */

    .tm-groups {
      display: flex;
      flex-direction: column;
      gap: 42px;
    }

    .tm-group-heading {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }

    .tm-group-heading h3 {
      margin: 0;
      color: #686c74;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .tm-group-heading div {
      height: 1px;
      flex: 1;
      background: #e4e5e8;
    }

    .tm-group-heading span {
      color: #a1a4aa;
      font-size: 10px;
    }

    /* TIMELINE */

    .tm-timeline-list {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-left: 27px;
    }

    .tm-timeline-list::before {
      content: "";
      position: absolute;
      left: 6px;
      top: 17px;
      bottom: 17px;
      width: 1px;
      background: #dfe1e5;
    }

    .tm-memory-row {
      position: relative;
      width: 100%;
      padding: 0;
      border: 0;
      background: transparent;
      text-align: left;
      font-family: inherit;
      cursor: pointer;
    }

    .tm-timeline-line {
      position: absolute;
      left: -27px;
      top: 23px;
      width: 13px;
      height: 13px;
      display: grid;
      place-items: center;
      z-index: 2;
    }

    .tm-timeline-dot {
      width: 9px;
      height: 9px;
      border: 3px solid #f7f8fa;
      border-radius: 50%;
      background: #17191e;
      box-sizing: content-box;
    }

    .tm-memory-card {
      min-height: 92px;
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 18px 20px;
      border: 1px solid #e5e6e9;
      border-radius: 14px;
      background: #fff;
      box-sizing: border-box;
      transition:
        border-color .18s ease,
        box-shadow .18s ease,
        transform .18s ease;
    }

    .tm-memory-row:hover .tm-memory-card {
      border-color: #d5d7db;
      box-shadow: 0 8px 24px rgba(23,25,30,.06);
      transform: translateY(-1px);
    }

    .tm-memory-main {
      min-width: 0;
      flex: 1;
    }

    .tm-memory-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 7px;
    }

    .tm-category,
    .tm-source {
      display: inline-flex;
      align-items: center;
      min-height: 20px;
      padding: 0 8px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 750;
      letter-spacing: .3px;
    }

    .tm-category {
      background: #eef0f2;
      color: #555960;
    }

    .tm-source {
      background: #f5f5f6;
      color: #8a8d94;
    }

    .tm-favorite {
      color: #17191e;
      font-size: 12px;
    }

    .tm-memory-main h4 {
      margin: 0;
      color: #17191e;
      font-size: 15px;
      line-height: 1.35;
      font-weight: 720;
      letter-spacing: -.2px;
    }

    .tm-memory-main > p {
      display: -webkit-box;
      overflow: hidden;
      margin: 5px 0 0;
      color: #888b92;
      font-size: 12px;
      line-height: 1.6;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .tm-deadline {
      margin-top: 9px;
      color: #a36f24;
      font-size: 10px;
      font-weight: 650;
    }

    .tm-memory-time {
      flex: 0 0 95px;
      text-align: right;
    }

    .tm-memory-time strong,
    .tm-memory-time span {
      display: block;
    }

    .tm-memory-time strong {
      color: #666a72;
      font-size: 10px;
      font-weight: 700;
    }

    .tm-memory-time span {
      margin-top: 4px;
      color: #aaaeb5;
      font-size: 10px;
    }

    .tm-arrow {
      flex: 0 0 auto;
      color: #b0b3b9;
      font-size: 17px;
      transition: transform .18s ease, color .18s ease;
    }

    .tm-memory-row:hover .tm-arrow {
      color: #17191e;
      transform: translateX(3px);
    }

    /* RESPONSIVE */

    @media (max-width: 900px) {
      .tm-timeline-content {
        margin-left: 76px;
      }

      .tm-timeline-inner {
        padding: 28px 28px 60px;
      }

      .tm-orbit {
        right: 15px;
        opacity: .45;
      }

      .tm-hero-copy {
        max-width: 560px;
      }
    }

    @media (max-width: 700px) {
      .tm-timeline-inner {
        padding: 24px 18px 50px;
      }

      .tm-topbar {
        align-items: flex-start;
      }

      .tm-topbar h1 {
        font-size: 25px;
      }

      .tm-capture-button {
        padding: 10px 12px;
      }

      .tm-capture-button span {
        display: none;
      }

      .tm-hero {
        min-height: 270px;
        padding: 30px 25px;
      }

      .tm-hero h2 {
        font-size: 36px;
        letter-spacing: -1.8px;
      }

      .tm-orbit {
        display: none;
      }

      .tm-stats {
        gap: 8px;
      }

      .tm-stat-card {
        min-height: 82px;
        padding: 15px;
      }

      .tm-stat-card strong {
        font-size: 21px;
      }

      .tm-memory-card {
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 10px;
      }

      .tm-memory-time {
        flex: 1;
        order: 3;
        text-align: left;
        padding-top: 8px;
        border-top: 1px solid #f0f0f1;
      }

      .tm-arrow {
        margin-left: auto;
      }
    }

    @media (max-width: 500px) {
      .tm-timeline-content {
        margin-left: 68px;
      }

      .tm-timeline-inner {
        padding: 22px 15px 45px;
      }

      .tm-topbar {
        margin-bottom: 20px;
      }

      .tm-topbar h1 {
        font-size: 23px;
      }

      .tm-capture-button {
        font-size: 11px;
        padding: 9px 10px;
      }

      .tm-hero {
        border-radius: 16px;
        padding: 27px 22px;
      }

      .tm-hero h2 {
        font-size: 31px;
      }

      .tm-hero-description {
        font-size: 12px;
      }

      .tm-stats {
        grid-template-columns: 1fr;
      }

      .tm-stat-card {
        min-height: auto;
        padding: 15px 17px;
      }

      .tm-section-heading {
        align-items: flex-start;
      }

      .tm-memory-card {
        padding: 16px;
      }

      .tm-memory-main h4 {
        font-size: 14px;
      }

      .tm-memory-time {
        flex-basis: 100%;
      }
    }
  `}</style>
</div>


);
}
