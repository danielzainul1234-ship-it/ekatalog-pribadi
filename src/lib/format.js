'use strict';

function rupiah(n) {
  const num = Math.round(Number(n) || 0);
  return 'Rp' + num.toLocaleString('id-ID');
}

function dateID(d) {
  const date = d ? new Date(d.includes ? d.replace(' ', 'T') + 'Z' : d) : new Date();
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function dateTimeID(d) {
  const date = d ? new Date(d.includes ? d.replace(' ', 'T') + 'Z' : d) : new Date();
  return date.toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { rupiah, dateID, dateTimeID, escapeHtml };
