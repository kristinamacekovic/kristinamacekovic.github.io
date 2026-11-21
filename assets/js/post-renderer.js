// Post page: load a Markdown post, render it, and build the navigation
// around it (breadcrumb, sidebar of all posts, contents, newer/older links).

marked.setOptions({
  gfm: true,
  breaks: true,
});

const RAW_BASE = 'https://raw.githubusercontent.com/kristinamacekovic/kristinamacekovic.github.io/main/posts/';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

const slug = new URLSearchParams(window.location.search).get('p');

/* ------------------------------------------------------------ helpers -- */

function parseYAML(yaml) {
  const result = {};
  yaml.split('\n').filter(line => line.trim()).forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = key === 'categories' ? value.split(/\s+/).filter(Boolean) : value;
  });
  return result;
}

function parseMarkdown(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (match) return { frontMatter: parseYAML(match[1]), content: match[2] };
  return { frontMatter: {}, content: markdown };
}

function splitDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return { y, m, d };
}

function longDate(iso) {
  const { y, m, d } = splitDate(iso);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function shortDate(iso) {
  const { y, m, d } = splitDate(iso);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

function readingTime(text) {
  const words = text.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

// GitHub-style heading ids, so existing in-post links such as #whos-hiring work.
function slugify(text, used) {
  let base = text.toLowerCase().trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-') || 'section';
  let id = base;
  let n = 1;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

function node(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'text') el.textContent = value;
    else el.setAttribute(key, value);
  });
  children.forEach(child => el.append(child));
  return el;
}

function postUrl(post) {
  return `/post.html?p=${encodeURIComponent(post.slug)}`;
}

/* ------------------------------------------------------------ loading -- */

// GitHub Pages runs Jekyll, which converts posts/*.md to HTML, so the raw
// file is not served from this domain. Try the local file first (works on a
// local server), then fall back to the raw file on GitHub.
async function fetchMarkdown() {
  const sources = [`/posts/${slug}.md`, `${RAW_BASE}${slug}.md`];
  for (const url of sources) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const text = await response.text();
      if (/^\s*</.test(text)) continue; // an HTML page, not Markdown
      return text;
    } catch (e) { /* try the next source */ }
  }
  throw new Error('Post not found');
}

async function fetchPosts() {
  try {
    const response = await fetch('/posts.json');
    if (!response.ok) return [];
    return ((await response.json()).posts || [])
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  } catch (e) {
    return [];
  }
}

/* ---------------------------------------------------------- rendering -- */

function updateMeta(frontMatter) {
  const title = frontMatter.title || 'Post';
  const description = frontMatter.description || title;
  document.title = `${title} · Kristina Macekovic`;
  [['meta[property="og:title"]', title],
   ['meta[property="og:description"]', description],
   ['meta[name="description"]', description]].forEach(([selector, value]) => {
    const tag = document.querySelector(selector);
    if (tag) tag.content = value;
  });
}

function renderHeader(frontMatter, content) {
  const title = frontMatter.title || 'Untitled';
  document.getElementById('post-title').textContent = title;
  document.getElementById('crumb-title').textContent = title;
  if (frontMatter.date) document.getElementById('crumb-year').textContent = splitDate(frontMatter.date).y;

  const byline = document.getElementById('post-byline');
  const parts = [];
  if (frontMatter.date) {
    parts.push(node('time', { datetime: frontMatter.date, text: longDate(frontMatter.date) }));
  }
  if (frontMatter.categories && frontMatter.categories.length) {
    parts.push(document.createTextNode(frontMatter.categories.join(', ')));
  }
  parts.push(document.createTextNode(`${readingTime(content)} min read`));
  parts.forEach((part, i) => {
    if (i) byline.append(node('span', { class: 'post-meta-sep', 'aria-hidden': 'true', text: '·' }));
    byline.append(part);
  });

  // Optional "description:" in the front matter becomes the summary paragraph.
  if (frontMatter.description) {
    const lead = document.getElementById('post-lead');
    lead.textContent = frontMatter.description;
    lead.hidden = false;
  }
}

function enhanceContent(root) {
  root.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('../')) img.src = src.replace('..', '');
    img.loading = 'lazy';
  });

  if (window.hljs) {
    root.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
  }

  // Ids and deep links on every heading.
  const used = new Set();
  const headings = [...root.querySelectorAll('h1, h2, h3, h4')];
  headings.forEach(h => {
    h.id = slugify(h.textContent, used);
    const anchor = node('a', { class: 'heading-anchor', href: `#${h.id}`, 'aria-label': `Link to section: ${h.textContent}`, text: '#' });
    h.append(anchor);
  });
  return headings;
}

