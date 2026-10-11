"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { createClient } from "../lib/supabase";

type Memory = {
  id: string;
  title: string;
  category: string | null;
  source_type: string;
  created_at: string;
};

type Reminder = {
  id: string;
  title: string;
  reminder_at: string;
};

export default function HomePage() {
  const [name, setName] = useState("there");
  const [memoryCount, setMemoryCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHome();
  }, []);

  async function loadHome() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    /* PROFILE */

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.full_name) {
      setName(profile.full_name.split(" ")[0]);
    } else if (user.email) {
      setName(user.email.split("@")[0]);
    }

    /* MEMORY COUNT */

    const { count } = await supabase
      .from("memories")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id);

    setMemoryCount(count || 0);

    /* REMINDER COUNT */

    const now = new Date().toISOString();

    const { count: remindersTotal } = await supabase
      .from("reminders")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .eq("completed", false)
      .gte("reminder_at", now);

    setReminderCount(remindersTotal || 0);

    /* RECENT MEMORIES */

    const { data: recent } = await supabase
      .from("memories")
      .select(
        "id,title,category,source_type,created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(4);

    setMemories(recent || []);

    /* UPCOMING REMINDERS */

    const { data: upcoming } = await supabase
      .from("reminders")
      .select(
        "id,title,reminder_at"
      )
      .eq("user_id", user.id)
      .eq("completed", false)
      .gte("reminder_at", now)
      .order("reminder_at", {
        ascending: true,
      })
      .limit(3);

    setReminders(upcoming || []);

    setLoading(false);
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrapper}>

        {/* HEADER */}

        <header className={styles.header}>
          <div>
            <p className={styles.label}>
              PERSONAL INFORMATION SPACE
            </p>

            <h1>
              Welcome back, {name}.
            </h1>

            <p className={styles.intro}>
              Keep the things you discover, receive and
              want to remember within reach.
            </p>
          </div>

          <Link
            href="/capture"
            className={styles.capture}
          >
            <span>+</span>
            Capture
          </Link>
        </header>

        {/* OVERVIEW */}

        <section className={styles.overview}>

          <div className={styles.overviewItem}>
            <span>Saved information</span>

            <strong>
              {loading ? "—" : memoryCount}
            </strong>
          </div>

          <div className={styles.divider} />

          <div className={styles.overviewItem}>
            <span>Upcoming reminders</span>

            <strong>
              {loading ? "—" : reminderCount}
            </strong>
          </div>

          <div className={styles.divider} />

          <div className={styles.overviewItem}>
            <span>Your library</span>

            <Link href="/memories">
              Open memories →
            </Link>
          </div>

        </section>

        {/* MAIN */}

        <section className={styles.mainGrid}>

          {/* QUICK CAPTURE */}

          <div className={styles.section}>

            <div className={styles.sectionHeader}>
              <div>
                <p>QUICK CAPTURE</p>

                <h2>
                  Save something
                </h2>
              </div>
            </div>

            <div className={styles.captureList}>

              <Link
                href="/capture?type=image"
                className={styles.captureRow}
              >
                <div className={styles.rowIcon}>
                  IMG
                </div>

                <div>
                  <strong>
                    Screenshot or image
                  </strong>

                  <span>
                    Save something you saw.
                  </span>
                </div>

                <b>→</b>
              </Link>

              <Link
                href="/capture?type=pdf"
                className={styles.captureRow}
              >
                <div className={styles.rowIcon}>
                  PDF
                </div>

                <div>
                  <strong>
                    PDF or document
                  </strong>

                  <span>
                    Keep useful documents together.
                  </span>
                </div>

                <b>→</b>
              </Link>

              <Link
                href="/capture?type=link"
                className={styles.captureRow}
              >
                <div className={styles.rowIcon}>
                  URL
                </div>

                <div>
                  <strong>
                    Website or link
                  </strong>

                  <span>
                    Save where you found it.
                  </span>
                </div>

                <b>→</b>
              </Link>

              <Link
                href="/capture?type=text"
                className={styles.captureRow}
              >
                <div className={styles.rowIcon}>
                  TXT
                </div>

                <div>
                  <strong>
                    Text or message
                  </strong>

                  <span>
                    Keep important information.
                  </span>
                </div>

                <b>→</b>
              </Link>

            </div>

            <Link
              href="/capture"
              className={styles.primaryLink}
            >
              Open capture
              <span>→</span>
            </Link>

          </div>

          {/* REMINDERS */}

          <div className={styles.section}>

            <div className={styles.sectionHeader}>
              <div>
                <p>UPCOMING</p>

                <h2>
                  Reminders
                </h2>
              </div>

              <Link
                href="/reminders"
                className={styles.textLink}
              >
                View all
              </Link>
            </div>

            {reminders.length > 0 ? (
              <div className={styles.reminderList}>

                {reminders.map((item) => (
                  <Link
                    key={item.id}
                    href="/reminders"
                    className={styles.reminderRow}
                  >
                    <div className={styles.reminderDate}>
                      {getDay(item.reminder_at)}

                      <small>
                        {getMonth(item.reminder_at)}
                      </small>
                    </div>

                    <div>
                      <strong>
                        {item.title}
                      </strong>

                      <span>
                        {getTime(item.reminder_at)}
                      </span>
                    </div>

                    <b>→</b>
                  </Link>
                ))}

              </div>
            ) : (
              <div className={styles.empty}>
                <div className={styles.emptyTitle}>
                  No upcoming reminders
                </div>

                <p>
                  Important dates you add will appear
                  here.
                </p>

                <Link
                  href="/reminders"
                  className={styles.secondaryLink}
                >
                  Manage reminders
                </Link>
              </div>
            )}

          </div>

        </section>

        {/* RECENT */}

        <section className={styles.recentSection}>

          <div className={styles.recentHeader}>
            <div>
              <p>RECENT ACTIVITY</p>

              <h2>
                Recently saved
              </h2>
            </div>

            <Link
              href="/memories"
              className={styles.textLink}
            >
              View all
            </Link>
          </div>

          {memories.length > 0 ? (
            <div className={styles.memoryList}>

              {memories.map((memory) => (
                <Link
                  key={memory.id}
                  href={`/memories/${memory.id}`}
                  className={styles.memoryRow}
                >

                  <div className={styles.memoryTitle}>
                    <div className={styles.source}>
                      {sourceLabel(
                        memory.source_type
                      )}
                    </div>

                    <div>
                      <strong>
                        {memory.title}
                      </strong>

                      <span>
                        {memory.category ||
                          "Other"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.memoryDate}>
                    {formatDate(
                      memory.created_at
                    )}
                  </div>

                  <div className={styles.memoryArrow}>
                    →
                  </div>

                </Link>
              ))}

            </div>
          ) : (
            <div className={styles.noMemory}>
              <p>
                You haven't saved anything yet.
              </p>

              <Link
                href="/capture"
                className={styles.secondaryLink}
              >
                Capture your first item
              </Link>
            </div>
          )}

        </section>

        {/* BOTTOM */}

        <section className={styles.bottom}>

          <div>
            <span className={styles.bottomMark}>
              TRACEMIND
            </span>

            <h2>
              Don't remember where you saw it?
              <br />
              Save it now. Find it later.
            </h2>
          </div>

          <Link
            href="/capture"
            className={styles.bottomAction}
          >
            Start capturing
            <span>→</span>
          </Link>

        </section>

      </div>
    </main>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getDay(date: string) {
  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
    }
  );
}

function getMonth(date: string) {
  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      month: "short",
    }
  );
}

function getTime(date: string) {
  return new Date(date).toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function sourceLabel(source: string) {
  const value = source.toLowerCase();

  if (value.includes("image")) return "IMG";
  if (value.includes("pdf")) return "PDF";
  if (
    value.includes("link") ||
    value.includes("web") ||
    value.includes("url")
  ) {
    return "URL";
  }

  if (
    value.includes("voice") ||
    value.includes("audio")
  ) {
    return "AUD";
  }

  return "TXT";
}