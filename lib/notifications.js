const VALID_NOTIFICATION_TYPES = new Set([
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
export function normalizeIsRead(value) {
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
export function normalizeNotification(raw) {
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

  const record = raw;

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

  const type =
    typeof record.type === "string" &&
    VALID_NOTIFICATION_TYPES.has(record.type)
      ? record.type
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
export function calculateUnreadCount(notifications) {
  if (!Array.isArray(notifications)) return 0;
  return notifications.filter((notification) => !notification.is_read).length;
}

/**
 * Deduplicates notification items by ID while preserving ordering.
 */
export function deduplicateNotifications(notifications) {
  if (!Array.isArray(notifications)) return [];
  const seen = new Set();
  const result = [];

  for (const item of notifications) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }

  return result;
}

