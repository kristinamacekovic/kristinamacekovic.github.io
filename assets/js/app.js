// Home page: build the numbered writing index from posts.json.
// Posts are grouped by year (newest first). The static "About" and
// "Elsewhere" groups in index.html stay after the writing groups.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  });
  children.forEach(child => node.append(child));
  return node;
}

function parseDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return { year: y, month: m, day: d };
}

function shortDate(iso) {
  const { month, day } = parseDate(iso);
  if (!month || !day) return iso;
  return `${MONTHS[month - 1].slice(0, 3)} ${day}`;
}

function postItem(post) {
  const url = `/post.html?p=${encodeURIComponent(post.slug)}`;
  const meta = [shortDate(post.date)];
  if (post.categories && post.categories.length) meta.push(post.categories.join(', '));

  return el('li', {}, [
    el('a', { href: url, text: post.title }),
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

  if (!posts.length) return;

  const byYear = new Map();
  posts.forEach(post => {
    const { year } = parseDate(post.date);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(post);
  });

  [...byYear.keys()].sort((a, b) => b - a).forEach(year => {
    index.insertBefore(yearGroup(year, byYear.get(year)), anchor);
  });

  // Eyebrow: first year of writing and the month of the latest post.
  const eyebrow = document.getElementById('eyebrow');
  if (eyebrow) {
    const newest = parseDate(posts[0].date);
    const oldest = parseDate(posts[posts.length - 1].date);
    const parts = ['Personal site', `Writing since ${oldest.year}`];
    if (newest.month) parts.push(`Updated ${MONTHS[newest.month - 1]} ${newest.year}`);
    eyebrow.textContent = parts.join(' · ');
  }
}

async function loadPosts() {
  try {
    const response = await fetch('/posts.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const posts = (data.posts || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    renderIndex(posts);
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
