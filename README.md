# Kristina Macekovic's Personal Website

A minimalist personal blog built with pure HTML, CSS, and JavaScript.

## Structure

- `index.html` - Home page with navigation and blog list
- `post.html` - Dynamic blog post renderer
- `posts/` - Blog posts in Markdown format with YAML front matter
- `posts.json` - Post metadata manifest
- `about/` - About pages (who-am-i, now, questions)
- `assets/` - CSS, JavaScript, and images
  - `css/` - Stylesheets
  - `js/` - JavaScript files
  - `img/` - Images used in posts

## Adding a New Post

1. Create a new `.md` file in `posts/` with format: `YYYY-MM-DD-Title-Slug.md`

2. Add YAML front matter at the top:
   ```yaml
   ---
   layout: post
   title: "Your Post Title"
   date: YYYY-MM-DD
   categories: category1 category2
   ---
   ```

3. Write your content in Markdown below the front matter

4. Generate `posts.json` automatically:
   ```bash
   node generate-posts.js
   # or
   npm run generate-posts
   ```
   This will scan all markdown files in `posts/` and regenerate `posts.json` automatically.

5. Commit and push your changes:
   ```bash
   git add posts/ posts.json
   git commit -m "Add new post: Your Post Title"
   git push origin main
   ```

### Manual Alternative

If you prefer not to use the script, you can manually update `posts.json` by adding your post metadata at the top of the `posts` array (newest first).

## Local Development

To test locally, start a web server in the project directory:

```bash
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```

Or use any other static web server like:
```bash
npx serve .
```

## Technologies

- **Marked.js** - Markdown parsing in the browser
- **Highlight.js** - Syntax highlighting for code blocks
- **Vanilla JavaScript** - No frameworks or build tools
- **Pure CSS** - No preprocessors

## Features

- Minimalist monospace design
- Dark mode support (respects system preference)
- Client-side Markdown rendering
- Code syntax highlighting
- Plausible analytics
- Fully static - works on any web server
- No build step required

## Deployment

This site is designed to work on GitHub Pages or any static hosting platform. Simply push to your repository and GitHub Pages will serve the files automatically.

## Migration from Jekyll

This site was previously built with Jekyll. The backup of the Jekyll version is preserved in the `backup-jekyll` branch if you need to reference it.