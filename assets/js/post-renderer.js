// Configure marked.js for GitHub Flavored Markdown
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
});

// Parse YAML front matter from markdown content
function parseYAML(yaml) {
  const lines = yaml.split('\n').filter(line => line.trim());
  const result = {};

  lines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      // Remove quotes if present
      value = value.replace(/^["']|["']$/g, '');

      // Handle categories (can be space-separated or array-like)
      if (key === 'categories') {
        result[key] = value.split(/\s+/).filter(c => c);
      } else {
        result[key] = value;
      }
    }
  });

  return result;
}

// Split markdown into front matter and content
function parseMarkdown(markdown) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontMatterRegex);

  if (match) {
    const frontMatter = parseYAML(match[1]);
    const content = match[2];
    return { frontMatter, content };
  }

  return { frontMatter: {}, content: markdown };
}

// Fix relative image paths in the rendered HTML
function fixImagePaths() {
  document.querySelectorAll('#post-content img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('../')) {
      img.src = src.replace('..', '');
    }
  });
}

// Update page meta tags based on post front matter
function updateMetaTags(frontMatter) {
  const title = frontMatter.title || 'Post';
  document.title = `${title} - Kristina Macekovic`;

  // Update Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = title;

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = title;

  const twitterCard = document.querySelector('meta[name="description"]');
  if (twitterCard) twitterCard.content = title;
}

// Load and render the blog post
async function loadPost() {
  try {
    // Get post slug from URL parameter
    const params = new URLSearchParams(window.location.search);
    const postSlug = params.get('p');

    if (!postSlug) {
      throw new Error('No post specified');
    }

    // Fetch the markdown file from GitHub raw content
    const response = await fetch(`https://raw.githubusercontent.com/kristinamacekovic/kristinamacekovic.github.io/main/posts/${postSlug}.md`);
    if (!response.ok) {
      throw new Error('Post not found');
    }

    const markdown = await response.text();

    // Parse front matter and content
    const { frontMatter, content } = parseMarkdown(markdown);

    // Render metadata
    const dateElement = document.querySelector('.post-meta time');
    if (dateElement && frontMatter.date) {
      dateElement.textContent = frontMatter.date;
      dateElement.setAttribute('datetime', frontMatter.date);
    }

    const titleElement = document.querySelector('#post-title');
    if (titleElement && frontMatter.title) {
      titleElement.textContent = frontMatter.title;
    }

    // Update meta tags
    updateMetaTags(frontMatter);

    // Convert markdown to HTML
    const html = marked.parse(content);

    // Render HTML
    document.querySelector('#post-content').innerHTML = html;

    // Fix image paths
    fixImagePaths();

    // Apply syntax highlighting to code blocks
    document.querySelectorAll('#post-content pre code').forEach(block => {
      hljs.highlightElement(block);
    });

  } catch (error) {
    console.error('Error loading post:', error);
    document.querySelector('#post-content').innerHTML = `
      <p>Failed to load post: ${error.message}</p>
      <p><a href="/">Return to home</a></p>
    `;
  }
}

// Load post when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPost);
} else {
  loadPost();
}
