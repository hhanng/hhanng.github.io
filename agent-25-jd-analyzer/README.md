# Internship JD Analyzer

Paste a job description and your skills to get an animated match score, color-coded keyword breakdown, a clear apply/skip verdict, and the top 3 resume tips — powered by the Gemini API.

Part of the [hhanng.github.io](https://hhanng.github.io) agent portfolio · Career

---

## What It Does

- Scores your fit against the JD on a 0–100 scale with an animated score ring
- Color-coded keyword chips: green (you have it), red (you're missing it), blue (nice-to-have)
- Delivers a clear verdict: **Apply Now**, **Apply with Cover Letter**, or **Skill Up First**
- Surfaces the top 3 resume tips specific to that posting so you know exactly what to tweak

## How to Use

1. Open `index.html` in your browser (or visit the live demo from the portfolio)
2. Paste the full job description into the JD field
3. List your current skills and experience in the skills field
4. Click **Analyze**
5. Watch the score ring animate to your match percentage
6. Review the keyword chips and verdict, then act on the resume tips

## Tech Stack

- HTML / CSS / Vanilla JavaScript
- [Gemini API](https://ai.google.dev/) (gemini-2.0-flash) for analysis and recommendations
- CSS animations for the score ring
- No build step — runs entirely in the browser

---

[Back to Portfolio](https://hhanng.github.io)
