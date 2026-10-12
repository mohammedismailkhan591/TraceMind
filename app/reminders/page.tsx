"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

type Memory = {
  id: string;
  title: string;
  summary: string | null;
  deadline: string | null;
  category: string | null;
  source_type: string | null;
};

type Reminder = {
  id: string;
  title: string;
  reminder_at: string;
  completed: boolean;
  memory_id: string | null;
  reminder_kind: string | null;
};

const REMINDER_WINDOWS = [
  {
    kind: "24h",
    label: "24 hours before",
    milliseconds: 24 * 60 * 60 * 1000,
  },
  {
    kind: "7h",
    label: "7 hours before",
    milliseconds: 7 * 60 * 60 * 1000,
  },
  {
    kind: "1h",
    label: "1 hour before",
    milliseconds: 60 * 60 * 1000,
  },
];

export default function RemindersPage() {
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);

  const [memories, setMemories] = useState<Memory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [error, setError] = useState("");

  const [filter, setFilter] = useState<
    "upcoming" | "completed" | "all"
  >("upcoming");

  const [search, setSearch] = useState("");

  /* =========================
     LOAD USER
  ========================= */

  const loadUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(session.user.id);
  }, [supabase]);

  /* =========================
     LOAD MEMORIES
  ========================= */

  const loadMemories = useCallback(
    async (uid: string) => {
      const { data, error } = await supabase
        .from("memories")
        .select(
          "id,title,summary,deadline,category,source_type"
        )
        .eq("user_id", uid)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setMemories((data || []) as Memory[]);
    },
    [supabase]
  );

  /* =========================
     LOAD REMINDERS
  ========================= */

  const loadReminders = useCallback(
    async (uid: string) => {
      const { data, error } = await supabase
        .from("reminders")
        .select(
          "id,title,reminder_at,completed,memory_id,reminder_kind"
        )
        .eq("user_id", uid)
        .order("reminder_at", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setReminders((data || []) as Reminder[]);
    },
    [supabase]
  );

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session?.user) {
          setUserId(null);
          setLoading(false);
          return;
        }

        const uid = session.user.id;

        setUserId(uid);

        await Promise.all([
          loadMemories(uid),
          loadReminders(uid),
        ]);

        if (mounted) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error(err);

        if (mounted) {
          setError(
            err?.message ||
              "Could not load reminders."
          );

          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [
    supabase,
    loadMemories,
    loadReminders,
  ]);

  /* =========================
     SYNC REMINDERS
  ========================= */

  const syncReminders = useCallback(
    async (uid: string, memoryList: Memory[]) => {
      setSyncing(true);
      setError("");

      try {
        const now = Date.now();

        // Remove obsolete schedules from older TraceMind builds so a deadline
        // can never accidentally keep a 7-day notification.
        const { error: obsoleteError } = await supabase
          .from("reminders")
          .delete()
          .eq("user_id", uid)
          .in("reminder_kind", ["7_days", "7d"]);

        if (obsoleteError) {
          throw obsoleteError;
        }

        const memoriesWithDeadlines =
          memoryList.filter((memory) => {
            if (!memory.deadline) {
              return false;
            }

            const deadlineTime = new Date(
              memory.deadline
            ).getTime();

            return (
              Number.isFinite(deadlineTime) &&
              deadlineTime > now
            );
          });

        for (const memory of memoriesWithDeadlines) {
          const deadlineTime = new Date(
            memory.deadline as string
          ).getTime();

          for (const window of REMINDER_WINDOWS) {
            const reminderTime =
              deadlineTime -
              window.milliseconds;

            if (reminderTime <= now) {
              continue;
            }

            /*
             * We deliberately do NOT use upsert/onConflict.
             * This avoids the constraint error you had earlier.
             */

            const { data: existing, error: findError } =
              await supabase
                .from("reminders")
                .select("id")
                .eq("user_id", uid)
                .eq("memory_id", memory.id)
                .eq(
                  "reminder_kind",
                  window.kind
                )
                .maybeSingle();

            if (findError) {
              throw findError;
            }

            const reminderTitle =
              memory.title +
              " · " +
              window.label;

            if (existing?.id) {
              const { error: updateError } =
                await supabase
                  .from("reminders")
                  .update({
                    title: reminderTitle,
                    reminder_at:
                      new Date(
                        reminderTime
                      ).toISOString(),
                  })
                  .eq(
                    "id",
                    existing.id
                  )
                  .eq(
                    "user_id",
                    uid
                  );

              if (updateError) {
                throw updateError;
              }
            } else {
              const { error: insertError } =
                await supabase
                  .from("reminders")
                  .insert({
                    user_id: uid,
                    memory_id:
                      memory.id,
                    title: reminderTitle,
                    reminder_at:
                      new Date(
                        reminderTime
                      ).toISOString(),
                    completed: false,
                    reminder_kind:
                      window.kind,
                  });

              if (insertError) {
                throw insertError;
              }
            }
          }
        }

        await loadReminders(uid);
      } catch (err: any) {
        console.error(
          "Reminder sync error:",
          err
        );

        setError(
          err?.message ||
            "Reminder schedule could not be synced."
        );
      } finally {
        setSyncing(false);
      }
    },
    [supabase, loadReminders]
  );

  /* =========================
     RUN SYNC ONCE
  ========================= */

  useEffect(() => {
    if (!userId || loading) {
      return;
    }

    if (memories.length === 0) {
      return;
    }

    syncReminders(userId, memories);

    // Intentionally run once after initial data load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loading]);

  /* =========================
     MEMORY LOOKUP
  ========================= */

  const memoryMap = useMemo(() => {
    const map = new Map<string, Memory>();

    memories.forEach((memory) => {
      map.set(memory.id, memory);
    });

    return map;
  }, [memories]);

  /* =========================
     FILTER
  ========================= */

  const visibleReminders = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    return reminders.filter((reminder) => {
      if (
        filter === "upcoming" &&
        reminder.completed
      ) {
        return false;
      }

      if (
        filter === "completed" &&
        !reminder.completed
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      const memory = reminder.memory_id
        ? memoryMap.get(
            reminder.memory_id
          )
        : null;

      const text = [
        reminder.title,
        memory?.title || "",
        memory?.summary || "",
        memory?.category || "",
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [
    reminders,
    filter,
    search,
    memoryMap,
  ]);

  /* =========================
     NEXT REMINDER
  ========================= */

  const nextReminder = useMemo(() => {
    return reminders.find(
      (reminder) =>
        !reminder.completed &&
        new Date(
          reminder.reminder_at
        ).getTime() > Date.now()
    );
  }, [reminders]);

  /* =========================
     COMPLETE
  ========================= */

  async function toggleCompleted(
    reminder: Reminder
  ) {
    if (!userId) return;

    const { error } =
      await supabase
        .from("reminders")
        .update({
          completed:
            !reminder.completed,
        })
        .eq("id", reminder.id)
        .eq("user_id", userId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadReminders(userId);
  }

  /* =========================
     DELETE
  ========================= */

  async function deleteReminder(
    reminder: Reminder
  ) {
    if (!userId) return;

    const { error } =
      await supabase
        .from("reminders")
        .delete()
        .eq("id", reminder.id)
        .eq("user_id", userId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadReminders(userId);
  }

  /* =========================
     FORMAT DATE
  ========================= */

  function formatDate(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    ).format(new Date(value));
  }

  /* =========================
     TIME UNTIL
  ========================= */

  function timeUntil(
    value: string
  ) {
    const difference =
      new Date(value).getTime() -
      Date.now();

    if (difference <= 0) {
      return "Due";
    }

    const minutes = Math.floor(
      difference / 60000
    );

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h`;
    }

    const days = Math.floor(
      hours / 24
    );

    return `${days}d`;
  }

  /* =========================
     NOT LOGGED IN
  ========================= */

  if (loading) {
    return (
      <main className="tm-public-loading" aria-live="polite">
        <div className="tm-loading-mark">T</div>
        <p>Getting TraceMind ready…</p>
        <style jsx>{`
          .tm-public-loading{min-height:100vh;display:grid;place-content:center;justify-items:center;background:#f8faff;color:#667085;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
          .tm-loading-mark{display:grid;place-items:center;width:48px;height:48px;border-radius:16px;background:#6958f5;color:#fff;font-weight:850;font-size:24px;box-shadow:0 10px 28px rgba(105,88,245,.2)}
          .tm-public-loading p{font-size:14px;margin-top:15px}
        `}</style>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="tm-landing">
        <nav className="tm-nav">
          <Link href="/" className="tm-brand" aria-label="TraceMind home">
            <span className="tm-brand-mark">T</span>
            <span className="tm-brand-name"><span className="tm-brand-trace">Trace</span><span className="tm-brand-mind">Mind</span></span>
          </Link>
          <div className="tm-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#about">About</a>
          </div>
          <div className="tm-nav-actions">
            <Link href="/login" className="tm-login">Log in</Link>
            <Link href="/signup" className="tm-nav-cta">Get started <span aria-hidden="true">↗</span></Link>
          </div>
        </nav>

        <section className="tm-hero" id="about">
          <div className="tm-hero-copy">
            <div className="tm-eyebrow"><span className="tm-eyebrow-dot" /> YOUR SECOND BRAIN, IN SYNC</div>
            <h1>Never lose track<br />of <span>what matters.</span></h1>
            <p className="tm-hero-description">Your ideas, deadlines, and important moments deserve a place you can find again. Keep everything organized with TraceMind Reminders.</p>
            <div className="tm-hero-actions">
              <Link href="/signup" className="tm-primary-cta">Get started free <span aria-hidden="true">→</span></Link>
              <a href="#features" className="tm-secondary-cta"><span className="tm-play-icon">▶</span> Explore TraceMind</a>
            </div>
            <div className="tm-trust-row"><div className="tm-avatar-stack"><span>✓</span><span>✦</span><span>∞</span></div><p><strong>Your life, a little more organized.</strong><br />Private by design. Made for your mind.</p></div>
          </div>

          <div className="tm-hero-visual" aria-label="Illustration of a TraceMind reminder dashboard">
            <div className="tm-orbit tm-orbit-one" /><div className="tm-orbit tm-orbit-two" />
            <div className="tm-glow" />
            <div className="tm-float-note tm-note-top"><span className="tm-note-icon purple">✦</span><div><strong>Memory saved</strong><small>Everything in its place</small></div><span className="tm-note-check">✓</span></div>
            <div className="tm-preview-window">
              <div className="tm-preview-top"><div className="tm-window-dots"><i /><i /><i /></div><span>tracemind / reminders</span><span className="tm-live-pill"><i /> LIVE PREVIEW</span></div>
              <div className="tm-preview-body">
                <div className="tm-preview-heading"><div><small>MONDAY, YOUR WAY</small><h3>Good things, on time.</h3></div><span className="tm-preview-calendar">▦</span></div>
                <div className="tm-preview-summary"><div><span className="tm-summary-icon blue">◷</span><div><small>UP NEXT</small><strong>Project check-in</strong></div></div><span className="tm-time-pill">in 2 hours</span></div>
                <div className="tm-preview-list-title">COMING UP <span>VIEW ALL ↗</span></div>
                <div className="tm-preview-item"><span className="tm-item-check purple-check">✦</span><div><strong>Review project notes</strong><small>Today · 2:30 PM</small></div><span className="tm-item-tag">WORK</span></div>
                <div className="tm-preview-item"><span className="tm-item-check green-check">✓</span><div><strong>Call with the team</strong><small>Today · 4:00 PM</small></div><span className="tm-item-tag green-tag">MEETING</span></div>
                <div className="tm-preview-item"><span className="tm-item-check orange-check">↗</span><div><strong>Submit final assignment</strong><small>Tomorrow · 10:00 AM</small></div><span className="tm-item-tag orange-tag">DEADLINE</span></div>
                <div className="tm-preview-footer"><span className="tm-footer-spark">✦</span> Your memories and deadlines, together.</div>
              </div>
            </div>
            <div className="tm-float-note tm-note-bottom"><span className="tm-note-bell">♧</span><div><strong>Deadline protected</strong><small>Gentle reminders, right on time</small></div></div>
          </div>
        </section>

        <section className="tm-feature-section" id="features">
          <div className="tm-section-heading"><span>LESS TO REMEMBER. MORE ROOM TO LIVE.</span><h2>Your mind has better things to do.</h2><p>TraceMind helps you keep the important stuff close, without keeping it all in your head.</p></div>
          <div className="tm-feature-grid">
            <article className="tm-feature-card"><div className="tm-feature-icon blue-feature">◷</div><span className="tm-card-kicker">01 / STAY AHEAD</span><h3>Upcoming reminders</h3><p>See what’s next at a glance and give every important task the attention it deserves.</p><div className="tm-mini-timeline"><span /><div><strong>Project check-in</strong><small>Today, 2:30 PM</small></div><b>2h</b></div></article>
            <article className="tm-feature-card"><div className="tm-feature-icon violet-feature">✳</div><span className="tm-card-kicker">02 / FEEL PREPARED</span><h3>Smart deadlines</h3><p>Keep deadlines visible with timely checkpoints, so last-minute surprises become less likely.</p><div className="tm-deadline-bars"><span><i />24 hours before</span><span><i />7 hours before</span><span><i />1 hour before</span></div></article>
            <article className="tm-feature-card"><div className="tm-feature-icon mint-feature">⌘</div><span className="tm-card-kicker">03 / FIND IT AGAIN</span><h3>Personal memory</h3><p>Bring saved notes and meaningful details together, ready when you need them.</p><div className="tm-memory-chips"><span>Ideas</span><span>Notes</span><span>Moments</span></div></article>
          </div>
        </section>

        <section className="tm-how-section" id="how-it-works"><div><span className="tm-section-label">A CALMER WAY TO KEEP UP</span><h2>Capture it once.<br /><em>Find it when it counts.</em></h2></div><div className="tm-how-steps"><div><span>01</span><section><strong>Save what matters</strong><p>Keep your ideas, notes, and important details together.</p></section></div><div><span>02</span><section><strong>Set your reminders</strong><p>Connect a deadline and keep the next step in view.</p></section></div><div><span>03</span><section><strong>Get back to your life</strong><p>Spend less energy remembering and more energy doing.</p></section></div></div></section>

        <section className="tm-bottom-cta"><div><span className="tm-section-label">MAKE SPACE FOR WHAT MATTERS</span><h2>A little less mental clutter<br />starts right here.</h2><p>Start building a calmer, more organized personal memory.</p></div><Link href="/signup" className="tm-primary-cta">Get started for free <span aria-hidden="true">→</span></Link></section>
        <footer className="tm-footer"><Link href="/" className="tm-brand"><span className="tm-brand-mark">T</span><span className="tm-brand-name"><span className="tm-brand-trace">Trace</span><span className="tm-brand-mind">Mind</span></span></Link><p>Keep what matters. Find it when it counts.</p><span>© {new Date().getFullYear()} TraceMind</span></footer>

        <style jsx>{`
          .tm-landing{--ink:#18223b;--muted:#707b91;--blue:#365cf5;--line:#e9edf5;min-height:100vh;background:#fbfcff;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}
          .tm-landing *{box-sizing:border-box}.tm-nav{max-width:1240px;height:84px;margin:auto;padding:0 34px;display:flex;align-items:center;justify-content:space-between;gap:28px;border-bottom:1px solid #edf0f6}
          .tm-brand{display:inline-flex;align-items:center;gap:10px;color:#171717;text-decoration:none;font-size:20px;font-weight:750;letter-spacing:-.8px;white-space:nowrap}.tm-brand-mark{display:grid;place-items:center;width:35px;height:35px;flex-shrink:0;border-radius:12px;background:#6958f5;color:#fff;font-size:19px;font-weight:750;box-shadow:0 6px 15px rgba(105,88,245,.24)}.tm-brand-name{display:inline-flex;align-items:center}.tm-brand-trace{color:#171717;font-weight:750}.tm-brand-mind{color:#6958f5;font-weight:750}
          .tm-nav-links,.tm-nav-actions{display:flex;align-items:center;gap:29px}.tm-nav-links a,.tm-login{font-size:13px;color:#626e85;text-decoration:none;transition:color .2s}.tm-nav-links a:hover,.tm-login:hover{color:var(--blue)}.tm-nav-actions{gap:22px}.tm-nav-cta{display:inline-flex;align-items:center;gap:12px;background:#365cf5;color:#fff;text-decoration:none;padding:12px 16px;border-radius:11px;font-size:12px;font-weight:750;box-shadow:0 7px 18px #365cf52b;transition:transform .2s,box-shadow .2s}.tm-nav-cta:hover,.tm-primary-cta:hover{transform:translateY(-2px);box-shadow:0 12px 24px #365cf538}
          .tm-hero{max-width:1240px;margin:0 auto;padding:90px 34px 98px;display:grid;grid-template-columns:.94fr 1.06fr;align-items:center;gap:44px;min-height:620px}.tm-hero-copy{position:relative;z-index:2;padding-bottom:12px}.tm-eyebrow,.tm-section-label{display:inline-flex;align-items:center;gap:9px;font-size:10px;letter-spacing:1.6px;font-weight:800;color:#596887}.tm-eyebrow{padding:9px 12px;border:1px solid #e5eaff;border-radius:30px;background:#f5f7ff}.tm-eyebrow-dot{width:7px;height:7px;background:#5270fa;border-radius:50%;box-shadow:0 0 0 4px #5270fa18}.tm-hero h1{font-size:clamp(45px,5.1vw,68px);line-height:1.06;letter-spacing:-3.7px;margin:25px 0 22px;font-weight:830;color:#18223b}.tm-hero h1 span{color:#4163f4}.tm-hero-description{max-width:490px;font-size:15px;line-height:1.9;color:#748096;margin:0}.tm-hero-actions{display:flex;align-items:center;gap:22px;margin-top:31px;flex-wrap:wrap}.tm-primary-cta{display:inline-flex;align-items:center;justify-content:center;gap:18px;padding:15px 19px;border-radius:12px;background:#365cf5;color:#fff;text-decoration:none;font-size:13px;font-weight:750;box-shadow:0 8px 19px #365cf52b;transition:transform .2s,box-shadow .2s}.tm-secondary-cta{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:#45516a;font-size:12px;font-weight:700}.tm-play-icon{display:grid;place-items:center;width:29px;height:29px;border:1px solid #dce2f1;border-radius:50%;font-size:9px;color:#365cf5;background:#fff}.tm-trust-row{display:flex;align-items:center;gap:13px;margin-top:39px}.tm-avatar-stack{display:flex;padding-left:4px}.tm-avatar-stack span{display:grid;place-items:center;width:29px;height:29px;margin-left:-4px;border:2px solid #fbfcff;border-radius:50%;background:#e9edff;color:#365cf5;font-size:12px;font-weight:800}.tm-avatar-stack span:nth-child(2){background:#e1f6ef;color:#21866a}.tm-avatar-stack span:nth-child(3){background:#fff0dd;color:#b8792c}.tm-trust-row p{font-size:10px;line-height:1.7;color:#8b94a7;margin:0}.tm-trust-row strong{font-size:11px;color:#515e77;font-weight:750}
          .tm-hero-visual{min-width:0;position:relative;min-height:465px;display:flex;align-items:center;justify-content:center}.tm-glow{position:absolute;width:78%;height:76%;border-radius:50%;background:radial-gradient(ellipse,#e6eaff 0%,#f1f3ff 42%,transparent 72%);filter:blur(9px)}.tm-orbit{position:absolute;border:1px solid #dfe5ff;border-radius:50%;transform:rotate(-18deg)}.tm-orbit-one{width:97%;height:72%}.tm-orbit-two{width:85%;height:94%;transform:rotate(37deg);border-color:#edf0ff}.tm-preview-window{position:relative;z-index:1;width:min(100%,500px);border:1px solid #e2e7f3;border-radius:19px;background:#fff;overflow:hidden;box-shadow:0 28px 75px #2b3e7a1b,0 4px 14px #2b3e7a0b;transform:rotate(-1.2deg);animation:tm-float 6s ease-in-out infinite}.tm-preview-top{height:43px;padding:0 15px;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fcfdff;border-bottom:1px solid #edf0f6;color:#a1a9ba;font-size:9px}.tm-window-dots{display:flex;gap:4px}.tm-window-dots i{width:6px;height:6px;border-radius:50%;background:#d7dce8}.tm-window-dots i:first-child{background:#ffb5ad}.tm-window-dots i:nth-child(2){background:#ffd58a}.tm-window-dots i:nth-child(3){background:#9edbc1}.tm-live-pill{display:flex;align-items:center;gap:5px;font-size:8px;color:#7885a1;letter-spacing:.5px}.tm-live-pill i{width:5px;height:5px;background:#3dc79a;border-radius:50%}.tm-preview-body{padding:25px 25px 15px}.tm-preview-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:19px}.tm-preview-heading small,.tm-summary-icon+div small{font-size:8px;letter-spacing:1.3px;color:#929cb1;font-weight:800}.tm-preview-heading h3{font-size:20px;letter-spacing:-.6px;margin:7px 0 0;color:#25314e}.tm-preview-calendar{display:grid;place-items:center;width:37px;height:37px;border-radius:11px;background:#f0f3ff;color:#4263f5;font-size:20px}.tm-preview-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px;border:1px solid #e8edff;border-radius:13px;background:linear-gradient(105deg,#f7f8ff,#fff)}.tm-preview-summary>div{display:flex;align-items:center;gap:11px}.tm-summary-icon{display:grid;place-items:center;width:35px;height:35px;border-radius:10px;font-size:18px}.tm-summary-icon.blue{background:#e8edff;color:#4564f4}.tm-preview-summary small,.tm-preview-summary strong{display:block}.tm-preview-summary strong{font-size:11px;color:#34405b;margin-top:4px}.tm-time-pill{font-size:9px;color:#4764e9;background:#edf0ff;padding:6px 8px;border-radius:7px;white-space:nowrap}.tm-preview-list-title{display:flex;justify-content:space-between;margin:21px 0 9px;color:#8993a8;font-size:8px;letter-spacing:1px;font-weight:800}.tm-preview-list-title span{color:#5570eb}.tm-preview-item{display:flex;align-items:center;gap:11px;padding:12px 0;border-bottom:1px solid #f0f2f7}.tm-item-check{display:grid;place-items:center;width:29px;height:29px;flex-shrink:0;border-radius:9px;font-size:12px}.purple-check{background:#f0eaff;color:#8b69df}.green-check{background:#e5f8ef;color:#2aab7e}.orange-check{background:#fff1df;color:#c9862d}.tm-preview-item>div{min-width:0;flex:1}.tm-preview-item strong,.tm-preview-item small{display:block}.tm-preview-item strong{font-size:10px;color:#3b4660;font-weight:750}.tm-preview-item small{font-size:9px;color:#9aa3b4;margin-top:5px}.tm-item-tag{font-size:7px;letter-spacing:.6px;color:#7e88a1;background:#f3f5f9;border-radius:5px;padding:5px 6px}.green-tag{color:#288a69;background:#e9f8f1}.orange-tag{color:#b17b32;background:#fff5e7}.tm-preview-footer{display:flex;align-items:center;gap:7px;padding-top:14px;color:#8a94aa;font-size:9px}.tm-footer-spark{color:#6d7ef5}.tm-float-note{position:absolute;z-index:2;display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid #e8ebf4;border-radius:13px;background:#ffffffed;box-shadow:0 14px 35px #283b7817;backdrop-filter:blur(10px);animation:tm-float-note 5s ease-in-out infinite}.tm-float-note strong,.tm-float-note small{display:block}.tm-float-note strong{font-size:10px;color:#34405a}.tm-float-note small{font-size:9px;color:#9aa3b3;margin-top:4px}.tm-note-top{top:23px;right:-5px}.tm-note-bottom{bottom:18px;left:-17px;animation-delay:-2s}.tm-note-icon,.tm-note-bell{display:grid;place-items:center;width:31px;height:31px;border-radius:9px;background:#eee9ff;color:#8566d9}.tm-note-check{display:grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#e3f8ee;color:#2ba879;font-size:10px}.tm-note-bell{background:#e9efff;color:#4567ed;font-size:16px}
          .tm-feature-section{padding:76px 34px 93px;background:#fff;border-top:1px solid #f0f2f7}.tm-section-heading{text-align:center;max-width:660px;margin:0 auto 38px}.tm-section-heading>span{font-size:9px;font-weight:850;letter-spacing:1.8px;color:#6576ca}.tm-section-heading h2{font-size:clamp(28px,3.3vw,39px);letter-spacing:-1.7px;color:#202b46;margin:14px 0 11px}.tm-section-heading p{font-size:13px;color:#8490a4;line-height:1.8;margin:0}.tm-feature-grid{max-width:1120px;margin:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.tm-feature-card{padding:25px 23px 21px;border:1px solid #e9edf5;border-radius:17px;background:#fff;box-shadow:0 8px 30px #293e7605;transition:transform .25s,border-color .25s,box-shadow .25s}.tm-feature-card:hover{transform:translateY(-5px);border-color:#dce3ff;box-shadow:0 18px 40px #293e760b}.tm-feature-icon{display:grid;place-items:center;width:43px;height:43px;border-radius:13px;font-size:22px;margin-bottom:22px}.blue-feature{background:#eaf0ff;color:#4264f3}.violet-feature{background:#f0eaff;color:#8964d6}.mint-feature{background:#e6f8f0;color:#229a71}.tm-card-kicker{font-size:8px;letter-spacing:1.5px;font-weight:850;color:#a0a8b8}.tm-feature-card h3{font-size:17px;letter-spacing:-.4px;color:#26324c;margin:10px 0 9px}.tm-feature-card>p{font-size:11px;line-height:1.8;color:#8791a5;min-height:60px;margin:0 0 22px}.tm-mini-timeline{display:flex;align-items:center;gap:10px;padding:12px;border-radius:11px;background:#f8f9ff}.tm-mini-timeline>span{width:7px;height:7px;border-radius:50%;background:#5571f7;box-shadow:0 0 0 4px #e3e9ff}.tm-mini-timeline>div{flex:1}.tm-mini-timeline strong,.tm-mini-timeline small{display:block}.tm-mini-timeline strong{font-size:9px;color:#47536e}.tm-mini-timeline small{font-size:8px;color:#9ba4b5;margin-top:4px}.tm-mini-timeline b{font-size:8px;color:#526cf1}.tm-deadline-bars{display:grid;gap:7px}.tm-deadline-bars span{display:flex;align-items:center;gap:8px;font-size:9px;color:#76829a;padding:6px 9px;border-radius:7px;background:#fafaff}.tm-deadline-bars i{width:6px;height:6px;border-radius:50%;background:#8063d5}.tm-deadline-bars span:nth-child(2) i{background:#5372f2}.tm-deadline-bars span:nth-child(3) i{background:#34b38a}.tm-memory-chips{display:flex;gap:7px;flex-wrap:wrap}.tm-memory-chips span{padding:8px 11px;border:1px solid #e9edf5;border-radius:8px;background:#fbfcff;color:#738099;font-size:9px}
          .tm-how-section{max-width:1120px;margin:auto;padding:87px 34px;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}.tm-how-section h2{font-size:clamp(30px,3.6vw,43px);line-height:1.17;letter-spacing:-1.8px;margin:16px 0;color:#202b46}.tm-how-section h2 em{font-style:normal;color:#4b68ef}.tm-how-steps{display:grid;gap:23px}.tm-how-steps>div{display:flex;gap:16px;align-items:flex-start}.tm-how-steps>div>span{display:grid;place-items:center;width:34px;height:34px;flex-shrink:0;border-radius:10px;background:#eef1ff;color:#526cf0;font-size:10px;font-weight:850}.tm-how-steps strong{font-size:13px;color:#35415b}.tm-how-steps p{font-size:11px;line-height:1.8;color:#8b95a8;margin:6px 0 0}.tm-bottom-cta{margin:0 34px 54px;padding:37px 43px;max-width:1172px;margin-left:auto;margin-right:auto;border:1px solid #e4e9ff;border-radius:20px;background:linear-gradient(115deg,#f1f4ff,#fafaff 65%,#f4f0ff);display:flex;align-items:center;justify-content:space-between;gap:25px}.tm-bottom-cta h2{font-size:clamp(24px,3vw,34px);line-height:1.2;letter-spacing:-1.2px;margin:12px 0;color:#202b46}.tm-bottom-cta p{font-size:11px;color:#7e89a0;margin:0}.tm-footer{max-width:1240px;margin:auto;padding:24px 34px 32px;border-top:1px solid #edf0f6;display:flex;align-items:center;justify-content:space-between;gap:20px}.tm-footer .tm-brand{font-size:16px}.tm-footer .tm-brand-mark{width:29px;height:29px;border-radius:9px;font-size:15px}.tm-footer p,.tm-footer>span{font-size:10px;color:#9aa3b4;margin:0}.tm-footer>span{white-space:nowrap}
          @keyframes tm-float{0%,100%{transform:translateY(0) rotate(-1.2deg)}50%{transform:translateY(-8px) rotate(-.3deg)}}@keyframes tm-float-note{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
          @media(max-width:900px){.tm-nav{padding:0 24px}.tm-nav-links{gap:17px}.tm-hero{padding:65px 24px 78px;gap:22px;grid-template-columns:1fr 1fr}.tm-hero h1{font-size:clamp(42px,5.5vw,56px);letter-spacing:-2.8px}.tm-hero-visual{min-height:400px}.tm-preview-body{padding:19px 17px 13px}.tm-note-top{right:-3px}.tm-note-bottom{left:-4px}.tm-feature-section{padding-left:24px;padding-right:24px}.tm-feature-card{padding:21px 18px}.tm-how-section{padding:72px 24px;gap:45px}}
          @media(max-width:680px){.tm-nav{height:70px;padding:0 18px}.tm-nav-links{display:none}.tm-nav-actions{gap:14px}.tm-nav-cta{padding:10px 12px}.tm-hero{grid-template-columns:1fr;padding:54px 22px 70px;gap:28px}.tm-hero-copy{padding:0}.tm-hero h1{font-size:clamp(43px,11vw,62px);letter-spacing:-2.7px;margin-top:22px}.tm-hero-description{font-size:14px}.tm-hero-visual{min-height:390px;margin:0 5px}.tm-preview-window{width:100%}.tm-note-top{right:-5px;top:5px}.tm-note-bottom{left:-6px;bottom:0}.tm-feature-section{padding:61px 20px 68px}.tm-feature-grid{grid-template-columns:1fr;max-width:440px}.tm-feature-card>p{min-height:0}.tm-how-section{grid-template-columns:1fr;gap:31px;padding:65px 22px}.tm-bottom-cta{margin:0 18px 38px;padding:27px 23px;align-items:flex-start;flex-direction:column}.tm-footer{padding:22px 20px 28px;flex-wrap:wrap}.tm-footer p{order:3;width:100%}}
          @media(max-width:390px){.tm-brand{font-size:17px}.tm-brand-mark{width:31px;height:31px}.tm-nav-actions{gap:10px}.tm-login{font-size:12px}.tm-nav-cta{font-size:11px;padding:9px}.tm-hero{padding-left:17px;padding-right:17px}.tm-hero-actions{gap:15px}.tm-primary-cta{padding:13px 14px}.tm-hero-visual{min-height:340px}.tm-preview-top{padding:0 9px}.tm-preview-body{padding:15px 12px 12px}.tm-preview-heading h3{font-size:17px}.tm-preview-item{gap:7px}.tm-item-tag{font-size:6px}.tm-float-note{padding:9px 10px}.tm-float-note small{font-size:8px}}
          @media(prefers-reduced-motion:reduce){.tm-preview-window,.tm-float-note{animation:none}.tm-feature-card,.tm-nav-cta,.tm-primary-cta{transition:none}}
        `}</style>
      </main>
    );
  }

  /* =========================
     PAGE
  ========================= */

  return (
    <>
      <div className="reminders-page">

        {/* HEADER */}

        <header className="page-header">
          <div>
            <p className="eyebrow">
              MEMORY SYSTEM
            </p>

            <h1>Reminders</h1>

            <p className="subtitle">
              Never lose track of something
              important again.
            </p>
          </div>

          <div className="sync-status">
            <span
              className={
                syncing
                  ? "status-dot syncing"
                  : "status-dot"
              }
            />

            {syncing
              ? "Syncing"
              : "Synced"}
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="error-box">
            <strong>
              Reminder sync issue
            </strong>

            <span>{error}</span>
          </div>
        )}

        {/* NEXT REMINDER */}

        {nextReminder && (
          <section className="next-card">

            <div className="next-left">

              <div className="next-icon">
                🔔
              </div>

              <div>
                <p className="next-label">
                  NEXT REMINDER
                </p>

                <h2>
                  {nextReminder.title}
                </h2>

                <p>
                  {formatDate(
                    nextReminder.reminder_at
                  )}
                </p>
              </div>

            </div>

            <div className="countdown">
              {timeUntil(
                nextReminder.reminder_at
              )}
            </div>

          </section>
        )}

        {/* STATS */}

        <section className="stats">

          <div className="stat-card">
            <span>Total</span>
            <strong>
              {reminders.length}
            </strong>
          </div>

          <div className="stat-card">
            <span>Upcoming</span>
            <strong>
              {
                reminders.filter(
                  (r) =>
                    !r.completed
                ).length
              }
            </strong>
          </div>

          <div className="stat-card">
            <span>Completed</span>
            <strong>
              {
                reminders.filter(
                  (r) =>
                    r.completed
                ).length
              }
            </strong>
          </div>

          <div className="stat-card">
            <span>Memories</span>
            <strong>
              {
                memories.filter(
                  (m) =>
                    m.deadline
                ).length
              }
            </strong>
          </div>

        </section>

        {/* DEADLINE SAFETY SCHEDULE */}

        <section className="deadline-safety" aria-label="Deadline reminder schedule">
          <div className="deadline-safety-copy">
            <span className="deadline-safety-icon">✓</span>
            <div>
              <strong>Deadline protection is active</strong>
              <p>Every deadline gets exactly three checkpoints: 24 hours, 7 hours, and 1 hour before it ends.</p>
            </div>
          </div>
          <div className="deadline-chips">
            <span>24h before</span>
            <span>7h before</span>
            <span>1h before</span>
          </div>
        </section>

        {/* CONTROLS */}

        <section className="controls">

          <div className="filters">

            <button
              className={
                filter === "upcoming"
                  ? "filter active"
                  : "filter"
              }
              onClick={() =>
                setFilter("upcoming")
              }
            >
              Upcoming
            </button>

            <button
              className={
                filter === "completed"
                  ? "filter active"
                  : "filter"
              }
              onClick={() =>
                setFilter("completed")
              }
            >
              Completed
            </button>

            <button
              className={
                filter === "all"
                  ? "filter active"
                  : "filter"
              }
              onClick={() =>
                setFilter("all")
              }
            >
              All
            </button>

          </div>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search reminders..."
            className="search-input"
          />

        </section>

        {/* LIST */}

        {loading ? (
          <div className="loading">
            Loading reminders...
          </div>
        ) : visibleReminders.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              {memories.some(
                (m) => m.deadline
              )
                ? "🔔"
                : "📅"}
            </div>

            <h2>
              {memories.some(
                (m) => m.deadline
              )
                ? "No reminders yet"
                : "No deadlines found"}
            </h2>

            <p>
              {memories.some(
                (m) => m.deadline
              )
                ? "Your upcoming reminders will appear here."
                : "Add a deadline to a saved memory and TraceMind will create reminders automatically."}
            </p>

            {!memories.some(
              (m) => m.deadline
            ) && (
              <a
                href="/memories"
                className="primary-button"
              >
                View memories
              </a>
            )}

          </div>

        ) : (

          <section className="reminder-list">

            {visibleReminders.map(
              (reminder) => {

                const memory =
                  reminder.memory_id
                    ? memoryMap.get(
                        reminder.memory_id
                      )
                    : null;

                return (
                  <article
                    key={reminder.id}
                    className={
                      reminder.completed
                        ? "reminder-card completed"
                        : "reminder-card"
                    }
                  >

                    <button
                      className="check-button"
                      onClick={() =>
                        toggleCompleted(
                          reminder
                        )
                      }
                      aria-label={
                        reminder.completed
                          ? "Mark incomplete"
                          : "Mark complete"
                      }
                    >
                      {reminder.completed
                        ? "✓"
                        : ""}
                    </button>

                    <div className="reminder-main">

                      <div className="reminder-top">

                        <div>
                          <h3>
                            {reminder.title}
                          </h3>

                          {memory && (
                            <p className="memory-name">
                              From memory:{" "}
                              {memory.title}
                            </p>
                          )}
                        </div>

                        <span className="kind">
                          {REMINDER_WINDOWS.find(
                            (w) =>
                              w.kind ===
                              reminder.reminder_kind
                          )?.label ||
                            "Reminder"}
                        </span>

                      </div>

                      <div className="reminder-meta">

                        <span>
                          🕐{" "}
                          {formatDate(
                            reminder.reminder_at
                          )}
                        </span>

                        {memory?.deadline && (
                          <span>
                            Deadline:{" "}
                            {formatDate(
                              memory.deadline
                            )}
                          </span>
                        )}

                      </div>

                    </div>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteReminder(
                          reminder
                        )
                      }
                      aria-label="Delete reminder"
                    >
                      ×
                    </button>

                  </article>
                );
              }
            )}

          </section>
        )}

      </div>

      <style>{`

        .reminders-page {
          width: 100%;
          max-width: 1180px;
          min-height: 100vh;
          margin: 0 auto;
          padding: 42px 48px 70px;
          box-sizing: border-box;
          color: #151922;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          margin-bottom: 28px;
        }

        .eyebrow {
          margin: 0 0 7px;
          color: #1769ff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        h1 {
          margin: 0;
          font-size: 34px;
          letter-spacing: -.04em;
        }

        .subtitle {
          margin: 8px 0 0;
          color: #7d8591;
          font-size: 14px;
        }

        .sync-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #e7eaf0;
          border-radius: 999px;
          background: white;
          color: #737b87;
          font-size: 11px;
          font-weight: 600;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #25a56a;
        }

        .status-dot.syncing {
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: .3;
          }
          50% {
            opacity: 1;
          }
        }

        .error-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px 16px;
          margin-bottom: 20px;
          border: 1px solid #f0d4d4;
          border-radius: 12px;
          background: #fff8f8;
          color: #a23b3b;
          font-size: 12px;
        }

        .next-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 25px;
          margin-bottom: 20px;
          border: 1px solid #dce8ff;
          border-radius: 18px;
          background: linear-gradient(
            135deg,
            #f5f9ff,
            #ffffff
          );
        }

        .next-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .next-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #e9f1ff;
          font-size: 21px;
        }

        .next-label {
          margin: 0 0 5px;
          color: #1769ff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .1em;
        }

        .next-card h2 {
          margin: 0;
          font-size: 17px;
          letter-spacing: -.02em;
        }

        .next-card p {
          margin: 5px 0 0;
          color: #7d8591;
          font-size: 11px;
        }

        .countdown {
          padding: 10px 14px;
          border-radius: 10px;
          background: #1769ff;
          color: white;
          font-size: 12px;
          font-weight: 750;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .stat-card {
          padding: 18px;
          border: 1px solid #e7eaf0;
          border-radius: 14px;
          background: white;
        }

        .stat-card span {
          display: block;
          color: #8a929d;
          font-size: 10px;
          font-weight: 600;
        }

        .stat-card strong {
          display: block;
          margin-top: 7px;
          font-size: 24px;
          letter-spacing: -.04em;
        }

        .deadline-safety {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin: 24px 0;
          padding: 18px 20px;
          border: 1px solid #dbeafe;
          border-radius: 16px;
          background: linear-gradient(135deg, #f8fbff 0%, #eff6ff 100%);
        }

        .deadline-safety-copy {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .deadline-safety-icon {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          border-radius: 10px;
          background: #2563eb;
          color: #fff;
          font-weight: 800;
        }

        .deadline-safety-copy strong {
          color: #102a56;
          font-size: 13px;
        }

        .deadline-safety-copy p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
        }

        .deadline-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          justify-content: flex-end;
        }

        .deadline-chips span {
          padding: 7px 9px;
          border: 1px solid #bfdbfe;
          border-radius: 999px;
          background: #fff;
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 750;
          white-space: nowrap;
        }

        .controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 16px;
        }

        .filters {
          display: flex;
          gap: 5px;
        }

        .filter {
          border: 0;
          padding: 9px 13px;
          border-radius: 9px;
          background: transparent;
          color: #7d8591;
          cursor: pointer;
          font-size: 11px;
          font-weight: 650;
        }

        .filter.active {
          background: #edf4ff;
          color: #1769ff;
        }

        .search-input {
          width: 230px;
          padding: 10px 13px;
          border: 1px solid #e2e6eb;
          border-radius: 10px;
          outline: none;
          background: white;
          color: #20242b;
          font-size: 11px;
        }

        .search-input:focus {
          border-color: #1769ff;
          box-shadow: 0 0 0 3px #1769ff12;
        }

        .reminder-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .reminder-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border: 1px solid #e7eaf0;
          border-radius: 14px;
          background: white;
          transition: .15s ease;
        }

        .reminder-card:hover {
          border-color: #d7dce4;
          transform: translateY(-1px);
        }

        .reminder-card.completed {
          opacity: .58;
        }

        .check-button {
          width: 25px;
          height: 25px;
          flex-shrink: 0;
          border: 1.5px solid #ccd2da;
          border-radius: 50%;
          background: white;
          color: #1769ff;
          cursor: pointer;
          font-weight: 800;
        }

        .completed .check-button {
          border-color: #1769ff;
          background: #1769ff;
          color: white;
        }

        .reminder-main {
          min-width: 0;
          flex: 1;
        }

        .reminder-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .reminder-top h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
        }

        .memory-name {
          margin: 4px 0 0;
          color: #9299a3;
          font-size: 10px;
        }

        .kind {
          flex-shrink: 0;
          padding: 5px 8px;
          border-radius: 7px;
          background: #f5f7fa;
          color: #747c88;
          font-size: 9px;
          font-weight: 650;
        }

        .reminder-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 8px;
          color: #8b929c;
          font-size: 10px;
        }

        .deadline-value {
          color: #1d4ed8;
          font-weight: 700;
        }

        .delete-button {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #a3aab4;
          cursor: pointer;
          font-size: 20px;
        }

        .delete-button:hover {
          background: #fff1f1;
          color: #c94a4a;
        }

        .loading {
          padding: 70px 20px;
          text-align: center;
          color: #8a929d;
          font-size: 13px;
        }

        .empty-state {
          padding: 75px 20px;
          border: 1px dashed #dce1e7;
          border-radius: 16px;
          background: white;
          text-align: center;
        }

        .empty-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          border-radius: 15px;
          background: #f1f4f8;
          font-size: 21px;
        }

        .empty-state h2 {
          margin: 0;
          font-size: 18px;
        }

        .empty-state p {
          max-width: 420px;
          margin: 8px auto 18px;
          color: #858d98;
          font-size: 12px;
          line-height: 1.6;
        }

        .primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 15px;
          border-radius: 9px;
          background: #1769ff;
          color: white;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
        }

        @media (max-width: 800px) {

          .deadline-safety {
            align-items: flex-start;
            flex-direction: column;
          }

          .deadline-chips {
            justify-content: flex-start;
          }

          .reminders-page {
            padding: 28px 20px 50px;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input {
            width: 100%;
          }

        }

        @media (max-width: 560px) {

          .page-header {
            flex-direction: column;
          }

          .next-card {
            align-items: flex-start;
            flex-direction: column;
          }

          .countdown {
            align-self: flex-start;
          }

          .reminder-top {
            flex-direction: column;
            gap: 8px;
          }

        }

      `}</style>
    </>
  );
}