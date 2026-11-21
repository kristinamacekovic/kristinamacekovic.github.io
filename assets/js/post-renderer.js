// Post page: load a Markdown post, render it, and add previous/next links.

marked.setOptions({
  gfm: true,
  breaks: true,
});

const RAW_BASE = 'https://raw.githubusercontent.com/kristinamacekovic/kristinamacekovic.github.io/main/posts/';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

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

function longDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function readingTime(text) {
  const words = text.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

// GitHub Pages runs Jekyll, which converts posts/*.md to HTML, so the raw
// file is not served from this domain. Try the local file first (works on a
// local server), then fall back to the raw file on GitHub.
async function fetchMarkdown(slug) {
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

function fixImagePaths(root) {
  root.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('../')) img.src = src.replace('..', '');
    img.loading = 'lazy';
  });
}

function updateMeta(frontMatter) {
  const title = frontMatter.title || 'Post';
  document.title = `${title} · Kristina Macekovic`;
  [['meta[property="og:title"]', title],
   ['meta[property="og:description"]', title],
   ['meta[name="description"]', title]].forEach(([selector, value]) => {
    const tag = document.querySelector(selector);
    if (tag) tag.content = value;
  });
}

function renderEyebrow(frontMatter, content) {
  const eyebrow = document.getElementById('post-eyebrow');
  const parts = [];
  if (frontMatter.date) {
    const time = document.createElement('time');
    time.dateTime = frontMatter.date;
    time.textContent = longDate(frontMatter.date);
    parts.push(time);
  }
  if (frontMatter.categories && frontMatter.categories.length) {
    parts.push(document.createTextNode(frontMatter.categories.join(', ')));
  }
  parts.push(document.createTextNode(`${readingTime(content)} min read`));

  parts.forEach(part => {
    const sep = document.createElement('span');
    sep.className = 'post-meta-sep';
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = '·';
    eyebrow.append(sep, part);
  });
}

async function renderPostNav(slug) {
  try {
    const response = await fetch('/posts.json');
    if (!response.ok) return;
    const posts = ((await response.json()).posts || [])
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const i = posts.findIndex(p => p.slug === slug);
    if (i === -1) return;

    const list = document.getElementById('post-nav-list');
    const add = (label, post) => {
      if (!post) return;
      const li = document.createElement('li');
      const tag = document.createElement('span');
      tag.className = 'post-nav-label';
      tag.textContent = label;
      const link = document.createElement('a');
      link.href = `/post.html?p=${encodeURIComponent(post.slug)}`;
      link.textContent = post.title;
      const sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = '/';
      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = post.date;
      li.append(tag, link, sep, meta);
      list.append(li);
    };
    add('Newer', posts[i - 1]);
    add('Older', posts[i + 1]);
    if (list.children.length) document.getElementById('post-nav').hidden = false;
  } catch (e) { /* navigation is optional */ }
}

async function loadPost() {
  const contentEl = document.getElementById('post-content');
  try {
    const slug = new URLSearchParams(window.location.search).get('p');
    if (!slug) throw new Error('No post specified');

    const { frontMatter, content } = parseMarkdown(await fetchMarkdown(slug));

    document.getElementById('post-title').textContent = frontMatter.title || 'Untitled';
    renderEyebrow(frontMatter, content);
    updateMeta(frontMatter);

    contentEl.innerHTML = marked.parse(content);
    fixImagePaths(contentEl);
    if (window.hljs) {
      contentEl.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
    }

    renderPostNav(slug);
  } catch (error) {
    console.error('Error loading post:', error);
    document.getElementById('post-title').textContent = 'Post not found';
    contentEl.innerHTML = '<p>This post did not load. <a href="/">Go to the index</a>.</p>';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPost);
} else {
  loadPost();
}
