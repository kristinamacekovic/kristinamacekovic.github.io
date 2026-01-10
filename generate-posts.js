#!/usr/bin/env node

/**
 * Generate posts.json from markdown files in posts/ directory
 *
 * Usage: node generate-posts.js
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = './posts';
const OUTPUT_FILE = './posts.json';

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

      // Handle categories (space-separated)
      if (key === 'categories') {
        result[key] = value.split(/\s+/).filter(c => c);
      } else {
        result[key] = value;
      }
    }
  });

  return result;
}

// Extract front matter from markdown file
function extractFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontMatterRegex);

  if (match) {
    return parseYAML(match[1]);
  }

  return {};
}

// Generate posts.json
function generatePostsJson() {
  console.log('📝 Scanning posts directory...');

  // Read all markdown files from posts directory
  const files = fs.readdirSync(POSTS_DIR)
    .filter(file => file.endsWith('.md'))
    .sort()
    .reverse(); // Newest first

  console.log(`Found ${files.length} post(s)`);

  const posts = files.map(filename => {
    const filepath = path.join(POSTS_DIR, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    const frontMatter = extractFrontMatter(content);

    // Extract slug from filename (remove date prefix and .md extension)
    const slug = filename.replace('.md', '');

    const post = {
      filename: filename,
      title: frontMatter.title || 'Untitled',
      date: frontMatter.date || '',
      categories: frontMatter.categories || [],
      url: `posts/${filename}`,
      slug: slug
    };

    console.log(`  ✓ ${post.date} - ${post.title}`);

    return post;
  });

  // Write posts.json
  const output = {
    posts: posts
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');

  console.log(`\n✅ Generated ${OUTPUT_FILE} with ${posts.length} post(s)`);
}

// Run the script
try {
  generatePostsJson();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
