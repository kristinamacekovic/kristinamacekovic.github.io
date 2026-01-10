# Kristina Macekovic's Personal Website

A minimalist personal blog built with pure HTML, CSS, and JavaScript.

## Setup

After cloning this repository, run the setup script to install Git hooks:

```bash
./setup-hooks.sh
# or
npm run setup-hooks
```

This installs a pre-commit hook that automatically generates `posts.json` whenever you commit changes.

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

4. Publish in one command:
   ```bash
   npm run publish posts/YYYY-MM-DD-Your-Post-Title.md
   # or
   ./publish-post.sh posts/YYYY-MM-DD-Your-Post-Title.md
   ```

   This will automatically:
   - Add your post to git
   - Generate `posts.json` (via pre-commit hook)
   - Create a commit with a nice message
   - Push to GitHub

   Your post goes live immediately!

### Manual Generation (Optional)

If you want to generate `posts.json` without committing (for example, to preview locally):

```bash
node generate-posts.js
# or
npm run generate-posts
```

### Without Git Hooks

If you didn't run the setup script, you'll need to manually update `posts.json` or run `generate-posts.js` before each commit.

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