# Git Commit Writer

**Category:** AI Dev

Never stare at an empty commit message again. Describe your changes in plain English and instantly receive three conventional-commit-style messages to choose from.

## Features

- Generates three distinct commit message options for every description
- Follows the Conventional Commits spec (`feat:`, `fix:`, `refactor:`, `docs:`, etc.)
- Optional scope and breaking-change flags for monorepo or large-project workflows
- One-click copy for any of the three suggestions

## How to Use

1. Open `index.html` in your browser (or visit the live demo on the portfolio).
2. Enter your Gemini API key in the settings panel.
3. Type a short description of what you changed (e.g., "added login form validation").
4. Optionally specify a scope or check the breaking-change box.
5. Click **Generate** and copy your preferred message straight into your terminal.

## Tech Stack

- HTML / CSS / JavaScript (vanilla)
- [Google Gemini API](https://ai.google.dev/) (`gemini-2.0-flash`)
- No build step — open and go

## Part of My Portfolio

Built as Agent #09 in my 100-agent developer portfolio.
Visit the full portfolio at [hhanng.github.io](https://hhanng.github.io).
