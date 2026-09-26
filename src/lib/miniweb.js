'use strict';
/**
 * miniweb — a tiny dependency-free web framework built directly on Node's http module.
 * Provides just enough of an Express-like API (get/post/put/delete/use, req.params/query/body/cookies,
 * res.send/json/redirect/status/cookie) to run this whole app without any npm packages.
 */
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

// Parses application/x-www-form-urlencoded bodies, grouping repeated keys (and keys
// ending in "[]") into arrays instead of keeping only the last value.
function parseFormBody(raw) {
  const params = new URLSearchParams(raw);
  const body = {};
  for (const [rawKey, value] of params.entries()) {
    const isArrayKey = rawKey.endsWith('[]');
    const key = isArrayKey ? rawKey.slice(0, -2) : rawKey;
    if (isArrayKey || Object.prototype.hasOwnProperty.call(body, key)) {
      if (!Array.isArray(body[key])) body[key] = body[key] !== undefined ? [body[key]] : [];
      body[key].push(value);
    } else {
      body[key] = value;
    }
  }
  return body;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    try { out[k] = decodeURIComponent(v); } catch (e) { out[k] = v; }
  });
  return out;
}

function compilePath(routePath) {
  const keys = [];
  const pattern = routePath
    .replace(/\/+$/, '') // strip trailing slash
    .split('/')
    .map((seg) => {
      if (seg.startsWith(':')) {
        keys.push(seg.slice(1));
        return '([^/]+)';
      }
      if (seg === '*') {
        keys.push('wildcard');
        return '(.*)';
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
    })
    .join('/');
  const regex = new RegExp('^' + (pattern || '/') + '/?$');
  return { regex, keys };
}

class Router {
  constructor() {
    this.stack = [];
  }

  _add(method, routePath, handlers) {
    const compiled = routePath instanceof RegExp ? null : compilePath(routePath);
    this.stack.push({ method, routePath, compiled, handlers });
  }

  get(p, ...h) { this._add('GET', p, h); }
  post(p, ...h) { this._add('POST', p, h); }
  put(p, ...h) { this._add('PUT', p, h); }
  delete(p, ...h) { this._add('DELETE', p, h); }
  all(p, ...h) { this._add('*', p, h); }

  use(prefixOrHandler, maybeRouter) {
    if (typeof prefixOrHandler === 'function' && !maybeRouter) {
      this.stack.push({ method: 'MW', handlers: [prefixOrHandler] });
    } else {
      const prefix = prefixOrHandler.replace(/\/+$/, '');
      this.stack.push({ method: 'MOUNT', prefix, router: maybeRouter });
    }
  }

  match(method, pathname) {
    for (const layer of this.stack) {
      if (layer.method === 'MW') {
        return { middleware: layer.handlers[0] };
      }
      if (layer.method === 'MOUNT') {
        if (pathname === layer.prefix || pathname.startsWith(layer.prefix + '/')) {
          const sub = pathname.slice(layer.prefix.length) || '/';
          return { mount: layer.router, subPath: sub };
        }
        continue;
      }
      if (layer.method !== '*' && layer.method !== method) continue;
      const m = layer.compiled.regex.exec(pathname);
      if (!m) continue;
      const params = {};
      layer.compiled.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { handlers: layer.handlers, params };
    }
    return null;
  }
}

function createApp() {
  const router = new Router();
  const app = {
    get: (...a) => router.get(...a),
    post: (...a) => router.post(...a),
    put: (...a) => router.put(...a),
    delete: (...a) => router.delete(...a),
    all: (...a) => router.all(...a),
    use: (...a) => router.use(...a),
    locals: {},
  };

  function staticMiddleware(mountPath, rootDir) {
    return (req, res, next) => {
      if (!req.pathname.startsWith(mountPath)) return next();
      const rel = decodeURIComponent(req.pathname.slice(mountPath.length));
      if (rel.includes('..')) return next();
      const filePath = path.join(rootDir, rel);
      fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) return next();
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', mountPath.startsWith('/uploads') ? 'public, max-age=604800' : 'public, max-age=86400');
        fs.createReadStream(filePath).pipe(res);
      });
    };
  }
  app.static = staticMiddleware;

  function handleRequest(rootRouter, req, res) {
    const parsed = url.parse(req.url, true);
    req.pathname = decodeURIComponent(parsed.pathname);
    req.query = parsed.query;
    req.cookies = parseCookies(req.headers.cookie);

    res.status = function (code) { res.statusCode = code; return res; };
    res.send = function (body) {
      if (typeof body === 'object') return res.json(body);
      const buf = Buffer.from(String(body));
      if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const acceptEnc = req.headers['accept-encoding'] || '';
      if (acceptEnc.includes('gzip') && buf.length > 1024) {
        res.setHeader('Content-Encoding', 'gzip');
        zlib.gzip(buf, (err, gz) => res.end(err ? buf : gz));
      } else {
        res.end(buf);
      }
    };
    res.json = function (obj) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(obj));
    };
    res.redirect = function (loc) {
      res.statusCode = 302;
      res.setHeader('Location', loc);
      res.end();
    };
    res.cookie = function (name, value, opts = {}) {
      let str = `${name}=${encodeURIComponent(value)}; Path=${opts.path || '/'}`;
      if (opts.maxAge) str += `; Max-Age=${Math.floor(opts.maxAge / 1000)}`;
      if (opts.httpOnly !== false) str += '; HttpOnly';
      str += `; SameSite=${opts.sameSite || 'Lax'}`;
      if (opts.secure) str += '; Secure';
      const prev = res.getHeader('Set-Cookie');
      const arr = prev ? (Array.isArray(prev) ? prev : [prev]) : [];
      arr.push(str);
      res.setHeader('Set-Cookie', arr);
      return res;
    };
    res.clearCookie = function (name, opts = {}) {
      res.cookie(name, '', { ...opts, maxAge: 0 });
    };

    const method = req.method.toUpperCase();

    const collectBody = (cb) => {
      if (method === 'GET' || method === 'HEAD') return cb();
      const chunks = [];
      let size = 0;
      req.on('data', (c) => {
        size += c.length;
        if (size > 60 * 1024 * 1024) { req.destroy(); return; } // 60MB safety cap (covers several uncompressed product photos as base64)
        chunks.push(c);
      });
      req.on('end', () => {
        const raw = Buffer.concat(chunks);
        const ct = req.headers['content-type'] || '';
        try {
          if (ct.includes('application/json')) {
            req.body = raw.length ? JSON.parse(raw.toString('utf8')) : {};
          } else if (ct.includes('application/x-www-form-urlencoded')) {
            req.body = parseFormBody(raw.toString('utf8'));
          } else {
            req.body = {};
          }
        } catch (e) {
          req.body = {};
        }
        cb();
      });
    };

    collectBody(() => {
      runRouter(rootRouter, req, res, req.pathname, method);
    });
  }

  function runRouter(r, req, res, pathname, method) {
    let idx = 0;
    const layers = r.stack;

    function next() {
      if (idx >= layers.length) return notFound(req, res);
      const layer = layers[idx++];
      if (layer.method === 'MW') {
        return layer.handlers[0](req, res, next);
      }
      if (layer.method === 'MOUNT') {
        if (pathname === layer.prefix || pathname.startsWith(layer.prefix + '/')) {
          const subPath = pathname.slice(layer.prefix.length) || '/';
          return runRouter(layer.router, req, res, subPath, method);
        }
        return next();
      }
      if (layer.method !== '*' && layer.method !== method) return next();
      const m = layer.compiled.regex.exec(pathname);
      if (!m) return next();
      const params = {};
      layer.compiled.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      req.params = params;
      let hIdx = 0;
      function runHandlers() {
        if (hIdx >= layer.handlers.length) return next();
        const h = layer.handlers[hIdx++];
        try {
          const result = h(req, res, runHandlers);
          if (result && typeof result.catch === 'function') {
            result.catch((err) => serverError(err, req, res));
          }
        } catch (err) {
          serverError(err, req, res);
        }
      }
      runHandlers();
    }
    next();
  }

  let notFoundHandler = (req, res) => { res.status(404).send('Not found'); };
  let errorHandler = (err, req, res) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
  };
  app.notFound = (fn) => { notFoundHandler = fn; };
  app.onError = (fn) => { errorHandler = fn; };

  function notFound(req, res) { notFoundHandler(req, res); }
  function serverError(err, req, res) { errorHandler(err, req, res); }

  app.listen = (port, cb) => {
    const server = http.createServer((req, res) => {
      try {
        handleRequest(router, req, res);
      } catch (err) {
        serverError(err, req, res);
      }
    });
    server.listen(port, cb);
    return server;
  };

  app._router = router;
  return app;
}

module.exports = { createApp, Router };
