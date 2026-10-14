import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Reminder = {
  id: string;
  user_id: string;
  title: string;
  reminder_at: string;
  completed: boolean;
  notification_status: string;
};

type NotificationPreferences = {
  user_id: string;
  email_notifications: boolean;
  deadline_reminders: boolean;
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, { status });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatReminderDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function createEmailHtml(
  title: string,
  reminderAt: string,
  siteUrl: string
): string {
  const safeTitle = escapeHtml(title);
  const safeDate = escapeHtml(formatReminderDate(reminderAt));
  const safeSiteUrl = escapeHtml(siteUrl);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TraceMind Reminder</title>
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background-color: #f4f6fb;
        font-family: Arial, Helvetica, sans-serif;
        color: #172033;
      ">
        <div style="
          max-width: 560px;
          margin: 40px auto;
          padding: 32px 24px;
        ">
          <div style="
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 20px;
            padding: 32px;
          ">
            <div style="
              font-size: 13px;
              font-weight: bold;
              letter-spacing: 2px;
              color: #6366f1;
              margin-bottom: 24px;
            ">
              TRACEMIND
            </div>

            <div style="
              width: 52px;
              height: 52px;
              line-height: 52px;
              text-align: center;
              background: #eef2ff;
              border-radius: 14px;
              font-size: 26px;
              margin-bottom: 24px;
            ">
              ⏰
            </div>

            <h1 style="
              font-size: 26px;
              line-height: 1.3;
              margin: 0 0 12px;
              color: #111827;
            ">
              Reminder notification
            </h1>

            <p style="
              font-size: 15px;
              line-height: 1.7;
              color: #64748b;
              margin: 0 0 24px;
            ">
              You have a reminder waiting for your attention.
            </p>

            <div style="
              padding: 20px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              margin-bottom: 24px;
            ">
              <p style="
                margin: 0 0 8px;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #64748b;
              ">
                Your reminder
              </p>

              <h2 style="
                margin: 0 0 16px;
                font-size: 19px;
                line-height: 1.5;
                color: #111827;
                overflow-wrap: anywhere;
              ">
                ${safeTitle}
              </h2>

              <p style="
                margin: 0;
                font-size: 14px;
                line-height: 1.6;
                color: #475569;
              ">
                <strong>Scheduled time:</strong><br />
                ${safeDate} IST
              </p>
            </div>

            <a href="${safeSiteUrl}/reminders" style="
              display: inline-block;
              padding: 14px 24px;
              background: #6366f1;
              color: #ffffff;
              text-decoration: none;
              border-radius: 10px;
              font-size: 14px;
              font-weight: bold;
            ">
              View My Reminders
            </a>

            <p style="
              font-size: 12px;
              line-height: 1.7;
              color: #94a3b8;
              margin: 28px 0 0;
            ">
              You received this email because reminder notifications
              are enabled in your TraceMind settings.
            </p>
          </div>

          <p style="
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            margin-top: 20px;
          ">
            TraceMind · Your personal memory assistant
          </p>
        </div>
      </body>
    </html>
  `;
}

async function sendReminderEmail(params: {
  apiKey: string;
  from: string;
  to: string;
  title: string;
  reminderAt: string;
  siteUrl: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: `Reminder: ${params.title}`,
      html: createEmailHtml(
        params.title,
        params.reminderAt,
        params.siteUrl
      ),
    }),
    signal: AbortSignal.timeout(15000),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof responseBody?.message === "string"
        ? responseBody.message
        : `Resend returned HTTP ${response.status}`;

    throw new Error(message);
  }

  return responseBody;
}

export async function GET(request: Request) {
  // --------------------------------------------------
  // 1. Authenticate the Cron request
  // --------------------------------------------------

  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured.");

    return jsonResponse(
      {
        success: false,
        error: "Cron authentication is not configured.",
      },
      500
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return jsonResponse(
      {
        success: false,
        error: "Unauthorized.",
      },
      401
    );
  }

  // --------------------------------------------------
  // 2. Validate environment variables
  // --------------------------------------------------

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const reminderFromEmail = process.env.REMINDER_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const missingVariables = [
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    !resendApiKey && "RESEND_API_KEY",
    !reminderFromEmail && "REMINDER_FROM_EMAIL",
    !siteUrl && "NEXT_PUBLIC_SITE_URL",
  ].filter(Boolean);

  if (missingVariables.length > 0) {
    console.error("Missing reminder configuration:", missingVariables);

    return jsonResponse(
      {
        success: false,
        error: "Missing required environment variables.",
        missing: missingVariables,
      },
      500
    );
  }

  // --------------------------------------------------
  // 3. Create a server-side Supabase client
  // --------------------------------------------------

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const startedAt = new Date();
  const now = startedAt.toISOString();

  let checked = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // --------------------------------------------------
  // 4. Find due reminders
  //
  // No 15-minute restriction: overdue pending
  // reminders can be processed by the daily Cron.
  // --------------------------------------------------

  const { data: remindersData, error: remindersError } =
    await supabase
      .from("reminders")
      .select(
        "id, user_id, title, reminder_at, completed, notification_status"
      )
      .eq("completed", false)
      .eq("notification_status", "pending")
      .lte("reminder_at", now)
      .order("reminder_at", { ascending: true })
      .limit(100);

  if (remindersError) {
    console.error("Could not fetch reminders:", remindersError.message);

    return jsonResponse(
      {
        success: false,
        error: "Could not fetch due reminders.",
      },
      500
    );
  }

  const reminders = (remindersData ?? []) as Reminder[];

  checked = reminders.length;

  // --------------------------------------------------
  // 5. Process reminders individually
  // --------------------------------------------------

  for (const reminder of reminders) {
    try {
      // Atomically claim the reminder.
      // Only one request should change pending to processing.

      const { data: claimedReminder, error: claimError } =
        await supabase
          .from("reminders")
          .update({
            notification_status: "processing",
            notification_error: null,
          })
          .eq("id", reminder.id)
          .eq("notification_status", "pending")
          .eq("completed", false)
          .select("id")
          .maybeSingle();

      if (claimError) {
        console.error(
          `Could not claim reminder ${reminder.id}:`,
          claimError.message
        );

        failed++;
        continue;
      }

      if (!claimedReminder) {
        // Another invocation has already claimed or processed it.
        continue;
      }

      // ------------------------------------------------
      // 6. Read notification preferences
      // ------------------------------------------------

      const { data: preferences, error: preferencesError } =
        await supabase
          .from("notification_preferences")
          .select("user_id, email_notifications, deadline_reminders")
          .eq("user_id", reminder.user_id)
          .maybeSingle();

      if (preferencesError) {
        throw new Error(
          `Could not read notification preferences: ${preferencesError.message}`
        );
      }

      // Safe default: if preferences do not exist, do not
      // send until the user has explicitly enabled notifications.
      const shouldSend =
        preferences !== null &&
        (preferences as NotificationPreferences).email_notifications ===
          true &&
        (preferences as NotificationPreferences).deadline_reminders ===
          true;

      if (!shouldSend) {
        const { error: skipError } = await supabase
          .from("reminders")
          .update({
            notification_status: "skipped",
            notification_error: null,
          })
          .eq("id", reminder.id)
          .eq("notification_status", "processing");

        if (skipError) {
          throw new Error(
            `Could not mark reminder as skipped: ${skipError.message}`
          );
        }

        skipped++;
        continue;
      }

      // ------------------------------------------------
      // 7. Get the user's email address
      // ------------------------------------------------

      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(reminder.user_id);

      if (userError) {
        throw new Error(
          `Could not retrieve user: ${userError.message}`
        );
      }

      const recipientEmail = userData.user?.email;

      if (!recipientEmail) {
        throw new Error("The reminder owner has no email address.");
      }

      // ------------------------------------------------
      // 8. Send the email through Resend
      // ------------------------------------------------

      const title = reminder.title?.trim() || "Your TraceMind reminder";

      await sendReminderEmail({
        apiKey: resendApiKey!,
        from: reminderFromEmail!,
        to: recipientEmail,
        title,
        reminderAt: reminder.reminder_at,
        siteUrl: siteUrl!.replace(/\/+$/, ""),
      });

      // ------------------------------------------------
      // 9. Mark notification as sent
      // ------------------------------------------------

      const { error: updateError } = await supabase
        .from("reminders")
        .update({
          notification_status: "sent",
          notification_sent_at: new Date().toISOString(),
          notification_error: null,
        })
        .eq("id", reminder.id)
        .eq("notification_status", "processing");

      if (updateError) {
        // The email may already have been sent. Do not
        // blindly retry here, as that could send duplicates.
        console.error(
          `Email sent but status update failed for ${reminder.id}:`,
          updateError.message
        );

        failed++;
        continue;
      }

      sent++;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      console.error(
        `Reminder ${reminder.id} failed:`,
        errorMessage
      );

      // Return the reminder to pending so a future Cron run
      // can retry it. This can result in a duplicate email if
      // Resend accepted the email but the response was lost.
      const { error: resetError } = await supabase
        .from("reminders")
        .update({
          notification_status: "pending",
          notification_error: errorMessage.slice(0, 1000),
        })
        .eq("id", reminder.id)
        .eq("notification_status", "processing");

      if (resetError) {
        console.error(
          `Could not reset reminder ${reminder.id}:`,
          resetError.message
        );
      }

      failed++;
    }
  }

  // --------------------------------------------------
  // 10. Return execution summary
  // --------------------------------------------------

  const result = {
    success: failed === 0,
    checked,
    sent,
    skipped,
    failed,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
  };

  console.log("TraceMind reminder Cron completed:", result);

  return jsonResponse(result, 200);
}