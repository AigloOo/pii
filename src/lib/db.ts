import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'pi.db');
const db = new Database(dbPath);

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    q TEXT,
    r TEXT,
    t TEXT,
    k TEXT,
    n TEXT,
    l TEXT,
    startTime INTEGER,
    totalDigits INTEGER
  );

  CREATE TABLE IF NOT EXISTS digits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chunk TEXT,
    startIndex INTEGER
  );
  
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    count INTEGER,
    timeTaken INTEGER
  );
`);

// Initialize state if not exists
const initStmt = db.prepare('SELECT count(*) as count FROM state');
const result = initStmt.get() as { count: number };

if (result.count === 0) {
    db.prepare(`
    INSERT INTO state (id, q, r, t, k, n, l, startTime, totalDigits)
    VALUES (1, '1', '0', '1', '1', '3', '3', ?, 0)
  `).run(Date.now());
}

export interface PiState {
    q: string;
    r: string;
    t: string;
    k: string;
    n: string;
    l: string;
    startTime: number;
    totalDigits: number;
}

export const getDbState = (): PiState => {
    return db.prepare('SELECT * FROM state WHERE id = 1').get() as PiState;
};

export const updateDbState = (state: Partial<PiState>) => {
    const keys = Object.keys(state);
    if (keys.length === 0) return;

    const setClause = keys.map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE state SET ${setClause} WHERE id = 1`).run(state);
};

export const appendDigits = (chunk: string) => {
    const state = getDbState();
    const startIndex = state.totalDigits;

    db.transaction(() => {
        db.prepare('INSERT INTO digits (chunk, startIndex) VALUES (?, ?)').run(chunk, startIndex);
        db.prepare('UPDATE state SET totalDigits = totalDigits + ? WHERE id = 1').run(chunk.length);
    })();
};

export const getDigits = (limit: number = 1000, offset: number = 0): string => {
    // This is a simplified retrieval. For huge datasets, we'd need smarter chunking.
    // We'll fetch chunks that cover the range.
    // For now, let's just return the last 'limit' digits for the UI stream.

    const state = getDbState();
    const total = state.totalDigits;
    const start = Math.max(0, total - limit);

    // Find chunks that contain the range [start, total]
    const chunks = db.prepare('SELECT chunk FROM digits WHERE startIndex + length(chunk) > ? ORDER BY id ASC').all(start) as { chunk: string }[];

    let fullStr = chunks.map(c => c.chunk).join('');
    // Trim to fit the requested window (approximate)
    return fullStr.slice(-limit);
};

export const searchSequence = (seq: string): number => {
    // Naive search: iterate over all chunks. 
    // In a real massive DB, we'd need an index or a specialized search engine.
    // For "infinite" pi, we can search chunk by chunk.

    const chunks = db.prepare('SELECT chunk, startIndex FROM digits ORDER BY id ASC').all() as { chunk: string, startIndex: number }[];

    // We need to handle overlaps. Concatenate everything? No, memory issue.
    // Search in stream.

    // Simplified: Search in concatenated chunks (careful with memory)
    // Better: Search chunk + overlap

    let previousTail = "";

    for (const row of chunks) {
        const currentText = previousTail + row.chunk;
        const index = currentText.indexOf(seq);

        if (index !== -1) {
            // Found!
            // Calculate absolute index
            // If found in previousTail part, it's row.startIndex - previousTail.length + index
            // Wait, row.startIndex is the start of THIS chunk.
            // The text we searched is (previousTail + row.chunk).
            // The start index of this combined text is (row.startIndex - previousTail.length).
            return (row.startIndex - previousTail.length) + index;
        }

        // Keep tail for next overlap (length of seq - 1)
        previousTail = row.chunk.slice(-(seq.length - 1));
    }

    return -1;
};

export const addHistory = (count: number, timeTaken: number) => {
    db.prepare('INSERT INTO history (timestamp, count, timeTaken) VALUES (?, ?, ?)').run(Date.now(), count, timeTaken);
    // Keep history limited
    db.prepare('DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY id DESC LIMIT 100)').run();
};

export const getHistory = () => {
    return db.prepare('SELECT * FROM history ORDER BY id ASC').all();
};

export default db;
