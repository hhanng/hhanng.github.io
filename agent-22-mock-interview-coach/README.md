# Mock Interview Coach

A chat-style interview simulator where Gemini plays the interviewer, asks role-specific questions, and gives you detailed feedback after every answer.

Part of the [hhanng.github.io](https://hhanng.github.io) agent portfolio · Career

---

## What It Does

- Lets you configure the target role, interview stage (HR screen, technical, behavioral), and difficulty
- Conducts a realistic 5-question interview in a back-and-forth chat interface
- Delivers per-answer feedback covering content, clarity, and areas to improve
- Produces a Session Report at the end with an overall score and personalized coaching notes

## How to Use

1. Open `index.html` in your browser (or visit the live demo from the portfolio)
2. Select your target role, interview stage, and difficulty level
3. Click **Start Interview** — Gemini opens with the first question
4. Type your answer and hit **Send**
5. Read the immediate feedback, then continue to the next question
6. After question 5, click **View Session Report** for your score and coaching summary

## Tech Stack

- HTML / CSS / Vanilla JavaScript
- [Gemini API](https://ai.google.dev/) (gemini-2.0-flash) for question generation and feedback
- No build step — runs entirely in the browser

---

[Back to Portfolio](https://hhanng.github.io)
