// Home page: the writing index, the "last written" status and the heartbeat
// line, all built from posts.json.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const REPO = 'kristinamacekovic/kristinamacekovic.github.io';
const DAY = 24 * 60 * 60 * 1000;
const SVG_NS = 'http://www.w3.org/2000/svg';

/* ------------------------------------------------------------ helpers -- */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  });
  children.forEach(child => node.append(child));
  return node;
}

function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function parseDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return { year: y, month: m, day: d };
}

// Dates in posts.json are calendar days: read them as local midnight.
function toTime(iso) {
  const { year, month, day } = parseDate(iso);
  return new Date(year, (month || 1) - 1, day || 1).getTime();
}

function shortDate(iso) {
  const { month, day } = parseDate(iso);
  if (!month || !day) return iso;
  return `${MONTHS[month - 1].slice(0, 3)} ${day}`;
}

function longDate(iso) {
  const { year, month, day } = parseDate(iso);
  if (!year || !month || !day) return iso;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function ago(days) {
  if (days < 1) return 'today';
  if (days < 2) return 'yesterday';
  if (days < 14) return `${Math.floor(days)} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 730) return `${Math.round(days / 30.44)} months ago`;
  return `${Math.round(days / 365.25)} years ago`;
}

function postUrl(post) {
  return `/post.html?p=${encodeURIComponent(post.slug)}`;
}

/* -------------------------------------------------------------- index -- */

function postItem(post) {
  const meta = [shortDate(post.date)];
  if (post.categories && post.categories.length) meta.push(post.categories.join(', '));

  return el('li', {}, [
    el('a', { href: postUrl(post), text: post.title }),
    el('span', { class: 'sep', 'aria-hidden': 'true', text: '/' }),
    el('span', { class: 'meta', text: meta.join(' · ') }),
  ]);
}

function yearGroup(year, posts) {
  const head = el('h2', { class: 'group-head' }, [
    el('span', { text: `Writing, ${year}` }),
    el('span', { class: 'group-count', text: String(posts.length) }),
  ]);
  return el('section', { class: 'group' }, [head, el('ul', {}, posts.map(postItem))]);
}

function renderIndex(posts) {
  const index = document.getElementById('index');
  const anchor = document.getElementById('index-static-start');
  const status = document.getElementById('index-status');
  if (status) status.remove();

  const byYear = new Map();
  posts.forEach(post => {
    const { year } = parseDate(post.date);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(post);
  });

  [...byYear.keys()].sort((a, b) => b - a).forEach(year => {
    index.insertBefore(yearGroup(year, byYear.get(year)), anchor);
  });
}

/* ------------------------------------------------------------- status -- */

// The dot shows how fresh the writing is.
function freshness(days) {
  if (days <= 30) return 'alive';
  if (days <= 120) return 'steady';
  return 'quiet';
}

async function lastSiteUpdate() {
  const key = 'site-updated';
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) return cached;
  } catch (e) { /* storage unavailable */ }

  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/commits?sha=main&per_page=1`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) return null;
    const [commit] = await response.json();
    const date = commit && commit.commit && commit.commit.committer && commit.commit.committer.date;
    if (!date) return null;
    try { sessionStorage.setItem(key, date); } catch (e) { /* storage unavailable */ }
    return date;
  } catch (e) {
    return null;
  }
}

async function renderStatus(posts) {
  const latest = posts[0];
  const days = (Date.now() - toTime(latest.date)) / DAY;
  const state = freshness(days);

  document.getElementById('status').dataset.state = state;
  const text = document.getElementById('status-text');
  const written = `Last written ${ago(days)}`;
  text.textContent = written;
  text.title = `Latest post: ${latest.title}, ${longDate(latest.date)}`;

  const updated = await lastSiteUpdate();
  if (updated) {
    const updatedDays = Math.max(0, (Date.now() - new Date(updated).getTime()) / DAY);
    text.textContent = `${written} · Site updated ${ago(updatedDays)}`;
  }
}

/* ---------------------------------------------------------- heartbeat -- */

const HB = { height: 44, base: 30, gap: 11 };

