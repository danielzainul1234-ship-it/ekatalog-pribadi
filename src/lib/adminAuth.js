'use strict';
const { getSession } = require('./session');
const { get } = require('./db');

const COOKIE_NAME = 'ekatalog_admin_sid';

function requireAuth(req, res, next) {
  const sid = req.cookies[COOKIE_NAME];
  const session = getSession(sid);
  if (!session) {
    return res.redirect('/admin/login?next=' + encodeURIComponent(req.pathname));
  }
  const admin = get('SELECT id, username, name FROM admins WHERE id = ?', [session.admin_id]);
  if (!admin) return res.redirect('/admin/login');
  req.admin = admin;
  next();
}

module.exports = { requireAuth, COOKIE_NAME };
