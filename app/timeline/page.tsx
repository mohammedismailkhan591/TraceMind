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
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, options);
}

function formatTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatSource(value: string | null) {
  return (value || "memory").replace(/[_-]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function EmptyState({
  icon = "✦", eyebrow, title, description, buttonText, href, secondaryText, secondaryHref,
}: {
  icon?: string;
  eyebrow?: string;
  title: string;
  description: string;
  buttonText: string;
  href: React.ComponentProps<typeof Link>["href"];
  secondaryText?: string;
  secondaryHref?: React.ComponentProps<typeof Link>["href"];
}) {
  return (
    <div className="tm-empty">
      <div className="tm-empty-icon" aria-hidden="true">{icon}</div>
      {eyebrow && <span className="tm-eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="tm-empty-actions">
        <Link href={href} className="tm-button tm-button-primary">{buttonText}</Link>
        {secondaryText && secondaryHref && <Link href={secondaryHref} className="tm-button tm-button-quiet">{secondaryText}</Link>}
      </div>
    </div>
  );
}

function PublicTimelineLanding() {
  return (
    <main className="tm-public">
      <nav className="tm-nav" aria-label="Main navigation">
        <Link href="/" className="tm-brand" aria-label="TraceMind home"><span className="tm-brand-mark">T</span><span>Trace<span>Mind</span></span></Link>
        <div className="tm-nav-links"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#about">About</a></div>
        <div className="tm-nav-actions"><Link href="/login" className="tm-login-link">Log in</Link><Link href="/signup" className="tm-button tm-button-primary">Get started <span aria-hidden="true">↗</span></Link></div>
      </nav>

      <section className="tm-public-hero" id="about">
        <div className="tm-hero-copy">
          <div className="tm-pill"><span className="tm-live-dot" /> YOUR LIFE, CONNECTED</div>
          <h1>Your life has a story.<br /><span>Find every chapter.</span></h1>
          <p className="tm-hero-description">A little detail today can matter a lot tomorrow. TraceMind helps you keep your notes, links, documents, and important moments together in one personal timeline.</p>
          <div className="tm-hero-actions"><Link href="/signup" className="tm-button tm-button-primary tm-button-large">Start your timeline <span aria-hidden="true">↗</span></Link><a href="#how-it-works" className="tm-button tm-button-secondary tm-button-large"><span className="tm-play" aria-hidden="true">▶</span> See how it works</a></div>
          <div className="tm-trust-note"><span aria-hidden="true">✦</span> Your memories stay personal and organized.</div>
        </div>

        <div className="tm-preview-wrap" aria-label="Illustration of a personal memory timeline">
          <div className="tm-preview-glow" />
          <div className="tm-preview-window">
            <div className="tm-window-top"><div className="tm-window-dots"><i /><i /><i /></div><span>YOUR TIMELINE</span><span className="tm-window-menu">•••</span></div>
            <div className="tm-preview-content">
              <div className="tm-preview-heading"><div><small>PERSONAL HISTORY</small><h3>Moments that matter</h3></div><span className="tm-calendar-icon">▦</span></div>
              <div className="tm-preview-stat-row"><div><strong>01</strong><span>Capture</span></div><div><strong>02</strong><span>Organize</span></div><div><strong>03</strong><span>Rediscover</span></div></div>
              <div className="tm-preview-timeline">
                <div className="tm-preview-month"><span /> OCTOBER <b>2026</b></div>
                <div className="tm-preview-event"><span className="tm-event-rail" /><span className="tm-event-date">12<small>MON</small></span><div className="tm-event-card"><span className="tm-event-tag tm-tag-blue">NOTE</span><strong>A thought worth keeping</strong><small>Your ideas, in one place.</small></div></div>
                <div className="tm-preview-event"><span className="tm-event-rail" /><span className="tm-event-date">08<small>THU</small></span><div className="tm-event-card"><span className="tm-event-tag tm-tag-violet">LINK</span><strong>A useful resource</strong><small>Something to revisit later.</small></div></div>
                <div className="tm-preview-event"><span className="tm-event-rail" /><span className="tm-event-date">03<small>SAT</small></span><div className="tm-event-card"><span className="tm-event-tag tm-tag-amber">IDEA</span><strong>A spark of inspiration</strong><small>Keep the good stuff close.</small></div></div>
              </div>
            </div>
          </div>
          <div className="tm-float-card tm-float-top"><span className="tm-float-icon">✦</span><div><strong>Never lose the thread</strong><small>Your memories, connected</small></div></div>
          <div className="tm-float-card tm-float-bottom"><span className="tm-float-check">✓</span><div><strong>All in one timeline</strong><small>Easy to find again</small></div></div>
        </div>
      </section>

      <section className="tm-feature-section" id="features">
        <div className="tm-section-heading"><span className="tm-eyebrow">A CLEARER PICTURE</span><h2>More than a list of saved things.</h2><p>Bring the pieces of your digital life into a timeline that makes sense.</p></div>
        <div className="tm-feature-grid">
          <article className="tm-feature-card"><div className="tm-feature-icon tm-icon-blue">◷</div><h3>See the bigger picture</h3><p>Browse your saved memories in chronological order and follow the story as it unfolds.</p><span className="tm-feature-number">01</span></article>
          <article className="tm-feature-card"><div className="tm-feature-icon tm-icon-violet">⌕</div><h3>Rediscover what matters</h3><p>Keep notes, links, documents, and useful details ready for the moment you need them.</p><span className="tm-feature-number">02</span></article>
          <article className="tm-feature-card"><div className="tm-feature-icon tm-icon-amber">✧</div><h3>Keep important moments close</h3><p>Mark favorites and keep an eye on memories that have deadlines attached.</p><span className="tm-feature-number">03</span></article>
        </div>
      </section>

      <section className="tm-how-section" id="how-it-works">
        <div className="tm-how-copy"><span className="tm-eyebrow">SIMPLE BY DESIGN</span><h2>Capture it now.<br /><span>Find it when it counts.</span></h2><p>TraceMind gives the details you save a home, so your personal history becomes easier to revisit instead of getting lost in tabs, files, and screenshots.</p><Link href="/signup" className="tm-text-link">Build your personal timeline <span aria-hidden="true">→</span></Link></div>
        <div className="tm-steps"><div className="tm-step"><span>01</span><div><strong>Capture</strong><p>Save the information you want to remember.</p></div><b>↗</b></div><div className="tm-step"><span>02</span><div><strong>Connect</strong><p>Keep your saved details together in one place.</p></div><b>⌘</b></div><div className="tm-step"><span>03</span><div><strong>Rediscover</strong><p>Return to your memories whenever you need them.</p></div><b>✦</b></div></div>
      </section>

      <footer className="tm-footer"><Link href="/" className="tm-brand"><span className="tm-brand-mark">T</span><span>Trace<span>Mind</span></span></Link><p>Your personal memory, with a clearer path back.</p><Link href="/login" className="tm-footer-link">Already have an account? Log in →</Link></footer>
    </main>
  );
}

export default async function TimelinePage() {
  if (!isSupabaseConfigured()) {
    return <div className="tm-timeline-page"><EmptyState icon="⚙" eyebrow="SETUP REQUIRED" title="Your timeline is almost ready" description="TraceMind needs its Supabase connection configured before it can load private memories. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment, then restart the app." buttonText="Back to home" href="/" /><style>{styles}</style></div>;
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (error) {
    console.error("Timeline: failed to create Supabase client.", error);
    return <div className="tm-timeline-page"><EmptyState icon="↻" eyebrow="CONNECTION ISSUE" title="Unable to connect right now" description="TraceMind couldn't initialize the database connection. Check your Supabase configuration and try again." buttonText="Back to home" href="/" /><style>{styles}</style></div>;
  }

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      const message = error.message?.toLowerCase() ?? "";
      const isMissingSession = message.includes("auth session missing") || message.includes("no user") || message.includes("not authenticated");
      if (!isMissingSession) console.error("Timeline authentication error:", error.message);
    }
    user = data?.user ?? null;
  } catch (error) {
    console.error("Timeline: unable to retrieve user.", error);
  }

  // Public visitors see the landing page. Private timeline data is queried only for authenticated users.
  if (!user) {
    return <div className="tm-timeline-page"><PublicTimelineLanding /><style>{styles}</style></div>;
  }

  let memories: Memory[] = [];
  let queryFailed = false;
  try {
    const { data, error } = await supabase.from("memories")
      .select("id,title,summary,category,source_type,created_at,deadline,is_favorite")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
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

  const groups = new Map<string, Memory[]>();
  for (const memory of memories) {
    const date = new Date(memory.created_at);
    const month = Number.isNaN(date.getTime()) ? "Date unknown" : date.toLocaleDateString(undefined, { year: "numeric", month: "long" });
    const existing = groups.get(month) ?? [];
    existing.push(memory);
    groups.set(month, existing);
  }
  const deadlineCount = memories.filter((memory) => memory.deadline).length;
  const favoriteCount = memories.filter((memory) => memory.is_favorite).length;

  return (
    <div className="tm-timeline-page">
      <div className="tm-dashboard-topline"><div><span className="tm-eyebrow">YOUR PERSONAL HISTORY</span><h1>Your story, <span>at a glance.</span></h1><p>Everything you’ve saved, arranged in a timeline you can follow.</p></div><Link href="/capture" className="tm-button tm-button-primary"><span aria-hidden="true">＋</span> Capture memory</Link></div>
      <section className="tm-dashboard-summary">
        <div className="tm-summary-copy"><div className="tm-summary-mark">T</div><div><span className="tm-eyebrow">YOUR TRACE MIND</span><h2>Small details. <span>Lasting value.</span></h2><p>Revisit the ideas, resources, and moments you chose to keep.</p></div></div>
        <div className="tm-dashboard-stats"><div><strong>{memories.length}</strong><span>Memories loaded</span></div><div><strong>{deadlineCount}</strong><span>With deadlines</span></div><div><strong>{favoriteCount}</strong><span>Important</span></div></div>
      </section>
      <section className="tm-history-toolbar"><div><h2>Saved history</h2><p>Grouped by month, newest first.</p></div><span className="tm-history-count">{memories.length} {memories.length === 1 ? "memory" : "memories"}</span></section>
      {queryFailed ? (
        <EmptyState icon="↻" eyebrow="SOMETHING WENT WRONG" title="Your timeline couldn't load" description="We couldn't retrieve your saved memories. Please check your connection and try again." buttonText="Try again" href="/timeline" />
      ) : memories.length === 0 ? (
        <EmptyState icon="✧" eyebrow="A FRESH START" title="Your timeline starts here" description="Capture your first screenshot, link, document, or note to start building your searchable personal history." buttonText="Capture your first memory" href="/capture" secondaryText="Explore TraceMind" secondaryHref="/" />
      ) : (
        <div className="tm-history-list">{Array.from(groups.entries()).map(([month, items]) => (
          <section className="tm-history-group" key={month}>
            <div className="tm-month-rail"><span className="tm-month-dot" /><h2>{month}</h2><span className="tm-month-line" /></div>
            <div className="tm-history-items">{items.map((memory) => (
              <article className="tm-history-item" key={memory.id}>
                <span className="tm-item-connector" />
                <div className="tm-history-date"><strong>{formatDate(memory.created_at, { day: "2-digit" })}</strong><span>{formatDate(memory.created_at, { weekday: "short" })}</span><time>{formatTime(memory.created_at)}</time></div>
                <Link href={`/memories/${memory.id}`} className="tm-history-card">
                  <div className="tm-history-card-head"><span className="tm-history-source">{formatSource(memory.source_type)}</span>{memory.is_favorite && <span className="tm-history-star">★ Important</span>}</div>
                  <h3>{memory.title || "Untitled memory"}</h3>
                  <p className="tm-memory-summary">{memory.summary || "Open this memory to view its saved information and source details."}</p>
                  <div className="tm-history-card-footer"><span className="tm-category-badge">{memory.category || "Uncategorized"}</span>{memory.deadline && <span className="tm-history-deadline">◷ Deadline: {formatDate(memory.deadline, { month: "short", day: "numeric", year: "numeric" })}</span>}<span className="tm-view-memory">View memory ↗</span></div>
                </Link>
              </article>
            ))}</div>
          </section>
        ))}</div>
      )}
      <style>{styles}</style>
    </div>
  );
}

const styles = `
.tm-timeline-page { --tm-ink:#17243d; --tm-muted:#74819a; width:100%; max-width:1440px; margin:0 auto; padding:clamp(18px,3vw,42px); color:var(--tm-ink); }
.tm-timeline-page * { box-sizing:border-box; }
.tm-eyebrow { color:#8993aa; font-size:10px; font-weight:800; letter-spacing:1.65px; }
.tm-button { display:inline-flex; align-items:center; justify-content:center; gap:9px; min-height:43px; padding:0 17px; border-radius:12px; text-decoration:none; font-size:12px; font-weight:750; transition:transform .18s ease,box-shadow .18s ease,background .18s ease; }
.tm-button:hover { transform:translateY(-2px); }
.tm-button-primary { color:#fff; background:linear-gradient(135deg,#655cf0,#5144d8); box-shadow:0 8px 20px #594ee133; }
.tm-button-primary:hover { background:linear-gradient(135deg,#574ce3,#4639c8); box-shadow:0 12px 24px #594ee140; }
.tm-button-quiet { color:#5b55ce; background:#f1f0ff; }
.tm-empty { max-width:600px; margin:42px auto; padding:clamp(28px,5vw,48px) 24px; text-align:center; border:1px solid #e7e9f6; border-radius:24px; background:linear-gradient(145deg,#fff,#f8f8ff); box-shadow:0 22px 60px #27315b0f; }
.tm-empty-icon { display:grid; place-items:center; width:54px; height:54px; margin:0 auto 18px; border:1px solid #e4e2ff; border-radius:17px; background:#f0efff; color:#6257e8; font-size:24px; }
.tm-empty h2 { margin:12px 0 0; font-size:clamp(22px,3vw,28px); letter-spacing:-.8px; }
.tm-empty p { max-width:440px; margin:12px auto 23px; color:var(--tm-muted); font-size:13px; line-height:1.8; }
.tm-empty-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; }
.tm-public { overflow:hidden; margin:-1px; color:#18213a; background:#fbfbfe; border-radius:20px; }
.tm-nav { display:flex; align-items:center; justify-content:space-between; gap:22px; max-width:1280px; margin:0 auto; padding:23px clamp(20px,4vw,50px); }
.tm-brand { display:inline-flex; align-items:center; gap:10px; color:#18213a; text-decoration:none; font-size:19px; font-weight:850; letter-spacing:-.8px; white-space:nowrap; }
.tm-brand > span:last-child > span { color:#6359e8; }
.tm-brand-mark { display:grid; place-items:center; width:34px; height:34px; border-radius:11px; color:white; background:linear-gradient(145deg,#8277ff,#5146d7); box-shadow:0 7px 16px #665ce533; font-size:18px; }
.tm-nav-links,.tm-nav-actions { display:flex; align-items:center; gap:clamp(14px,2.5vw,30px); }
.tm-nav-links a,.tm-login-link { color:#68738b; text-decoration:none; font-size:12px; font-weight:650; transition:color .18s ease; }
.tm-nav-links a:hover,.tm-login-link:hover { color:#5a50df; }
.tm-nav-actions { gap:20px; }
.tm-nav-actions .tm-button { min-height:39px; padding:0 15px; }
.tm-public-hero { display:grid; grid-template-columns:minmax(0,1fr) minmax(380px,.9fr); align-items:center; gap:clamp(25px,5vw,75px); max-width:1280px; margin:0 auto; padding:clamp(52px,8vw,100px) clamp(20px,4vw,50px) 88px; }
.tm-hero-copy { position:relative; z-index:1; }
.tm-pill { display:inline-flex; align-items:center; gap:9px; padding:8px 12px; border:1px solid #e7e5ff; border-radius:999px; color:#6359d9; background:#f4f2ff; font-size:9px; font-weight:850; letter-spacing:1.15px; }
.tm-live-dot { width:7px; height:7px; border-radius:50%; background:#7567ed; box-shadow:0 0 0 4px #e4e0ff; }
.tm-hero-copy h1 { margin:23px 0 0; font-size:clamp(39px,5.2vw,67px); line-height:1.06; letter-spacing:-3.2px; font-weight:850; }
.tm-hero-copy h1 span,.tm-how-copy h2 span { color:#6559e9; }
.tm-hero-description { max-width:530px; margin:23px 0 0; color:#78839a; font-size:15px; line-height:1.9; }
.tm-hero-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:30px; }
.tm-button-large { min-height:49px; padding:0 19px; border-radius:13px; font-size:12px; }
.tm-button-secondary { color:#434d68; border:1px solid #e6e8f2; background:white; box-shadow:0 5px 15px #242d4d08; }
.tm-button-secondary:hover { background:#f8f8ff; }
.tm-play { display:grid; place-items:center; width:20px; height:20px; border-radius:50%; background:#f0efff; color:#6359e9; font-size:8px; }
.tm-trust-note { display:flex; align-items:center; gap:8px; margin-top:25px; color:#8a94a9; font-size:11px; }
.tm-trust-note span { color:#7063e9; }
.tm-preview-wrap { position:relative; min-width:0; padding:15px 10px; isolation:isolate; }
.tm-preview-glow { position:absolute; z-index:-1; inset:12% 5%; border-radius:45%; background:#cfcaff; filter:blur(55px); opacity:.65; }
.tm-preview-window { overflow:hidden; border:1px solid #e5e6f2; border-radius:20px; background:white; box-shadow:0 30px 90px #32345d18,0 4px 12px #32345d08; transform:perspective(1200px) rotateY(-4deg) rotateX(2deg); animation:tm-float 7s ease-in-out infinite; }
.tm-window-top { display:flex; align-items:center; justify-content:space-between; padding:15px 19px; border-bottom:1px solid #f0f1f7; color:#9aa2b4; font-size:8px; font-weight:850; letter-spacing:1.5px; }
.tm-window-dots { display:flex; gap:4px; }
.tm-window-dots i { width:6px; height:6px; border-radius:50%; background:#dedff0; }
.tm-window-menu { letter-spacing:2px; }
.tm-preview-content { padding:23px clamp(16px,2vw,27px) 25px; }
.tm-preview-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.tm-preview-heading small { color:#939bb0; font-size:8px; font-weight:800; letter-spacing:1.3px; }
.tm-preview-heading h3 { margin-top:6px; color:#202944; font-size:clamp(17px,2vw,22px); letter-spacing:-.7px; }
.tm-calendar-icon { display:grid; place-items:center; width:39px; height:39px; border-radius:12px; color:#685ce7; background:#f0efff; font-size:19px; }
.tm-preview-stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:21px 0 25px; }
.tm-preview-stat-row>div { display:grid; gap:5px; padding:11px 12px; border:1px solid #f0f1f7; border-radius:11px; background:#fcfcff; }
.tm-preview-stat-row strong { color:#4f4d91; font-size:15px; }
.tm-preview-stat-row span { color:#9aa2b5; font-size:9px; }
.tm-preview-timeline { padding-top:3px; }
.tm-preview-month { display:flex; align-items:center; gap:7px; margin-bottom:13px; color:#5e6680; font-size:9px; font-weight:850; letter-spacing:1px; }
.tm-preview-month>span { width:7px; height:7px; border-radius:50%; background:#6b60e8; }
.tm-preview-month b { color:#9ba3b7; }
.tm-preview-event { position:relative; display:grid; grid-template-columns:36px minmax(0,1fr); gap:12px; padding-bottom:11px; }
.tm-event-rail { position:absolute; top:5px; bottom:-2px; left:3px; width:1px; background:#e6e7f3; }
.tm-preview-event:last-child .tm-event-rail { display:none; }
.tm-event-date { position:relative; z-index:1; display:grid; align-content:start; gap:3px; color:#424c6a; font-size:15px; font-weight:850; }
.tm-event-date small { color:#9ba3b5; font-size:8px; font-weight:700; }
.tm-event-card { display:grid; gap:5px; padding:12px 14px; border:1px solid #eceef6; border-radius:11px; background:white; }
.tm-event-card strong { color:#3b4561; font-size:11px; }
.tm-event-card>small { color:#9aa2b5; font-size:9px; }
.tm-event-tag { width:fit-content; padding:4px 6px; border-radius:5px; font-size:7px; font-weight:850; letter-spacing:.7px; }
.tm-tag-blue { color:#4b71cb; background:#eef3ff; }
.tm-tag-violet { color:#7160d7; background:#f2efff; }
.tm-tag-amber { color:#ad833b; background:#fff6e5; }
.tm-float-card { position:absolute; z-index:2; display:flex; align-items:center; gap:10px; padding:12px 15px; border:1px solid #ebeaf7; border-radius:13px; background:#ffffffed; box-shadow:0 12px 35px #30305217; backdrop-filter:blur(12px); animation:tm-float-card 6s ease-in-out infinite; }
.tm-float-top { top:4px; right:-10px; }
.tm-float-bottom { bottom:2px; left:-15px; animation-delay:-2s; }
.tm-float-icon,.tm-float-check { display:grid; place-items:center; width:30px; height:30px; border-radius:9px; color:#6659e7; background:#f0efff; font-size:14px; }
.tm-float-check { color:#27876c; background:#e9faf3; }
.tm-float-card div { display:grid; gap:4px; }
.tm-float-card strong { color:#3b4560; font-size:10px; }
.tm-float-card small { color:#929bb0; font-size:9px; }
.tm-feature-section { padding:65px clamp(20px,4vw,50px) 90px; border-top:1px solid #f0f0f7; background:#fff; }
.tm-section-heading { max-width:620px; margin:0 auto 35px; text-align:center; }
.tm-section-heading h2 { margin-top:13px; font-size:clamp(26px,3.5vw,39px); letter-spacing:-1.7px; }
.tm-section-heading p { margin-top:12px; color:#858ea3; font-size:13px; line-height:1.8; }
.tm-feature-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; max-width:1180px; margin:0 auto; }
.tm-feature-card { position:relative; overflow:hidden; padding:25px 25px 29px; border:1px solid #e9eaf3; border-radius:17px; background:linear-gradient(145deg,#fff,#fcfcff); transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease; }
.tm-feature-card:hover { transform:translateY(-4px); border-color:#d9d5ff; box-shadow:0 18px 40px #38345d0c; }
.tm-feature-icon { display:grid; place-items:center; width:43px; height:43px; border-radius:13px; font-size:21px; }
.tm-icon-blue { color:#4778d9; background:#edf4ff; }
.tm-icon-violet { color:#7060dc; background:#f1efff; }
.tm-icon-amber { color:#b58129; background:#fff5e3; }
.tm-feature-card h3 { margin-top:21px; font-size:15px; letter-spacing:-.3px; }
.tm-feature-card p { max-width:300px; margin-top:9px; color:#828da4; font-size:12px; line-height:1.8; }
.tm-feature-number { position:absolute; top:19px; right:22px; color:#eaebf4; font-size:27px; font-weight:850; letter-spacing:-1px; }
.tm-how-section { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.85fr); align-items:center; gap:clamp(30px,7vw,100px); padding:75px clamp(20px,7vw,100px) 85px; background:#f6f6ff; }
.tm-how-copy h2 { margin-top:15px; font-size:clamp(30px,4vw,45px); line-height:1.15; letter-spacing:-1.8px; }
.tm-how-copy>p { max-width:460px; margin-top:17px; color:#7b859d; font-size:13px; line-height:1.9; }
.tm-text-link { display:inline-flex; align-items:center; gap:9px; margin-top:22px; color:#5f55df; font-size:12px; font-weight:800; text-decoration:none; }
.tm-steps { display:grid; gap:12px; }
.tm-step { display:grid; grid-template-columns:38px minmax(0,1fr) 30px; align-items:center; gap:14px; padding:17px 18px; border:1px solid #e8e8f4; border-radius:14px; background:#fff; }
.tm-step>span { color:#766ce8; font-size:12px; font-weight:850; }
.tm-step strong { color:#343e59; font-size:12px; }
.tm-step p { margin-top:4px; color:#8992a7; font-size:10px; line-height:1.6; }
.tm-step>b { display:grid; place-items:center; width:30px; height:30px; border-radius:9px; color:#685de1; background:#f2f0ff; font-size:13px; }
.tm-footer { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:15px; padding:25px clamp(20px,4vw,50px); border-top:1px solid #efeff6; background:#fff; }
.tm-footer .tm-brand { font-size:16px; }
.tm-footer .tm-brand-mark { width:29px; height:29px; font-size:15px; border-radius:9px; }
.tm-footer p,.tm-footer-link { color:#8b94a8; font-size:10px; }
.tm-footer-link { color:#5e55d9; font-weight:750; text-decoration:none; }
.tm-dashboard-topline { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; padding:8px 2px 26px; }
.tm-dashboard-topline h1 { margin-top:10px; font-size:clamp(30px,4vw,45px); letter-spacing:-1.9px; line-height:1.1; }
.tm-dashboard-topline h1 span { color:#6559e9; }
.tm-dashboard-topline p { margin-top:10px; color:var(--tm-muted); font-size:13px; line-height:1.7; }
.tm-dashboard-summary { display:flex; align-items:center; justify-content:space-between; gap:25px; padding:clamp(22px,3vw,34px); border:1px solid #e6e5fa; border-radius:22px; background:radial-gradient(circle at 90% 0%,#e9e6ff 0,transparent 38%),linear-gradient(120deg,#fff,#f9f8ff); box-shadow:0 15px 40px #38345d08; }
.tm-summary-copy { display:flex; align-items:center; gap:16px; }
.tm-summary-mark { display:grid; place-items:center; width:54px; height:54px; flex:0 0 54px; border-radius:17px; color:#fff; background:linear-gradient(145deg,#8277ff,#5146d7); box-shadow:0 9px 22px #665ce533; font-size:24px; font-weight:850; }
.tm-summary-copy h2 { margin-top:7px; font-size:clamp(17px,2vw,22px); letter-spacing:-.7px; }
.tm-summary-copy h2 span { color:#6559e9; }
.tm-summary-copy p { margin-top:6px; color:#838da3; font-size:11px; line-height:1.6; }
.tm-dashboard-stats { display:flex; flex-wrap:wrap; gap:clamp(18px,3vw,35px); }
.tm-dashboard-stats>div { display:grid; gap:6px; min-width:65px; }
.tm-dashboard-stats strong { color:#303b5b; font-size:25px; font-variant-numeric:tabular-nums; letter-spacing:-1px; }
.tm-dashboard-stats span { color:#8992a8; font-size:10px; white-space:nowrap; }
.tm-history-toolbar { display:flex; align-items:center; justify-content:space-between; gap:15px; margin:34px 2px 20px; }
.tm-history-toolbar h2 { font-size:19px; letter-spacing:-.5px; }
.tm-history-toolbar p { margin-top:5px; color:#8992a8; font-size:11px; }
.tm-history-count { padding:7px 10px; border:1px solid #e7e8f3; border-radius:9px; color:#6c7390; background:#fff; font-size:10px; font-weight:750; white-space:nowrap; }
.tm-history-list { padding:5px 0 25px; }
.tm-history-group { display:grid; grid-template-columns:175px minmax(0,1fr); gap:20px; }
.tm-month-rail { position:relative; display:flex; align-items:flex-start; gap:11px; padding-top:12px; }
.tm-month-dot { width:11px; height:11px; flex:none; margin-top:2px; border:3px solid #e4e2ff; border-radius:50%; background:#665be5; box-shadow:0 0 0 4px #f3f1ff; }
.tm-month-rail h2 { color:#68758f; font-size:12px; font-weight:800; }
.tm-month-line { position:absolute; top:33px; bottom:-2px; left:5px; width:1px; background:#e4e7f2; }
.tm-history-items { position:relative; padding-bottom:22px; }
.tm-history-items::before { position:absolute; top:23px; bottom:0; left:0; width:1px; background:#e2e6f2; content:""; }
.tm-history-item { position:relative; display:grid; grid-template-columns:75px minmax(0,1fr); gap:17px; padding-bottom:16px; }
.tm-history-item:last-child { padding-bottom:0; }
.tm-item-connector { position:absolute; top:24px; left:-4px; width:9px; height:9px; border:2px solid #fff; border-radius:50%; background:#9589f0; box-shadow:0 0 0 1px #e0ddff; }
.tm-history-date { display:flex; flex-direction:column; gap:4px; padding-top:15px; color:#8b95aa; text-align:right; }
.tm-history-date strong { color:#3c4968; font-size:18px; line-height:1; }
.tm-history-date span,.tm-history-date time { font-size:10px; }
.tm-history-card { display:block; min-width:0; padding:19px 21px; overflow-wrap:anywhere; border:1px solid #e8eaf3; border-radius:16px; background:#fff; box-shadow:0 5px 20px #26345d05; text-decoration:none; transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease; }
.tm-history-card:hover { transform:translateY(-2px); border-color:#d4d0ff; box-shadow:0 13px 30px #38345d0d; }
.tm-history-card:focus-visible,.tm-button:focus-visible,.tm-nav a:focus-visible { outline:3px solid #b8b2ff; outline-offset:3px; }
.tm-history-card-head { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; }
.tm-history-source,.tm-history-star,.tm-category-badge,.tm-history-deadline { display:inline-flex; align-items:center; border-radius:7px; font-size:10px; font-weight:750; }
.tm-history-source { padding:5px 8px; color:#4b6bc8; background:#eef3ff; }
.tm-history-star { padding:5px 8px; color:#a9761c; background:#fff6e3; }
.tm-history-card h3 { margin-top:12px; color:#273451; font-size:15px; font-weight:780; letter-spacing:-.2px; line-height:1.5; }
.tm-memory-summary { margin-top:7px; color:#7e8aa2; font-size:12px; line-height:1.8; overflow-wrap:anywhere; }
.tm-history-card-footer { display:flex; flex-wrap:wrap; align-items:center; gap:9px; margin-top:15px; padding-top:12px; border-top:1px solid #f0f1f7; }
.tm-category-badge { padding:5px 8px; color:#748097; background:#f3f4fa; }
.tm-history-deadline { padding:5px 8px; color:#a8741b; background:#fff5df; }
.tm-view-memory { margin-left:auto; color:#5e55db; font-size:11px; font-weight:750; }
@keyframes tm-float { 0%,100% { transform:perspective(1200px) rotateY(-4deg) rotateX(2deg) translateY(0); } 50% { transform:perspective(1200px) rotateY(-4deg) rotateX(2deg) translateY(-7px); } }
@keyframes tm-float-card { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
@media (max-width:1000px) {
  .tm-public-hero { grid-template-columns:minmax(0,1fr) minmax(320px,.85fr); gap:28px; }
  .tm-hero-copy h1 { letter-spacing:-2.4px; }
  .tm-dashboard-summary { align-items:flex-start; flex-direction:column; }
  .tm-dashboard-stats { padding-left:70px; }
  .tm-history-group { grid-template-columns:145px minmax(0,1fr); gap:14px; }
}
@media (max-width:720px) {
  .tm-nav { flex-wrap:wrap; gap:14px; }
  .tm-nav-links { order:3; width:100%; justify-content:center; gap:25px; padding-top:5px; }
  .tm-nav-actions { gap:13px; }
  .tm-public-hero { grid-template-columns:minmax(0,1fr); padding-top:50px; padding-bottom:65px; }
  .tm-hero-copy h1 { font-size:clamp(40px,9vw,58px); }
  .tm-preview-wrap { width:min(100%,520px); margin:0 auto; }
  .tm-feature-grid { grid-template-columns:1fr; max-width:520px; }
  .tm-feature-section { padding-top:52px; padding-bottom:60px; }
  .tm-how-section { grid-template-columns:1fr; padding-top:58px; padding-bottom:60px; }
  .tm-dashboard-topline { align-items:flex-start; flex-direction:column; }
  .tm-dashboard-summary { padding:22px; }
  .tm-dashboard-stats { padding-left:0; gap:24px; }
  .tm-history-group { grid-template-columns:minmax(0,1fr); gap:10px; }
  .tm-month-rail { padding-top:8px; }
  .tm-month-line { display:none; }
}
@media (max-width:480px) {
  .tm-timeline-page { padding:16px 12px 28px; }
  .tm-public { border-radius:14px; }
  .tm-nav { padding:17px 16px; }
  .tm-brand { font-size:17px; }
  .tm-nav-links { gap:17px; }
  .tm-nav-links a,.tm-login-link { font-size:11px; }
  .tm-nav-actions .tm-button { min-height:36px; padding:0 11px; font-size:10px; }
  .tm-public-hero { padding:39px 17px 48px; }
  .tm-hero-copy h1 { letter-spacing:-1.8px; }
  .tm-hero-description { font-size:13px; }
  .tm-hero-actions { align-items:stretch; flex-direction:column; }
  .tm-hero-actions .tm-button { width:100%; }
  .tm-preview-wrap { padding:12px 0; }
  .tm-float-top { right:-3px; }
  .tm-float-bottom { left:-3px; }
  .tm-float-card { padding:9px 10px; }
  .tm-float-card strong { font-size:9px; }
  .tm-float-card small { font-size:8px; }
  .tm-preview-content { padding:18px 13px; }
  .tm-preview-stat-row>div { padding:9px 8px; }
  .tm-feature-card { padding:22px; }
  .tm-footer { align-items:flex-start; flex-direction:column; }
  .tm-summary-copy { align-items:flex-start; }
  .tm-summary-mark { width:43px; height:43px; flex-basis:43px; border-radius:13px; font-size:19px; }
  .tm-dashboard-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); width:100%; gap:10px; }
  .tm-dashboard-stats strong { font-size:22px; }
  .tm-dashboard-stats span { white-space:normal; font-size:9px; }
  .tm-history-toolbar { align-items:flex-start; }
  .tm-history-item { grid-template-columns:42px minmax(0,1fr); gap:10px; }
  .tm-history-date strong { font-size:16px; }
  .tm-history-date span,.tm-history-date time { font-size:9px; }
  .tm-history-card { padding:15px; }
  .tm-history-card h3 { font-size:14px; }
  .tm-memory-summary { font-size:11px; }
  .tm-view-memory { margin-left:0; }
}
@media (prefers-reduced-motion:reduce) {
  .tm-button,.tm-feature-card,.tm-history-card,.tm-preview-window,.tm-float-card { transition:none; animation:none; }
  .tm-button:hover,.tm-feature-card:hover,.tm-history-card:hover { transform:none; }
}
`;
