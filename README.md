# Infinite Pi Calculator

A web application that calculates Pi infinitely using a server-side streaming algorithm.

## Features

- **Server-Side Calculation:** Calculates Pi digits continuously on the server using the Unbounded Spigot Algorithm.
- **Persistence:** Stores calculated digits and state in a SQLite database.
- **Real-time Streaming:** Uses Server-Sent Events (SSE) to stream new digits to connected clients in real-time.
- **Virtual Scrolling:** Efficiently renders millions of digits using `react-virtuoso`.
- **Search:** Server-side search functionality to find sequences within the calculated digits.
- **Modern UI:** Dark mode, clean typography, and responsive design inspired by Vercel.
- **Performance Stats:** Visualizes calculation speed and distribution using Recharts.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Database:** SQLite (better-sqlite3)
- **Streaming:** Server-Sent Events (SSE)
- **Visualization:** Recharts
- **Icons:** Lucide React

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

## Deployment on Vercel

This project is configured for deployment on Vercel.

### Important Notes for Vercel:

1.  **Read-Only Filesystem:** Vercel Serverless Functions run on a read-only filesystem. This project is configured to use the system's temporary directory (`/tmp`) for the SQLite database when running in production (Vercel).
    *   **Warning:** The `/tmp` directory is **ephemeral**. Data will be lost when the serverless function is spun down or redeployed. For permanent persistence, consider connecting an external database like Turso, PostgreSQL, or Redis.

2.  **Background Calculation:** Serverless functions have execution time limits. To simulate "infinite" calculation:
    *   A **Cron Job** is configured (`vercel.json`) to ping the `/api/pi/cron` endpoint every minute.
    *   This keeps the calculation loop active or restarts it if the instance was frozen.

## How it Works

The application uses the **Unbounded Spigot Algorithm** by Jeremy Gibbons to stream Pi digits one by one.
- **Backend:** A Node.js process (triggered by requests or cron) runs the algorithm and saves state to SQLite.
- **Frontend:** Connects via SSE (`/api/pi/stream`) to receive updates and appends them to the virtualized list.
