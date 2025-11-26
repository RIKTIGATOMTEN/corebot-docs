#!/bin/bash
set -e
cd "$(dirname "$0")"

# Initialize git if needed
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    git remote add origin https://github.com/RIKTIGATOMTEN/CoreBot-Docs.git
    git branch -M main
fi

# Push source code to main
echo "Pushing source code to main..."
git add .
git commit -m "Update documentation source" || echo "No changes to commit"
git push -f origin main  # Force push for initial setup

# Build the site
echo "Building VitePress site..."
rm -rf .vitepress/dist
npx vitepress build

# Deploy to gh-pages branch
echo "Deploying to gh-pages..."
cd .vitepress/dist
git init
git remote add origin https://github.com/RIKTIGATOMTEN/CoreBot-Docs.git
git add .
git commit -m "Deploy latest VitePress build"
git branch -M gh-pages
git push -f origin gh-pages

echo "Deployment complete!"
echo "Source pushed to main, build deployed to gh-pages"