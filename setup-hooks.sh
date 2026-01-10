#!/bin/bash
#
# Setup script to install Git hooks
# Run this after cloning the repository or when hooks are updated
#

echo "🔧 Setting up Git hooks..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "❌ Error: Not a git repository. Run this script from the project root."
  exit 1
fi

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
if [ -f "hooks/pre-commit" ]; then
  cp hooks/pre-commit .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit
  echo "✅ Installed pre-commit hook"
else
  echo "❌ Error: hooks/pre-commit not found"
  exit 1
fi

echo ""
echo "✅ Git hooks setup complete!"
echo ""
echo "The pre-commit hook will automatically generate posts.json when you commit."
