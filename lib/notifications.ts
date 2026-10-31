export type NotificationType = "info" | "success" | "warning" | "deadline";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const VALID_NOTIFICATION_TYPES = new Set<NotificationType>([
  "info",
  "success",
  "warning",
  "deadline",
]);

/**
 * Normalizes an unknown value to a boolean for `is_read`.
 *
 * PostgreSQL boolean columns return native booleans (`true` / `false`).
 * If a string `"false"` or `"true"` is returned (e.g. from custom payloads or serializers),
 * this function ensures `"false"` is strictly `false` and never coerced into a truthy
 * value via loose checks or `Boolean("false")`.
 */
export function normalizeIsRead(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }

  if (value === false || value === 0 || value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "true" || trimmed === "t" || trimmed === "1") {
      return true;
    }
    if (trimmed === "false" || trimmed === "f" || trimmed === "0") {
      return false;
    }
  }

  // Safe fallback for unexpected values: unread
  return false;
}

/**
 * Normalizes a notification record from Supabase or Realtime into a well-formed NotificationItem.
 */
export function normalizeNotification(raw: unknown): NotificationItem {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      title: "Notification",
      message: "",
      type: "info",
      link: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
  }

  const record = raw as Record<string, unknown>;

  const id =
    typeof record.id === "string" || typeof record.id === "number"
      ? String(record.id)
      : "";

  const title =
    typeof record.title === "string" && record.title.trim().length > 0
      ? record.title.trim()
      : "Notification";

  const message =
    typeof record.message === "string" ? record.message : "";

  const type: NotificationType =
    typeof record.type === "string" &&
    VALID_NOTIFICATION_TYPES.has(record.type as NotificationType)
      ? (record.type as NotificationType)
      : "info";

  const link =
    typeof record.link === "string" && record.link.trim().length > 0
      ? record.link.trim()
      : null;

  const is_read = normalizeIsRead(record.is_read);

  const created_at =
    typeof record.created_at === "string" && record.created_at.trim().length > 0
      ? record.created_at
      : new Date().toISOString();

  return {
    id,
    title,
    message,
    type,
    link,
    is_read,
    created_at,
  };
}

/**
 * Calculates the number of unread notifications from a list of normalized notification items.
 */
export function calculateUnreadCount(notifications: NotificationItem[]): number {
  return notifications.filter((notification) => !notification.is_read).length;
}

/**
 * Deduplicates notification items by ID while preserving ordering.
 */
export function deduplicateNotifications(notifications: NotificationItem[]): NotificationItem[] {
  const seen = new Set<string>();
  const result: NotificationItem[] = [];

  for (const item of notifications) {
    if (item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }

  return result;
}

