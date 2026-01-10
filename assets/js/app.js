// Load and render blog posts on the home page
async function loadPosts() {
  try {
    const response = await fetch('/posts.json');
    if (!response.ok) {
      throw new Error('Failed to load posts');
    }

    const data = await response.json();
    renderPostList(data.posts);
  } catch (error) {
    console.error('Error loading posts:', error);
    document.getElementById('post-list').innerHTML = '<li>Failed to load posts</li>';
  }
}

function renderPostList(posts) {
  const container = document.getElementById('post-list');

  if (!posts || posts.length === 0) {
    container.innerHTML = '<li>No posts found</li>';
    return;
  }

  container.innerHTML = posts.map(post => {
    const date = post.date;
    const title = post.title.toLowerCase();
    const url = `/post.html?p=${encodeURIComponent(post.slug)}`;

    return `<li><span class="post-date">${date}</span> <a href="${url}">${title}</a></li>`;
  }).join('');
}

// Load posts when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPosts);
} else {
  loadPosts();
}
