# Active Recall Coach

A flashcard-style study tool that turns your raw notes into recall questions, tracks your confidence, and drills you on your weak spots — powered by the Gemini API.

Part of the [hhanng.github.io](https://hhanng.github.io) agent portfolio · Study & CS

---

## What It Does

- Accepts pasted notes and uses Gemini to generate targeted Q&A flashcards
- Lets you self-rate your confidence on each answer (got it / unsure / missed it)
- Produces a summary highlighting your weakest areas after each session
- Re-drills the concepts you struggled with until you've locked them in

## How to Use

1. Open `index.html` in your browser (or visit the live demo from the portfolio)
2. Paste your study notes into the text area
3. Click **Generate Flashcards** — Gemini creates a set of recall questions
4. For each card, read the question, recall your answer, then reveal the answer
5. Rate yourself: Got It / Unsure / Missed It
6. After all cards, review the **Weak Spots Summary** and click **Re-Drill** to focus on gaps

## Tech Stack

- HTML / CSS / Vanilla JavaScript
- [Gemini API](https://ai.google.dev/) (gemini-2.0-flash) for flashcard generation
- No build step — runs entirely in the browser

---

[Back to Portfolio](https://hhanng.github.io)
