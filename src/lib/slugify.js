'use strict';

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Ensures uniqueness by appending -2, -3, ... if needed.
function uniqueSlug(base, existsFn, ignoreId) {
  let slug = slugify(base) || 'item';
  let candidate = slug;
  let i = 2;
  while (existsFn(candidate, ignoreId)) {
    candidate = `${slug}-${i}`;
    i++;
  }
  return candidate;
}

module.exports = { slugify, uniqueSlug };
