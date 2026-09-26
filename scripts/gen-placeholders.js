'use strict';
// Generates elegant SVG placeholder images for seed data / demo content.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'img', 'placeholder');
fs.mkdirSync(DIR, { recursive: true });

const palettes = [
  ['#f3e7dd', '#d9b99b'],
  ['#efe4ee', '#c9a6d1'],
  ['#e6ecdf', '#a9c19a'],
  ['#fbe9e7', '#e3a89a'],
  ['#e7eef2', '#a9c1cf'],
  ['#f6ede1', '#cfa96a'],
];

function svgCard(width, height, label, sublabel, idx) {
  const [c1, c2] = palettes[idx % palettes.length];
  const fontSize = Math.round(width * 0.055);
  const subFontSize = Math.round(width * 0.032);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <g opacity="0.15">
    <circle cx="${width * 0.15}" cy="${height * 0.85}" r="${width * 0.22}" fill="#ffffff"/>
    <circle cx="${width * 0.9}" cy="${height * 0.12}" r="${width * 0.16}" fill="#ffffff"/>
  </g>
  <text x="50%" y="48%" font-family="Georgia, serif" font-size="${fontSize}" fill="#3d332b" text-anchor="middle" dominant-baseline="middle">${label}</text>
  <text x="50%" y="58%" font-family="Arial, sans-serif" font-size="${subFontSize}" fill="#6b5d4f" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">${sublabel}</text>
</svg>`;
}

const items = [
  ['cat-gamis', 'Gamis', 'KATEGORI', 0, 400, 400],
  ['cat-dress', 'Dress', 'KATEGORI', 1, 400, 400],
  ['cat-hijab', 'Hijab', 'KATEGORI', 2, 400, 400],
  ['cat-setelan', 'Setelan', 'KATEGORI', 3, 400, 400],
  ['cat-fashion', 'Fashion Wanita', 'KATEGORI', 4, 400, 400],
  ['cat-promo', 'Promo', 'KATEGORI', 5, 400, 400],
  ['gamis-aurelia-1', 'Gamis Aurelia', 'FOTO PRODUK', 0, 900, 1125],
  ['gamis-aurelia-2', 'Gamis Aurelia', 'FOTO PRODUK 2', 0, 900, 1125],
  ['gamis-zahra-1', 'Gamis Zahra', 'FOTO PRODUK', 1, 900, 1125],
  ['gamis-zahra-2', 'Gamis Zahra', 'FOTO PRODUK 2', 1, 900, 1125],
  ['dress-aisyah-1', 'Dress Aisyah', 'FOTO PRODUK', 2, 900, 1125],
  ['dress-aisyah-2', 'Dress Aisyah', 'FOTO PRODUK 2', 2, 900, 1125],
  ['hijab-voal-1', 'Hijab Voal Premium', 'FOTO PRODUK', 3, 900, 1125],
  ['setelan-rayyan-1', 'Setelan Rayyan', 'FOTO PRODUK', 4, 900, 1125],
  ['tas-1', 'Tas Selempang', 'FOTO PRODUK', 5, 900, 1125],
  ['banner-hero', 'Koleksi Terbaru', 'HERO BANNER', 0, 1600, 900],
  ['og-default', 'Ekatalog Pribadi', 'FASHION MUSLIMAH', 0, 1200, 630],
];

items.forEach(([file, label, sub, idx, w, h]) => {
  fs.writeFileSync(path.join(DIR, `${file}.svg`), svgCard(w, h, label, sub, idx));
});

console.log(`[gen-placeholders] ${items.length} file SVG placeholder dibuat di ${DIR}`);