function drawHeartbeat(figure, posts, animate = false) {
  const width = Math.round(figure.clientWidth);
  if (width < 120) return;

  const chronological = posts.slice().reverse();
  const firstYear = parseDate(chronological[0].date).year;
  const start = new Date(firstYear, 0, 1).getTime();
  const end = Date.now();
  const pad = 6;
  const span = width - pad * 2;
  const xOf = t => pad + ((t - start) / (end - start)) * span;
  const b = HB.base;

  // One spike per post (a small ECG beat), kept at least HB.gap apart.
  let previous = -Infinity;
  const beats = chronological.map(post => {
    const x = Math.max(xOf(toTime(post.date)), previous + HB.gap);
    previous = x;
    return { post, x };
  });

  let d = `M 0 ${b}`;
  beats.forEach(({ x }) => {
    d += ` L ${x - 5} ${b} L ${x - 3} ${b + 3} L ${x - 1} ${b - 22} L ${x + 1.5} ${b + 8} L ${x + 3.5} ${b}`;
  });
  const nowX = width - pad;
  d += ` L ${nowX} ${b}`;

  const root = svg('svg', {
    class: 'hb-svg',
    width,
    height: HB.height + 16,
    viewBox: `0 0 ${width} ${HB.height + 16}`,
    role: 'img',
    'aria-label': `Writing heartbeat: ${posts.length} posts from ${firstYear} to today. Latest post ${longDate(posts[0].date)}.`,
  });

  // Year ticks and labels; labels only where there is room.
  const yearWidth = span / ((end - start) / (365.25 * DAY));
  const thisYear = new Date().getFullYear();
  for (let year = firstYear; year <= thisYear; year++) {
    const x = xOf(new Date(year, 0, 1).getTime());
    root.append(svg('line', { class: 'hb-tick', x1: x, x2: x, y1: b + 4, y2: b + 9 }));
    const showLabel = year === firstYear || (yearWidth > 46 && nowX - x > 60);
    if (showLabel) {
      const label = svg('text', { class: 'hb-label', x, y: HB.height + 12 });
      label.textContent = year;
      root.append(label);
    }
  }
  const nowLabel = svg('text', { class: 'hb-label', x: nowX, y: HB.height + 12, 'text-anchor': 'end' });
  nowLabel.textContent = 'Now';
  root.append(nowLabel);

  const line = svg('path', { class: animate ? 'hb-line is-animated' : 'hb-line', d, pathLength: 1 });
  root.append(line);

  // A link and a peak marker for each post.
  beats.forEach(({ post, x }) => {
    const link = svg('a', { href: postUrl(post), class: 'hb-beat' });
    const title = svg('title');
    title.textContent = `${post.title} · ${longDate(post.date)}`;
    link.append(title);
    link.append(svg('rect', { class: 'hb-hit', x: x - 6, y: 0, width: 12, height: b + 10 }));
    link.append(svg('circle', { class: 'hb-peak', cx: x - 1, cy: b - 22, r: 3 }));
    root.append(link);
  });

  root.append(svg('circle', { class: 'hb-ring', cx: nowX, cy: b, r: 4 }));
  root.append(svg('circle', { class: 'hb-now', cx: nowX, cy: b, r: 3.5 }));

  figure.replaceChildren(root);
}

function renderHeartbeat(posts) {
  const figure = document.getElementById('heartbeat');
  if (!figure) return;
  const days = (Date.now() - toTime(posts[0].date)) / DAY;
  figure.dataset.state = freshness(days);
  drawHeartbeat(figure, posts, true);

  let lastWidth = figure.clientWidth;
  new ResizeObserver(() => {
    if (Math.abs(figure.clientWidth - lastWidth) < 2) return;
    lastWidth = figure.clientWidth;
    drawHeartbeat(figure, posts);
  }).observe(figure);
}

/* --------------------------------------------------------------- main -- */

async function loadPosts() {
  try {
    const response = await fetch('/posts.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const posts = (data.posts || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (!posts.length) return;
    renderIndex(posts);
    renderHeartbeat(posts);
    renderStatus(posts);
  } catch (error) {
    console.error('Error loading posts:', error);
    const status = document.getElementById('index-status');
    if (status) status.textContent = 'The post list did not load.';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPosts);
} else {
  loadPosts();
}
