#!/bin/bash
# Run this script from the Replit Shell to push changes to GitHub
# Usage: bash push-to-github.sh "your commit message"

MESSAGE="${1:-Update from Replit}"
TOKEN="${GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable not set"
  exit 1
fi

REMOTE="https://x-access-token:${TOKEN}@github.com/mnrnauman/Travel-Flow-System.git"

export GIT_AUTHOR_NAME="Replit"
export GIT_AUTHOR_EMAIL="replit@users.noreply.github.com"
export GIT_COMMITTER_NAME="Replit"
export GIT_COMMITTER_EMAIL="replit@users.noreply.github.com"

# Remove any stale lock files
rm -f .git/index.lock .git/config.lock

git add -A
git commit -m "$MESSAGE" || echo "Nothing to commit"
git push "$REMOTE" HEAD:main
echo "Done! Pushed to https://github.com/mnrnauman/Travel-Flow-System"