// Posts mix # and ## headings, so pick the level for the contents list.
function renderContents(headings) {
  if (!headings.length) return [];
  // Use the highest heading level that has at least two headings.
  const levels = [...new Set(headings.map(h => Number(h.tagName[1])))].sort();
  const level = levels.find(l => headings.filter(h => Number(h.tagName[1]) === l).length >= 2);
  if (!level) return [];
  const sections = headings.filter(h => Number(h.tagName[1]) === level);

  const list = document.getElementById('contents-list');
  sections.forEach((h, i) => {
    const label = h.cloneNode(true);
    label.querySelectorAll('.heading-anchor').forEach(a => a.remove());
    list.append(node('li', {}, [
      node('a', { href: `#${h.id}`, 'data-target': h.id }, [
        node('span', { class: 'contents-num', text: String(i + 1).padStart(2, '0') }),
        node('span', { class: 'contents-label', text: label.textContent.trim() }),
      ]),
    ]));
  });
  document.getElementById('post-contents').hidden = false;
  return sections;
}

// Mark the contents row of the section the reader is in.
function trackSections(sections) {
  if (!sections.length) return;
  const links = new Map([...document.querySelectorAll('#contents-list a')].map(a => [a.dataset.target, a]));
  let current = null;
  let queued = false;

  const update = () => {
    queued = false;
    const line = window.innerHeight * 0.3;
    let active = null;
    for (const h of sections) {
      if (h.getBoundingClientRect().top <= line) active = h.id;
      else break;
    }
    if (active === current) return;
    if (current && links.get(current)) links.get(current).removeAttribute('aria-current');
    if (active && links.get(active)) links.get(active).setAttribute('aria-current', 'location');
    current = active;
  };

  window.addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

function renderAside(posts) {
  const list = document.getElementById('aside-list');
  posts.forEach(post => {
    const attrs = { href: postUrl(post) };
    if (post.slug === slug) attrs['aria-current'] = 'page';
    list.append(node('li', {}, [
      node('a', attrs, [
        node('span', { class: 'aside-date', text: shortDate(post.date) }),
        node('span', { class: 'aside-name', text: post.title }),
      ]),
    ]));
  });
}

function renderNumber(posts) {
  const i = posts.findIndex(p => p.slug === slug);
  if (i === -1) return;
  const number = posts.length - i; // oldest post is number 1
  document.getElementById('post-eyebrow').textContent = `Post ${String(number).padStart(2, '0')}`;
}

function renderPostNav(posts) {
  const i = posts.findIndex(p => p.slug === slug);
  if (i === -1) return;
  const list = document.getElementById('post-nav-list');
  const add = (label, post) => {
    if (!post) return;
    list.append(node('li', {}, [
      node('span', { class: 'post-nav-label', text: label }),
      node('a', { href: postUrl(post), text: post.title }),
      node('span', { class: 'sep', text: '/' }),
      node('span', { class: 'meta', text: shortDate(post.date) }),
    ]));
  };
  add('Newer', posts[i - 1]);
  add('Older', posts[i + 1]);
  if (list.children.length) document.getElementById('post-nav').hidden = false;
}

// The content arrives after the browser's own jump to #hash, so do it again.
function scrollToHash() {
  if (!location.hash) return;
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) target.scrollIntoView();
}

/* --------------------------------------------------------------- main -- */

async function loadPost() {
  const contentEl = document.getElementById('post-content');
  const postsPromise = fetchPosts();

  try {
    if (!slug) throw new Error('No post specified');

    const { frontMatter, content } = parseMarkdown(await fetchMarkdown());
    renderHeader(frontMatter, content);
    updateMeta(frontMatter);

    contentEl.innerHTML = marked.parse(content);
    const headings = enhanceContent(contentEl);
    trackSections(renderContents(headings));
    scrollToHash();
  } catch (error) {
    console.error('Error loading post:', error);
    document.getElementById('post-title').textContent = 'Post not found';
    document.getElementById('crumb-title').textContent = 'Not found';
    contentEl.innerHTML = '<p>This post did not load. <a href="/">Go to the index</a>.</p>';
  }

  const posts = await postsPromise;
  if (posts.length) {
    renderAside(posts);
    renderNumber(posts);
    renderPostNav(posts);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPost);
} else {
  loadPost();
}
