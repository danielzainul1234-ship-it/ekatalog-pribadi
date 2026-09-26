'use strict';
const crypto = require('crypto');
const { get, run } = require('./db');

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function createSession(adminId) {
  const id = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  run('INSERT INTO sessions (id, admin_id, expires_at) VALUES (?, ?, ?)', [id, adminId, expiresAt]);
  return { id, expiresAt };
}

function getSession(id) {
  if (!id) return null;
  const row = get('SELECT * FROM sessions WHERE id = ?', [id]);
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    run('DELETE FROM sessions WHERE id = ?', [id]);
    return null;
  }
  return row;
}

function destroySession(id) {
  if (id) run('DELETE FROM sessions WHERE id = ?', [id]);
}

function cleanupExpired() {
  run("DELETE FROM sessions WHERE expires_at < datetime('now')");
}

module.exports = { createSession, getSession, destroySession, cleanupExpired };
