# Infinite Pi Calculator

A modern, Vercel-style web application that calculates Pi infinitely using a streaming algorithm.

## Features

- **Infinite Calculation:** Uses a Web Worker to calculate Pi digits continuously without freezing the UI.
- **Real-time Statistics:** Monitors digits calculated, time elapsed, and calculation speed.
- **Search:** Allows searching for specific number sequences within the calculated digits.
- **Modern UI:** Dark mode, clean typography, and responsive design inspired by Vercel.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Logic:** Web Workers + BigInt (Unbounded Spigot Algorithm)

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

This project is optimized for deployment on Vercel.

1.  Push to GitHub.
2.  Import project in Vercel.
3.  Deploy.

## How it Works

The application uses the **Unbounded Spigot Algorithm** by Jeremy Gibbons to stream Pi digits one by one. This is executed in a separate thread (Web Worker) to ensure the main thread remains responsive for UI updates and interactions.
