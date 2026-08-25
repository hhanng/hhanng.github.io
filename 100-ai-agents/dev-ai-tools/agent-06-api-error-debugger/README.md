# API Error Debugger

**Category:** AI Dev

Paste any API error message and get a clear, plain-English explanation plus a ready-to-use code fix — in seconds. Stop Googling cryptic status codes.

## Features

- Accepts raw error messages, stack traces, or JSON error payloads from any API
- Returns a plain-English diagnosis explaining what went wrong and why
- Provides a corrected code snippet tailored to the detected language or framework
- Handles common culprits: auth errors, rate limits, malformed requests, CORS, timeouts, and more

## How to Use

1. Open `index.html` in your browser (or visit the live demo on the portfolio).
2. Enter your Gemini API key in the settings panel.
3. Paste your API error message or stack trace into the input box.
4. Optionally add context (e.g., which API you're calling, your code snippet).
5. Click **Debug** and review the explanation and suggested fix.

## Tech Stack

- HTML / CSS / JavaScript (vanilla)
- [Google Gemini API](https://ai.google.dev/) (`gemini-2.0-flash`)
- No build step — open and go

## Part of My Portfolio

Built as Agent #06 in my 100-agent developer portfolio.
Visit the full portfolio at [hhanng.github.io](https://hhanng.github.io).
