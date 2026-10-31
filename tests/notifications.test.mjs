import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeIsRead,
  normalizeNotification,
  calculateUnreadCount,
  deduplicateNotifications,
} from '../lib/notifications.js';

test('normalizeIsRead correctly evaluates boolean values', () => {
  assert.equal(normalizeIsRead(true), true);
  assert.equal(normalizeIsRead(false), false);
});

test('normalizeIsRead does not classify "false" string as read', () => {
  // CRITICAL: In standard JS, Boolean("false") is true.
  // Our normalization must strictly ensure "false" is false (unread).
  assert.equal(normalizeIsRead('false'), false);
  assert.equal(normalizeIsRead('False'), false);
  assert.equal(normalizeIsRead('FALSE'), false);
  assert.equal(normalizeIsRead('  false  '), false);
  assert.equal(normalizeIsRead('f'), false);
  assert.equal(normalizeIsRead('0'), false);
});

test('normalizeIsRead correctly parses truthy representations', () => {
  assert.equal(normalizeIsRead('true'), true);
  assert.equal(normalizeIsRead('True'), true);
  assert.equal(normalizeIsRead('TRUE'), true);
  assert.equal(normalizeIsRead('  true  '), true);
  assert.equal(normalizeIsRead('t'), true);
  assert.equal(normalizeIsRead('1'), true);
  assert.equal(normalizeIsRead(1), true);
});

test('normalizeIsRead safely treats null, undefined, and unexpected values as unread (false)', () => {
  assert.equal(normalizeIsRead(null), false);
  assert.equal(normalizeIsRead(undefined), false);
  assert.equal(normalizeIsRead(0), false);
  assert.equal(normalizeIsRead(''), false);
  assert.equal(normalizeIsRead('random-string'), false);
  assert.equal(normalizeIsRead({}), false);
  assert.equal(normalizeIsRead([]), false);
});

test('normalizeNotification normalizes all fields and safeguards is_read', () => {
  const rawRecord = {
    id: 12345,
    title: 'Reminder deadline approaching',
    message: 'Project meeting in 1 hour',
    type: 'deadline',
    link: '/reminders',
    is_read: 'false', // String "false"
    created_at: '2026-10-29T10:00:00Z',
  };

  const normalized = normalizeNotification(rawRecord);

  assert.equal(normalized.id, '12345');
  assert.equal(normalized.title, 'Reminder deadline approaching');
  assert.equal(normalized.message, 'Project meeting in 1 hour');
  assert.equal(normalized.type, 'deadline');
  assert.equal(normalized.link, '/reminders');
  assert.equal(normalized.is_read, false, 'String "false" must normalize to boolean false');
  assert.equal(normalized.created_at, '2026-10-29T10:00:00Z');
});

test('normalizeNotification handles malformed or missing fields with safe defaults', () => {
  const normalized = normalizeNotification(null);

  assert.equal(normalized.id, '');
  assert.equal(normalized.title, 'Notification');
  assert.equal(normalized.message, '');
  assert.equal(normalized.type, 'info');
  assert.equal(normalized.link, null);
  assert.equal(normalized.is_read, false);
  assert.ok(typeof normalized.created_at === 'string');

  const partialRecord = {
    id: 'abc-123',
    type: 'unknown_type',
    is_read: null,
  };

  const normalizedPartial = normalizeNotification(partialRecord);
  assert.equal(normalizedPartial.id, 'abc-123');
  assert.equal(normalizedPartial.type, 'info', 'Invalid types must fall back to "info"');
  assert.equal(normalizedPartial.is_read, false, 'null is_read must fall back to false');
});

test('calculateUnreadCount calculates accurate unread count from normalized notifications', () => {
  const items = [
    normalizeNotification({ id: '1', title: 'N1', is_read: false }),
    normalizeNotification({ id: '2', title: 'N2', is_read: 'false' }),
    normalizeNotification({ id: '3', title: 'N3', is_read: true }),
    normalizeNotification({ id: '4', title: 'N4', is_read: 'true' }),
    normalizeNotification({ id: '5', title: 'N5', is_read: null }),
  ];

  // Items 1, 2, 5 are unread (3 total)
  // Items 3, 4 are read
  const unread = calculateUnreadCount(items);
  assert.equal(unread, 3);
});

test('deduplicateNotifications removes duplicate IDs while preserving order', () => {
  const items = [
    normalizeNotification({ id: '1', title: 'First 1', is_read: false }),
    normalizeNotification({ id: '2', title: 'First 2', is_read: false }),
    normalizeNotification({ id: '1', title: 'Duplicate 1', is_read: true }),
    normalizeNotification({ id: '3', title: 'First 3', is_read: true }),
  ];

  const deduplicated = deduplicateNotifications(items);
  assert.equal(deduplicated.length, 3);
  assert.deepEqual(deduplicated.map(i => i.id), ['1', '2', '3']);
  assert.equal(deduplicated[0].title, 'First 1');
});

