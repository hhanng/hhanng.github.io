# ☁️ Agent #95 — Cloud Architecture Designer

> Drag-and-drop cloud diagrams, system design patterns, and cost estimation in one tool.

Part of the [100 AI Agents Challenge](https://hhanng.github.io)

## 🔴 Live: https://hhanng.github.io/agent-95-cloud-architecture-designer/

## Features
- Drag-and-drop canvas: place AWS/GCP/Azure components, draw SVG connections, save/load as JSON
- 30 cloud components with multi-cloud equivalents table
- 10 system design patterns (URL Shortener, Social Feed, Video Streaming, etc.)
- Cost estimator: 4 sliders → AWS/GCP/Azure comparison table

## Tech
Single-file HTML app — drag via HTML5 Drag API, connections via inline SVG `<line>` elements, persistence via localStorage JSON.
