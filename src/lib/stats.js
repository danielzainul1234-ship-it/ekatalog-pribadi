'use strict';
const { get, all } = require('./db');
const { LOW_STOCK_THRESHOLD } = require('./products');

function getDashboardStats() {
  const totalProducts = get("SELECT COUNT(*) c FROM products WHERE status = 'active'").c;
  const totalOrders = get('SELECT COUNT(*) c FROM orders').c;
  const ordersToday = get("SELECT COUNT(*) c FROM orders WHERE date(created_at) = date('now')").c;
  const salesToday = get("SELECT COALESCE(SUM(total),0) s FROM orders WHERE date(created_at) = date('now') AND status != 'dibatalkan'").s;

  // low stock / out of stock across simple products and variants
  const simpleLow = all(`SELECT id FROM products WHERE has_variants = 0 AND status='active' AND stock > 0 AND stock <= ?`, [LOW_STOCK_THRESHOLD]).length;
  const variantLow = all(`
    SELECT p.id FROM products p JOIN product_variants v ON v.product_id = p.id
    WHERE p.has_variants = 1 AND p.status='active'
    GROUP BY p.id HAVING SUM(v.stock) > 0 AND SUM(v.stock) <= ?`, [LOW_STOCK_THRESHOLD]).length;

  const simpleOut = all(`SELECT id FROM products WHERE has_variants = 0 AND status='active' AND stock <= 0`).length;
  const variantOut = all(`
    SELECT p.id FROM products p JOIN product_variants v ON v.product_id = p.id
    WHERE p.has_variants = 1 AND p.status='active'
    GROUP BY p.id HAVING SUM(v.stock) <= 0`).length;

  return {
    totalProducts,
    totalOrders,
    ordersToday,
    salesToday,
    lowStockCount: simpleLow + variantLow,
    outOfStockCount: simpleOut + variantOut,
  };
}

function getSalesSeries(range) {
  if (range === 'monthly') {
    const rows = all(`
      SELECT strftime('%Y-%m', created_at) as period, SUM(total) as total
      FROM orders WHERE status != 'dibatalkan' AND created_at >= datetime('now','-6 months')
      GROUP BY period ORDER BY period ASC`);
    return buildLastN(rows, 6, 'month');
  }
  if (range === 'weekly') {
    const rows = all(`
      SELECT strftime('%Y-%W', created_at) as period, SUM(total) as total
      FROM orders WHERE status != 'dibatalkan' AND created_at >= datetime('now','-8 weeks')
      GROUP BY period ORDER BY period ASC`);
    return buildLastN(rows, 8, 'week');
  }
  const rows = all(`
    SELECT date(created_at) as period, SUM(total) as total
    FROM orders WHERE status != 'dibatalkan' AND created_at >= datetime('now','-14 days')
    GROUP BY period ORDER BY period ASC`);
  return buildLastN(rows, 14, 'day');
}

function buildLastN(rows, n, unit) {
  const map = {};
  rows.forEach((r) => { map[r.period] = r.total; });
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    let key, label;
    if (unit === 'day') {
      d.setDate(d.getDate() - i);
      key = d.toISOString().slice(0, 10);
      label = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    } else if (unit === 'week') {
      d.setDate(d.getDate() - i * 7);
      const week = getWeekNumber(d);
      key = `${d.getFullYear()}-${String(week).padStart(2, '0')}`;
      label = `M${week}`;
    } else {
      d.setMonth(d.getMonth() - i);
      key = d.toISOString().slice(0, 7);
      label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    }
    out.push({ key, label, total: map[key] || 0 });
  }
  return out;
}

function getWeekNumber(d) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const firstJan = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - firstJan) / 86400000) + firstJan.getDay() + 1) / 7);
}

module.exports = { getDashboardStats, getSalesSeries };
