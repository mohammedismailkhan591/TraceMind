import Link from "next/link";
import { createClient } from "../../../lib/supabase-server";

function dateTime(value: string | null | undefined) {
  if (!value) return "Not set";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function dateOnly(value: string | null | undefined) {
  if (!value) return "No deadline added";

  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, {
        dateStyle: "long",
      });
}

function sourceLabel(value: string | null | undefined) {
  if (!value) return "Saved item";

  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (c) =>
    c.toUpperCase()
  );
}

export default async function MemoryDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Use the server-side Supabase client.
  const supabase = await createClient();

  // Verify the authenticated user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error(
      "Memory Details authentication error:",
      authError.message
    );
  }

  // Show the login message only when no authenticated user is available.
  if (!user) {
    return (
      <div className="memory-detail-page">
        <div className="detail-empty">
          <span className="eyebrow">TRACEMIND ACCOUNT</span>

          <h1>Your session has expired</h1>

          <p>
            Log in again to view this memory and its history.
          </p>

          <Link href="/login" className="tm-primary">
            Log in
          </Link>
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  // Retrieve only a memory belonging to the authenticated user.
  const { data: memory, error } = await supabase
    .from("memories")
    .select(
      "id,title,summary,content,category,source_type,source_url,deadline,is_favorite,created_at,updated_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !memory) {
    if (error) {
      console.error("Memory Details query error:", error.message);
    }

    return (
      <div className="memory-detail-page">
        <Link href="/memories" className="tm-back">
          ← All memories
        </Link>

        <div className="detail-empty">
          <div className="empty-icon">?</div>

          <h1>Memory not found</h1>

          <p>
            This item may have been removed, or you may not have
            access to it.
          </p>

          <Link href="/memories" className="tm-primary">
            Back to memories
          </Link>
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  // Build the navigation timeline from saved memory information.
  const timeline = [
    {
      key: "created",
      title: "Memory captured",
      detail: `Saved to TraceMind as ${sourceLabel(
        memory.source_type
      ).toLowerCase()}.`,
      date: memory.created_at,
      icon: "＋",
      tone: "blue",
    },

    ...(memory.source_url
      ? [
          {
            key: "source",
            title: "Original source attached",
            detail: memory.source_url,
            date: memory.created_at,
            icon: "↗",
            tone: "violet",
          },
        ]
      : []),

    ...(memory.deadline
      ? [
          {
            key: "deadline",
            title: "Deadline recorded",
            detail: `Target date: ${dateOnly(memory.deadline)}.`,
            date: memory.deadline,
            icon: "◷",
            tone: "amber",
          },
        ]
      : []),

    ...(memory.updated_at &&
    memory.updated_at !== memory.created_at
      ? [
          {
            key: "updated",
            title: "Memory last updated",
            detail: "The saved record was updated.",
            date: memory.updated_at,
            icon: "↻",
            tone: "green",
          },
        ]
      : []),
  ].sort(
    (a, b) =>
      new Date(a.date || 0).getTime() -
      new Date(b.date || 0).getTime()
  );

  return (
    <div className="memory-detail-page">
      <div className="detail-topbar">
        <Link href="/memories" className="tm-back">
          ← Memories
        </Link>

        <div className="top-actions">
          <Link href="/timeline" className="tm-quiet">
            Open full timeline ↗
          </Link>

          <Link href="/capture" className="tm-primary small">
            ＋ Capture another
          </Link>
        </div>
      </div>

      <header className="memory-hero">
        <div className="hero-copy">
          <div className="hero-badges">
            <span
              className={`source-pill ${String(
                memory.source_type || "other"
              )
                .toLowerCase()
                .replace(/[^a-z0-9_-]/g, "-")}`}
            >
              {sourceLabel(memory.source_type)}
            </span>

            <span className="category-pill">
              {memory.category || "Uncategorized"}
            </span>

            {memory.is_favorite && (
              <span className="important-pill">
                ★ Important
              </span>
            )}
          </div>

          <h1>{memory.title}</h1>

          <p className="hero-summary">
            {memory.summary ||
              "Your saved memory, organized in one place. Add a summary later or use AI capture when enabled."}
          </p>

          <div className="hero-meta">
            <span>
              ⌁ Saved {dateTime(memory.created_at)}
            </span>

            <span>•</span>

            <span>
              Memory ID{" "}
              <code>{String(memory.id).slice(0, 8)}</code>
            </span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-core">T</div>
          <span className="art-dot dot-one" />
          <span className="art-dot dot-two" />
          <span className="art-dot dot-three" />
        </div>
      </header>

      <div className="detail-layout">
        <main className="detail-main">
          <section className="detail-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">MEMORY CONTEXT</span>
                <h2>Everything in this memory</h2>
              </div>

              <span className="section-count">01</span>
            </div>

            {memory.summary && (
              <div className="summary-block">
                <span className="mini-label">
                  QUICK SUMMARY
                </span>

                <p>{memory.summary}</p>
              </div>
            )}

            <div className="content-block">
              <span className="mini-label">
                CAPTURED INFORMATION
              </span>

              {memory.content ? (
                <p className="memory-content">
                  {memory.content}
                </p>
              ) : (
                <div className="missing-content">
                  <span>✦</span>

                  <div>
                    <strong>
                      No text content stored yet
                    </strong>

                    <p>
                      This memory may contain only a source
                      reference or attachment. You can still see
                      its capture details below.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="detail-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  NAVIGATION TIMELINE
                </span>

                <h2>How this memory came together</h2>

                <p className="section-subtitle">
                  A chronological trail of the dates and source
                  details currently recorded for this memory.
                </p>
              </div>

              <span className="timeline-count">
                {timeline.length}{" "}
                {timeline.length === 1 ? "event" : "events"}
              </span>
            </div>

            <div className="memory-timeline">
              {timeline.map((event) => (
                <article
                  className="timeline-event"
                  key={event.key}
                >
                  <div
                    className={`timeline-marker ${event.tone}`}
                  >
                    {event.icon}
                  </div>

                  <div className="timeline-event-body">
                    <div className="event-heading">
                      <h3>{event.title}</h3>

                      <time>{dateTime(event.date)}</time>
                    </div>

                    <p>{event.detail}</p>
                  </div>
                </article>
              ))}
            </div>

            <p className="timeline-note">
              TraceMind only shows events supported by the saved
              record. A complete activity history can be added
              later as its own database feature.
            </p>
          </section>
        </main>

        <aside className="detail-aside">
          <section className="detail-panel">
            <div className="aside-title">
              <span className="aside-icon">✧</span>

              <div>
                <span className="eyebrow">AT A GLANCE</span>
                <h2>Memory facts</h2>
              </div>
            </div>

            <dl className="fact-list">
              <div>
                <dt>Category</dt>
                <dd>
                  {memory.category || "Uncategorized"}
                </dd>
              </div>

              <div>
                <dt>Captured via</dt>
                <dd>{sourceLabel(memory.source_type)}</dd>
              </div>

              <div>
                <dt>First saved</dt>
                <dd>{dateTime(memory.created_at)}</dd>
              </div>

              <div>
                <dt>Last updated</dt>
                <dd>
                  {dateTime(
                    memory.updated_at || memory.created_at
                  )}
                </dd>
              </div>

              <div>
                <dt>Deadline</dt>
                <dd
                  className={
                    memory.deadline ? "deadline-value" : ""
                  }
                >
                  {dateOnly(memory.deadline)}
                </dd>
              </div>

              <div>
                <dt>Importance</dt>
                <dd>
                  {memory.is_favorite
                    ? "Marked important"
                    : "Standard memory"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="detail-panel source-panel">
            <div className="aside-title">
              <span className="aside-icon violet">↗</span>

              <div>
                <span className="eyebrow">ORIGIN</span>
                <h2>Where it came from</h2>
              </div>
            </div>

            {memory.source_url ? (
              <>
                <p className="source-url">
                  {memory.source_url}
                </p>

                <a
                  className="source-open"
                  href={memory.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open original source <span>↗</span>
                </a>
              </>
            ) : (
              <div className="no-source">
                <strong>No external link</strong>

                <p>
                  This memory was saved without a website URL.
                </p>
              </div>
            )}
          </section>

          {memory.deadline && (
            <section className="deadline-callout">
              <div className="deadline-symbol">◷</div>

              <div>
                <span className="eyebrow">
                  IMPORTANT DATE
                </span>

                <h3>Deadline</h3>

                <p>{dateOnly(memory.deadline)}</p>

                <Link href="/reminders">
                  Review reminders →
                </Link>
              </div>
            </section>
          )}

          <Link href="/capture" className="add-context">
            <span>＋</span>

            <div>
              <strong>Capture more context</strong>

              <p>
                Save another note, file, or link to TraceMind.
              </p>
            </div>

            <b>→</b>
          </Link>
        </aside>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.memory-detail-page{max-width:1440px;margin:0 auto;padding:30px clamp(18px,3.2vw,48px) 70px;color:#172b4d}.detail-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}.tm-back,.tm-quiet{font-size:12px;font-weight:700;color:#6c7d97;text-decoration:none}.tm-back:hover,.tm-quiet:hover{color:#315fe0}.top-actions{display:flex;align-items:center;gap:14px}.tm-primary{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:11px;background:linear-gradient(115deg,#3478f6,#6654e9);color:white;text-decoration:none;font-size:12px;font-weight:750;box-shadow:0 8px 18px #406bf51c}.tm-primary.small{min-height:36px;padding:0 12px;font-size:11px}.memory-hero{position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:center;gap:24px;padding:clamp(24px,4vw,42px);border:1px solid #e1e9fa;border-radius:24px;background:radial-gradient(circle at 86% 10%,#e7eaff 0,transparent 32%),linear-gradient(115deg,#fff 0%,#f8faff 65%,#f5f3ff 100%);box-shadow:0 14px 42px #243c6710}.hero-copy{max-width:760px;min-width:0;position:relative;z-index:1}.hero-badges{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:15px}.source-pill,.category-pill,.important-pill{display:inline-flex;align-items:center;padding:6px 10px;border-radius:8px;font-size:10px;font-weight:800}.source-pill{background:#eaf1ff;color:#3564d7}.source-pill.pdf{background:#fff0f0;color:#bf3f4e}.source-pill.screenshot,.source-pill.image{background:#f1eaff;color:#7847c5}.source-pill.text{background:#e7faf2;color:#17825b}.source-pill.voice{background:#fff1e5;color:#b65b19}.source-pill.link,.source-pill.website{background:#eaf5ff;color:#176da9}.category-pill{background:#f0f3f9;color:#60718a}.important-pill{background:#fff7df;color:#98640b}.memory-hero h1{font-size:clamp(28px,3.5vw,43px);line-height:1.1;letter-spacing:-1.5px;color:#14284a;overflow-wrap:anywhere}.hero-summary{max-width:690px;margin-top:14px;color:#60718b;font-size:14px;line-height:1.8}.hero-meta{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:22px;color:#8997ad;font-size:10px}.hero-meta code{font-size:10px;color:#5b6e8a;background:#edf2fb;padding:3px 5px;border-radius:5px}.hero-art{width:160px;height:160px;flex:0 0 160px;position:relative;display:grid;place-items:center}.art-orbit{position:absolute;border:1px solid #c8d4fb;border-radius:50%;transform:rotate(-24deg)}.orbit-one{width:145px;height:82px}.orbit-two{width:112px;height:150px;transform:rotate(35deg)}.art-core{width:66px;height:66px;border-radius:23px;background:linear-gradient(145deg,#427af7,#7456e8);display:grid;place-items:center;color:white;font-size:28px;font-weight:900;box-shadow:0 14px 32px #596ee64a}.art-dot{position:absolute;width:10px;height:10px;border-radius:50%;background:#6d64e9;box-shadow:0 0 0 5px #e7e8ff}.dot-one{top:22px;right:28px}.dot-two{bottom:25px;left:17px;background:#3d8df2}.dot-three{right:5px;bottom:53px;width:7px;height:7px;background:#b59af8}.detail-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(280px,.8fr);align-items:start;gap:20px;margin-top:22px}.detail-main,.detail-aside{display:grid;gap:20px;min-width:0}.detail-panel{min-width:0;background:#fff;border:1px solid #e3eaf5;border-radius:19px;padding:clamp(19px,2.4vw,28px);box-shadow:0 8px 28px #263c6410}.section-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:23px}.eyebrow{display:block;color:#8796ae;font-size:9px;font-weight:850;letter-spacing:1.5px}.section-heading h2,.aside-title h2{margin-top:7px;font-size:18px;letter-spacing:-.45px;color:#1a2e50}.section-count{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:#f0f4ff;color:#4770dc;font-size:11px;font-weight:850}.section-subtitle{margin-top:8px;color:#8290a6;font-size:11px;line-height:1.6}.summary-block{padding:15px 16px;margin-bottom:17px;border-radius:13px;background:linear-gradient(110deg,#f0f5ff,#f8f7ff);border:1px solid #e7edff}.mini-label{display:block;color:#8a99b1;font-size:9px;font-weight:850;letter-spacing:1.2px;margin-bottom:9px}.summary-block p{font-size:13px;line-height:1.8;color:#4c6281}.content-block{padding-top:3px}.memory-content{white-space:pre-wrap;overflow-wrap:anywhere;color:#4d607c;font-size:13px;line-height:1.9}.missing-content{display:flex;align-items:flex-start;gap:12px;padding:16px;border:1px dashed #dbe5f4;border-radius:12px;background:#fbfcff}.missing-content>span{width:31px;height:31px;display:grid;place-items:center;border-radius:10px;background:#eef2ff;color:#6265d8}.missing-content strong{font-size:12px;color:#425773}.missing-content p{margin-top:5px;font-size:11px;line-height:1.7;color:#8996aa}.timeline-count{white-space:nowrap;padding:7px 9px;background:#f2f5fb;border-radius:8px;color:#72829b;font-size:10px;font-weight:750}.memory-timeline{position:relative;margin-left:7px}.memory-timeline:before{content:"";position:absolute;left:15px;top:17px;bottom:18px;width:1px;background:linear-gradient(#cbd8ff,#e4eaf5)}.timeline-event{position:relative;display:grid;grid-template-columns:32px minmax(0,1fr);gap:13px;padding:0 0 23px}.timeline-event:last-child{padding-bottom:0}.timeline-marker{position:relative;z-index:1;width:31px;height:31px;display:grid;place-items:center;border:3px solid #fff;border-radius:11px;background:#eaf1ff;color:#4169df;font-size:15px;box-shadow:0 0 0 1px #e1e8f6}.timeline-marker.violet{background:#f0eaff;color:#7958cf}.timeline-marker.amber{background:#fff3d9;color:#b87a17}.timeline-marker.green{background:#e5f8ee;color:#21875c}.event-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}.event-heading h3{font-size:12px;color:#2b405f;font-weight:800}.event-heading time{font-size:10px;color:#8b99ae}.timeline-event-body>p{margin-top:7px;color:#7b8ba3;font-size:11px;line-height:1.7;overflow-wrap:anywhere}.timeline-note{margin-top:23px;padding-top:14px;border-top:1px solid #eef2f8;color:#9aa6b7;font-size:10px;line-height:1.7}.aside-title{display:flex;align-items:center;gap:11px;margin-bottom:20px}.aside-title h2{font-size:15px}.aside-icon{width:37px;height:37px;display:grid;place-items:center;border-radius:12px;background:#edf3ff;color:#4d70db;font-size:19px}.aside-icon.violet{background:#f1edff;color:#7655d6}.fact-list{margin:0}.fact-list>div{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #f0f3f8}.fact-list>div:first-child{padding-top:0}.fact-list>div:last-child{border:0;padding-bottom:0}.fact-list dt{font-size:11px;color:#8795aa}.fact-list dd{margin:0;max-width:60%;text-align:right;color:#3b506e;font-size:11px;font-weight:750;overflow-wrap:anywhere}.fact-list dd.deadline-value{color:#b36c16}.source-url{font-size:11px;line-height:1.7;color:#6f819d;overflow-wrap:anywhere;padding:12px;background:#f7f9fd;border:1px solid #edf1f8;border-radius:10px}.source-open{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:12px 13px;border-radius:10px;background:#edf3ff;color:#315fcf;text-decoration:none;font-size:11px;font-weight:800}.source-open:hover{background:#e2ebff}.no-source{padding:14px;border:1px dashed #e0e7f1;border-radius:11px}.no-source strong{font-size:11px;color:#60718a}.no-source p{margin-top:5px;font-size:10px;color:#95a1b2;line-height:1.6}.deadline-callout{display:flex;gap:13px;padding:19px;border:1px solid #f2e2bd;border-radius:17px;background:linear-gradient(120deg,#fffaf0,#fff)}.deadline-symbol{width:39px;height:39px;flex:none;display:grid;place-items:center;border-radius:12px;background:#fff0cf;color:#aa751a;font-size:21px}.deadline-callout h3{margin-top:6px;font-size:14px;color:#6c4b14}.deadline-callout p{margin-top:5px;color:#8b6a2e;font-size:11px}.deadline-callout a{display:inline-block;margin-top:11px;color:#a16b12;font-size:10px;font-weight:800;text-decoration:none}.add-context{display:flex;align-items:center;gap:12px;padding:15px;border:1px solid #e1e9f6;border-radius:16px;background:linear-gradient(110deg,#fff,#f8faff);text-decoration:none}.add-context>span{width:36px;height:36px;flex:none;display:grid;place-items:center;border-radius:12px;background:#eaf1ff;color:#376be3;font-size:22px}.add-context strong{font-size:11px;color:#344a69}.add-context p{margin-top:4px;color:#8795aa;font-size:10px;line-height:1.5}.add-context b{margin-left:auto;color:#5575ce}.detail-empty{max-width:500px;margin:12vh auto;padding:45px 25px;text-align:center;border:1px solid #e1e9f6;border-radius:22px;background:#fff;box-shadow:0 15px 40px #20395e0d}.detail-empty h1{margin:12px 0;font-size:25px;letter-spacing:-.8px}.detail-empty p{margin:0 auto 22px;max-width:340px;color:#7d8ba1;font-size:13px;line-height:1.7}.empty-icon{margin:0 auto 18px;width:48px;height:48px;display:grid;place-items:center;border-radius:15px;background:#edf3ff;color:#4b70df;font-size:23px}.detail-empty .eyebrow{margin-bottom:12px}.detail-empty .tm-primary{margin:auto}
@media(max-width:1000px){.detail-layout{grid-template-columns:minmax(0,1fr) minmax(245px,.75fr)}.hero-art{width:120px;height:120px;flex-basis:120px;transform:scale(.88)}}
@media(max-width:760px){.memory-detail-page{padding:20px 14px 35px}.detail-topbar{align-items:flex-start}.top-actions{gap:8px}.tm-quiet{display:none}.memory-hero{padding:23px 20px;border-radius:19px}.hero-art{display:none}.memory-hero h1{font-size:30px}.hero-summary{font-size:12px}.detail-layout{grid-template-columns:1fr;gap:15px;margin-top:15px}.detail-main,.detail-aside{gap:15px}.detail-panel{border-radius:16px;padding:19px}.section-heading h2{font-size:16px}.event-heading{display:block}.event-heading time{display:block;margin-top:6px}.fact-list dd{max-width:58%}.tm-primary.small{font-size:10px;padding:0 10px}.top-actions .tm-primary{min-height:34px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
`;