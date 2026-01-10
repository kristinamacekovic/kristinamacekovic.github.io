#!/bin/bash
#
# Publish a blog post - one command to do it all!
#
# Usage: ./publish-post.sh posts/2026-01-10-my-post.md
#        npm run publish posts/2026-01-10-my-post.md
#

# Color codes for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if a file was provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Please provide a post file${NC}"
  echo ""
  echo "Usage: $0 posts/YYYY-MM-DD-Your-Post.md"
  echo "   or: npm run publish posts/YYYY-MM-DD-Your-Post.md"
  exit 1
fi

POST_FILE="$1"

# Check if the file exists
if [ ! -f "$POST_FILE" ]; then
  echo -e "${RED}❌ Error: File not found: $POST_FILE${NC}"
  exit 1
fi

# Check if it's a markdown file in posts/
if [[ ! "$POST_FILE" =~ ^posts/.*\.md$ ]]; then
  echo -e "${YELLOW}⚠️  Warning: File should be in posts/ directory and end with .md${NC}"
  echo "   Found: $POST_FILE"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Extract post title from filename (remove date prefix and .md extension)
FILENAME=$(basename "$POST_FILE")
POST_TITLE=${FILENAME#*-*-*-}  # Remove YYYY-MM-DD- prefix
POST_TITLE=${POST_TITLE%.md}   # Remove .md extension
POST_TITLE=${POST_TITLE//-/ }  # Replace dashes with spaces

echo -e "${BLUE}📝 Publishing post: ${GREEN}$POST_TITLE${NC}"
echo ""

# Step 1: Add the post file
echo -e "${BLUE}Step 1/4:${NC} Adding post to git..."
git add "$POST_FILE"
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to add file to git${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Post added${NC}"
echo ""

# Step 2: Commit (pre-commit hook will generate posts.json automatically)
echo -e "${BLUE}Step 2/4:${NC} Creating commit..."
git commit -m "Add post: $POST_TITLE"
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Commit failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Commit created (posts.json updated automatically)${NC}"
echo ""

# Step 3: Push to origin
echo -e "${BLUE}Step 3/4:${NC} Pushing to GitHub..."
git push origin main
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Push failed${NC}"
  echo -e "${YELLOW}💡 You may need to pull first or check your credentials${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Pushed to GitHub${NC}"
echo ""

# Step 4: Success!
echo -e "${GREEN}✅ Post published successfully!${NC}"
echo ""
echo -e "Your post is live at: ${BLUE}https://kristinamacekovic.github.io${NC}"
