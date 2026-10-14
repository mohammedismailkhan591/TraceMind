import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.REMINDER_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !fromEmail || !siteUrl) {
    console.error("Reminder cron configuration is incomplete.");
    return NextResponse.json(
      { error: "Reminder notification service is not configured." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date();
  // A short grace period catches normal cron delays without sending very old reminders.
  const graceStart = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

  const { data: dueReminders, error: dueError } = await supabase
    .from("reminders")
    .select("id, user_id, title, reminder_at, completed, notification_status")
    .eq("completed", false)
    .eq("notification_status", "pending")
    .lte("reminder_at", now.toISOString())
    .gte("reminder_at", graceStart)
    .order("reminder_at", { ascending: true })
    .limit(100);

  if (dueError) {
    console.error("Could not load due reminders:", dueError.message);
    return NextResponse.json({ error: "Could not load due reminders." }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const reminder of dueReminders ?? []) {
    // Atomically claim the row so overlapping cron invocations do not send it twice.
    const { data: claimed, error: claimError } = await supabase
      .from("reminders")
      .update({ notification_status: "processing" })
      .eq("id", reminder.id)
      .eq("notification_status", "pending")
      .select("id")
      .maybeSingle();

    if (claimError || !claimed) {
      if (claimError) console.error("Could not claim reminder:", claimError.message);
      continue;
    }

    try {
      const { data: preferences, error: preferenceError } = await supabase
        .from("notification_preferences")
        .select("email_notifications, deadline_reminders")
        .eq("user_id", reminder.user_id)
        .maybeSingle();

      if (preferenceError) throw preferenceError;

      if (
        preferences &&
        (!preferences.email_notifications || !preferences.deadline_reminders)
      ) {
        await supabase
          .from("reminders")
          .update({ notification_status: "skipped" })
          .eq("id", reminder.id);
        skipped++;
        continue;
      }

      const { data: userResult, error: userError } =
        await supabase.auth.admin.getUserById(reminder.user_id);

      if (userError) throw userError;

      const email = userResult.user?.email;
      if (!email) {
        await supabase
          .from("reminders")
          .update({ notification_status: "skipped" })
          .eq("id", reminder.id);
        skipped++;
        continue;
      }

      const title = String(reminder.title || "Upcoming deadline");
      const deadline = new Intl.DateTimeFormat("en", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(reminder.reminder_at));

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `TraceMind reminder: ${title}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#18223b;line-height:1.6">
              <div style="background:#6958f5;color:#fff;padding:18px 22px;border-radius:14px 14px 0 0;font-size:20px;font-weight:700">TraceMind</div>
              <div style="border:1px solid #e7e9f2;border-top:0;padding:26px;border-radius:0 0 14px 14px">
                <p style="color:#6958f5;font-size:12px;font-weight:700;letter-spacing:1px">DEADLINE REMINDER</p>
                <h1 style="font-size:23px;margin:8px 0 14px">${escapeHtml(title)}</h1>
                <p>Your scheduled TraceMind reminder is due.</p>
                <div style="background:#f6f7ff;border:1px solid #e6e9ff;border-radius:10px;padding:15px;margin:20px 0">
                  <strong>Reminder time</strong><br />
                  ${escapeHtml(deadline)} (India Standard Time)
                </div>
                <a href="${escapeHtml(siteUrl.replace(/\/$/, ""))}/reminders" style="display:inline-block;background:#365cf5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:700">Open my reminders</a>
                <p style="font-size:12px;color:#7b8498;margin-top:24px">You received this email because deadline reminders are enabled in your TraceMind settings.</p>
              </div>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Email provider returned ${response.status}: ${details}`);
      }

      const { error: updateError } = await supabase
        .from("reminders")
        .update({
          notification_status: "sent",
          notification_sent_at: new Date().toISOString(),
          notification_error: null,
        })
        .eq("id", reminder.id);

      if (updateError) throw updateError;
      sent++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown notification error";

      console.error(`Reminder ${reminder.id} failed:`, errorMessage);

      // Restore pending so the next cron run can retry while the reminder is recent.
      await supabase
        .from("reminders")
        .update({
          notification_status: "pending",
          notification_error: errorMessage.slice(0, 1000),
        })
        .eq("id", reminder.id);

      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    checked: dueReminders?.length ?? 0,
    sent,
    skipped,
    failed,
    checkedAt: now.toISOString(),
  });
}
