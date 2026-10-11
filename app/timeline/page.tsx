import Link from "next/link";
import { isSupabaseConfigured } from "../../lib/supabase";
import { createServerSupabaseClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

type Memory = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  source_type: string | null;
  created_at: string;
  deadline: string | null;
  is_favorite: boolean | null;
};

function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(undefined, options);
}

function formatTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSource(value: string | null) {
  return (value || "memory")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function EmptyState({
  title,
  description,
  buttonText,
  href,
}: {
  title: string;
  description: string;
  buttonText: string;
  href: React.ComponentProps<typeof Link>["href"];
}) {
  return (
    <div className="timeline-empty timeline-signin-empty">
      <div className="empty-icon" aria-hidden="true">
        ↗
      </div>

      <h2>{title}</h2>

      <p>{description}</p>

      <Link href={href} className="timeline-primary">
        {buttonText}
      </Link>
    </div>
  );
}

export default async function TimelinePage() {
  /*
   * STEP 1:
   * Check configuration before creating the Supabase client.
   * This prevents crashes when environment variables are missing.
   */

  if (!isSupabaseConfigured()) {
    return (
      <div className="timeline-page">
        <EmptyState
          title="Supabase isn't configured"
          description="Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment, then restart your application."
          buttonText="Back to dashboard"
          href="/"
        />

        <style>{styles}</style>
      </div>
    );
  }

  /*
   * STEP 2:
   * Create the cookie-aware server-side Supabase client.
   */

  let supabase;

  try {
    supabase = await createServerSupabaseClient();
  } catch (error) {
    console.error("Timeline: failed to create Supabase client.", error);

    return (
      <div className="timeline-page">
        <EmptyState
          title="Unable to connect"
          description="TraceMind couldn't initialize the database connection. Check your Supabase configuration and try again."
          buttonText="Back to dashboard"
          href="/"
        />

        <style>{styles}</style>
      </div>
    );
  }

  /*
   * STEP 3:
   * Safely retrieve the authenticated user.
   *
   * IMPORTANT:
   * Never destructure data.user directly because data
   * can be null when authentication fails.
   */

  let user = null;

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      const message = error.message?.toLowerCase() ?? "";
      const isMissingSession = message.includes("auth session missing") || message.includes("no user") || message.includes("not authenticated");

      if (!isMissingSession) {
        console.error("Timeline authentication error:", error.message);
      }
    }

    user = data?.user ?? null;
  } catch (error) {
    console.error("Timeline: unable to retrieve user.", error);
  }

  /*
   * STEP 4:
   * If no authenticated user exists, show the login state.
   */

  if (!user) {
    return (
      <div className="timeline-page">
        <EmptyState
          title="Sign in to see your timeline"
          description="Your saved memories appear here in chronological order. Sign in to explore your personal history."
          buttonText="Log in"
          href="/login"
        />

        <style>{styles}</style>
      </div>
    );
  }

  /*
   * STEP 5:
   * Fetch the current user's real memories.
   * No demonstration or hardcoded memory data is used.
   */

  let memories: Memory[] = [];
  let queryFailed = false;

  try {
    const { data, error } = await supabase
      .from("memories")
      .select(
        "id,title,summary,category,source_type,created_at,deadline,is_favorite"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Timeline memory query error:", error.message);
      queryFailed = true;
    } else {
      memories = (data ?? []) as Memory[];
    }
  } catch (error) {
    console.error("Timeline: unable to load memories.", error);
    queryFailed = true;
  }

  /*
   * STEP 6:
   * Group memories by month.
   */

  const groups = new Map<string, Memory[]>();

  for (const memory of memories) {
    const date = new Date(memory.created_at);

    const month = Number.isNaN(date.getTime())
      ? "Date unknown"
      : date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
        });

    const existing = groups.get(month) ?? [];

    existing.push(memory);

    groups.set(month, existing);
  }

  const deadlineCount = memories.filter(
    (memory) => memory.deadline
  ).length;

  const favoriteCount = memories.filter(
    (memory) => memory.is_favorite
  ).length;

  /*
   * STEP 7:
   * Render the Timeline page.
   */

  return (
    <div className="timeline-page">
      <header className="timeline-hero">
        <div className="hero-content">
          <div className="eyebrow">
            YOUR PERSONAL HISTORY
          </div>

          <h1>
            Memory timeline<span>.</span>
          </h1>

          <p className="hero-description">
            Follow the trail of things you have saved.
            Discover your notes, documents, screenshots,
            and important information in one place.
          </p>

          <div className="timeline-stats">
            <div className="stat-item">
              <strong>{memories.length}</strong>
              <span>Recent memories</span>
            </div>

            <div className="stat-item">
              <strong>{deadlineCount}</strong>
              <span>With deadlines</span>
            </div>

            <div className="stat-item">
              <strong>{favoriteCount}</strong>
              <span>Important</span>
            </div>
          </div>
        </div>

        <div className="timeline-hero-art" aria-hidden="true">
          <div className="hero-ring ring-a" />
          <div className="hero-ring ring-b" />

          <div className="hero-node">T</div>

          <span className="hero-dot dot-a" />
          <span className="hero-dot dot-b" />
          <span className="hero-dot dot-c" />
        </div>
      </header>

      <section className="timeline-toolbar">
        <div>
          <h2>Saved history</h2>

          <p>
            Your most recent memories, organized by month.
          </p>
        </div>

        <Link href="/capture" className="timeline-primary">
          <span aria-hidden="true">＋</span>
          Capture memory
        </Link>
      </section>

      {queryFailed ? (
        <EmptyState
          title="Timeline couldn't load"
          description="We couldn't retrieve your saved memories. Check your database connection and the memories table, then try again."
          buttonText="Try again"
          href="/timeline"
        />
      ) : memories.length === 0 ? (
        <EmptyState
          title="Your timeline starts here"
          description="Capture your first screenshot, link, document, or note to start building your searchable personal history."
          buttonText="Capture your first memory"
          href="/capture"
        />
      ) : (
        <div className="history-list">
          {Array.from(groups.entries()).map(([month, items]) => (
            <section className="history-group" key={month}>
              <div className="month-rail">
                <span className="month-dot" />

                <h2>{month}</h2>

                <span className="month-line" />
              </div>

              <div className="history-items">
                {items.map((memory) => (
                  <article
                    className="history-item"
                    key={memory.id}
                  >
                    <span className="item-connector" />

                    <div className="history-date">
                      <strong>
                        {formatDate(memory.created_at, {
                          day: "2-digit",
                        })}
                      </strong>

                      <span>
                        {formatDate(memory.created_at, {
                          weekday: "short",
                        })}
                      </span>

                      <time>
                        {formatTime(memory.created_at)}
                      </time>
                    </div>

                    <Link
                      href={`/memories/${memory.id}`}
                      className="history-card"
                    >
                      <div className="history-card-head">
                        <span className="history-source">
                          {formatSource(memory.source_type)}
                        </span>

                        {memory.is_favorite && (
                          <span className="history-star">
                            ★ Important
                          </span>
                        )}
                      </div>

                      <h3>
                        {memory.title || "Untitled memory"}
                      </h3>

                      <p className="memory-summary">
                        {memory.summary ||
                          "Open this memory to view its saved information and source details."}
                      </p>

                      <div className="history-card-footer">
                        <span className="category-badge">
                          {memory.category || "Uncategorized"}
                        </span>

                        {memory.deadline && (
                          <span className="history-deadline">
                            ◷ Deadline:{" "}
                            {formatDate(memory.deadline, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}

                        <span className="view-memory">
                          View memory ↗
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.timeline-page {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: clamp(20px, 3vw, 42px);
  color: #172b4d;
}

.timeline-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  overflow: hidden;
  padding: clamp(25px, 4vw, 44px);
  border: 1px solid #e1e8f6;
  border-radius: 22px;
  background:
    radial-gradient(
      circle at 85% 10%,
      rgba(120, 112, 255, 0.13),
      transparent 34%
    ),
    linear-gradient(120deg, #ffffff, #f7f9ff);
  box-shadow: 0 12px 35px rgba(35, 56, 90, 0.045);
}

.hero-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.eyebrow {
  color: #7786a0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.timeline-hero h1 {
  margin-top: 12px;
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 750;
  letter-spacing: -1.8px;
  line-height: 1.15;
}

.timeline-hero h1 span {
  color: #5b55e7;
}

.hero-description {
  max-width: 590px;
  margin-top: 14px;
  color: #6d7d96;
  font-size: 14px;
  line-height: 1.8;
}

.timeline-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-top: 28px;
}

.stat-item {
  display: grid;
  gap: 5px;
}

.stat-item strong {
  color: #263f67;
  font-size: 23px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.7px;
}

.stat-item span {
  color: #7d8ba3;
  font-size: 11px;
}

.timeline-hero-art {
  position: relative;
  display: grid;
  width: 155px;
  height: 155px;
  flex: 0 0 155px;
  place-items: center;
}

.hero-ring {
  position: absolute;
  border: 1px solid #cbd5fa;
  border-radius: 50%;
}

.ring-a {
  width: 145px;
  height: 82px;
  transform: rotate(-30deg);
}

.ring-b {
  width: 100px;
  height: 145px;
  transform: rotate(38deg);
}

.hero-node {
  display: grid;
  width: 62px;
  height: 62px;
  place-items: center;
  border-radius: 19px;
  background: linear-gradient(145deg, #397bf4, #7652e8);
  box-shadow: 0 12px 30px rgba(94, 105, 230, 0.25);
  color: #ffffff;
  font-size: 26px;
  font-weight: 800;
}

.hero-dot {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #7164e8;
  box-shadow: 0 0 0 5px #e9eaff;
}

.dot-a {
  top: 20px;
  right: 25px;
}

.dot-b {
  bottom: 20px;
  left: 17px;
  background: #398ff4;
}

.dot-c {
  right: 3px;
  bottom: 54px;
  width: 7px;
  height: 7px;
}

.timeline-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 30px 2px 22px;
}

.timeline-toolbar h2 {
  font-size: 19px;
  font-weight: 750;
  letter-spacing: -0.4px;
}

.timeline-toolbar p {
  margin-top: 5px;
  color: #8492a8;
  font-size: 12px;
  line-height: 1.6;
}

.timeline-primary {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: #4f46e5;
  box-shadow: 0 5px 14px rgba(79, 70, 229, 0.14);
  color: #ffffff;
  font-size: 12px;
  font-weight: 750;
  text-align: center;
  text-decoration: none;
  transition:
    background 160ms ease,
    transform 160ms ease;
}

.timeline-primary:hover {
  transform: translateY(-1px);
  background: #4338ca;
}

.timeline-primary:focus-visible,
.history-card:focus-visible {
  outline: 3px solid #a5b4fc;
  outline-offset: 3px;
}

.history-list {
  padding: 6px 0 24px;
}

.history-group {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 20px;
}

.month-rail {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding-top: 10px;
}

.month-dot {
  width: 11px;
  height: 11px;
  flex: none;
  margin-top: 2px;
  border: 3px solid #e0e8ff;
  border-radius: 50%;
  background: #5274e8;
  box-shadow: 0 0 0 4px #f1f4ff;
}

.month-rail h2 {
  color: #617491;
  font-size: 12px;
  font-weight: 800;
}

.month-line {
  position: absolute;
  top: 31px;
  bottom: -2px;
  left: 5px;
  width: 1px;
  background: #e2e9f5;
}

.history-items {
  position: relative;
  padding-bottom: 22px;
}

.history-items::before {
  position: absolute;
  top: 23px;
  bottom: 0;
  left: 0;
  width: 1px;
  background: #dce5f5;
  content: "";
}

.history-item {
  position: relative;
  display: grid;
  grid-template-columns: 85px minmax(0, 1fr);
  gap: 17px;
  padding-bottom: 17px;
}

.history-item:last-child {
  padding-bottom: 0;
}

.item-connector {
  position: absolute;
  top: 24px;
  left: -4px;
  width: 9px;
  height: 9px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #9daff2;
  box-shadow: 0 0 0 1px #dbe4fa;
}

.history-date {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 15px;
  color: #8796ad;
  text-align: right;
}

.history-date strong {
  color: #344d73;
  font-size: 18px;
  line-height: 1;
}

.history-date span,
.history-date time {
  font-size: 10px;
}

.history-card {
  display: block;
  min-width: 0;
  padding: 18px 20px;
  border: 1px solid #e3eaf5;
  border-radius: 15px;
  background: #ffffff;
  box-shadow: 0 5px 20px rgba(38, 60, 100, 0.025);
  text-decoration: none;
  overflow-wrap: anywhere;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.history-card:hover {
  transform: translateY(-2px);
  border-color: #cdd9fb;
  box-shadow: 0 12px 28px rgba(38, 60, 100, 0.07);
}

.history-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.history-source,
.history-star,
.category-badge,
.history-deadline {
  display: inline-flex;
  align-items: center;
  border-radius: 7px;
  font-size: 10px;
  font-weight: 750;
}

.history-source {
  padding: 5px 8px;
  background: #edf3ff;
  color: #3e67d4;
}

.history-star {
  padding: 5px 8px;
  background: #fff6df;
  color: #a97616;
}

.history-card h3 {
  margin-top: 12px;
  color: #213857;
  font-size: 15px;
  font-weight: 750;
  letter-spacing: -0.2px;
  line-height: 1.5;
}

.memory-summary {
  margin-top: 7px;
  color: #798aa3;
  font-size: 12px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.history-card-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid #f0f3f8;
}

.category-badge {
  padding: 5px 8px;
  background: #f3f5fa;
  color: #74839a;
}

.history-deadline {
  padding: 5px 8px;
  background: #fff5df;
  color: #a8741b;
}

.view-memory {
  margin-left: auto;
  color: #456cda;
  font-size: 11px;
  font-weight: 750;
}

.timeline-empty {
  max-width: 580px;
  margin: 30px auto;
  padding: 42px 24px;
  border: 1px solid #e1e9f6;
  border-radius: 20px;
  background: #ffffff;
  text-align: center;
}

.timeline-signin-empty {
  padding: 40px 28px;
  border: 1px solid #dfe6ff;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #f7f9ff 100%);
  box-shadow: 0 18px 42px rgba(79, 70, 229, 0.08);
}

.empty-icon {
  display: grid;
  width: 46px;
  height: 46px;
  margin: 0 auto 15px;
  place-items: center;
  border-radius: 14px;
  background: #edf3ff;
  color: #4771df;
  font-size: 24px;
}

.timeline-empty h2 {
  margin-top: 12px;
  color: #213857;
  font-size: 22px;
  font-weight: 750;
  letter-spacing: -0.6px;
}

.timeline-empty p {
  max-width: 390px;
  margin: 10px auto 20px;
  color: #7f8ea5;
  font-size: 13px;
  line-height: 1.8;
}

.timeline-empty .timeline-primary {
  margin: 0 auto;
}

@media (max-width: 900px) {
  .timeline-page {
    padding: 24px 18px;
  }

  .timeline-hero {
    padding: 28px 24px;
  }

  .timeline-hero-art {
    width: 115px;
    height: 115px;
    flex-basis: 115px;
    transform: scale(0.8);
  }

  .history-group {
    grid-template-columns: 135px minmax(0, 1fr);
    gap: 15px;
  }
}

@media (max-width: 600px) {
  .timeline-page {
    padding: 18px 14px 32px;
  }

  .timeline-hero {
    padding: 24px 20px;
    border-radius: 17px;
  }

  .timeline-hero-art {
    display: none;
  }

  .timeline-hero h1 {
    font-size: clamp(29px, 8vw, 36px);
    letter-spacing: -1.2px;
  }

  .hero-description {
    font-size: 13px;
  }

  .timeline-stats {
    gap: 22px;
    margin-top: 24px;
  }

  .stat-item strong {
    font-size: 21px;
  }

  .stat-item span {
    font-size: 10px;
  }

  .timeline-toolbar {
    align-items: flex-start;
    gap: 12px;
    margin-top: 25px;
  }

  .timeline-toolbar h2 {
    font-size: 17px;
  }

  .timeline-toolbar p {
    font-size: 11px;
  }

  .timeline-toolbar .timeline-primary {
    min-height: 39px;
    flex-shrink: 0;
    padding: 0 10px;
    font-size: 11px;
  }

  .history-group {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }

  .month-rail {
    padding-top: 8px;
  }

  .month-line {
    display: none;
  }

  .history-items {
    padding-left: 1px;
  }

  .history-item {
    grid-template-columns: 43px minmax(0, 1fr);
    gap: 11px;
  }

  .history-date strong {
    font-size: 16px;
  }

  .history-date span,
  .history-date time {
    font-size: 9px;
  }

  .history-card {
    padding: 15px;
    border-radius: 13px;
  }

  .history-card h3 {
    font-size: 14px;
  }

  .memory-summary {
    font-size: 11px;
  }

  .history-card-footer {
    gap: 7px;
  }

  .view-memory {
    margin-left: 0;
  }

  .timeline-empty {
    padding: 32px 19px;
  }

  .timeline-empty h2 {
    font-size: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .history-card,
  .timeline-primary {
    transition: none;
  }

  .history-card:hover,
  .timeline-primary:hover {
    transform: none;
  }
}
`;