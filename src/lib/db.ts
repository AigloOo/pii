import { sql } from '@vercel/postgres';

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

// Ensure tables exist
export async function initDb() {
    try {
        await sql`
      CREATE TABLE IF NOT EXISTS state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        q TEXT,
        r TEXT,
        t TEXT,
        k TEXT,
        n TEXT,
        l TEXT,
        startTime BIGINT,
        totalDigits INTEGER
      );
    `;

        await sql`
      CREATE TABLE IF NOT EXISTS digits (
        id SERIAL PRIMARY KEY,
        chunk TEXT,
        startIndex INTEGER
      );
    `;

        await sql`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        timestamp BIGINT,
        count INTEGER,
        timeTaken INTEGER
      );
    `;

        const { rows } = await sql`SELECT count(*) as count FROM state`;
        if (rows[0].count == 0) {
            const now = Date.now();
            await sql`
        INSERT INTO state (id, q, r, t, k, n, l, startTime, totalDigits)
        VALUES (1, '1', '0', '1', '1', '3', '3', ${now}, 0)
      `;
        }
    } catch (e) {
        console.error("DB Init Error:", e);
    }
}

export const getDbState = async (): Promise<PiState> => {
    await initDb();
    const { rows } = await sql`SELECT * FROM state WHERE id = 1`;
    // Convert BigInt to number for startTime/totalDigits if needed, but they are likely strings or numbers from driver
    // Postgres driver returns strings for BIGINT usually.
    const row = rows[0];
    return {
        ...row,
        startTime: Number(row.starttime), // Postgres lowercases column names
        totalDigits: Number(row.totaldigits)
    } as unknown as PiState;
};

export const updateDbState = async (state: Partial<PiState>) => {
    // We fetch current to merge because we need to update all fields or build dynamic query
    // For simplicity, we assume we want to update the fields provided.
    // But sql template tag requires fixed structure or careful building.
    // Let's just update specific fields if they exist, or fetch-merge-update.
    
    // Fetch-Merge-Update is safest for now.
    const currentState = await getDbState();
    const newState = { ...currentState, ...state };

    await sql`
    UPDATE state SET 
      q = ${newState.q},
      r = ${newState.r},
      t = ${newState.t},
      k = ${newState.k},
      n = ${newState.n},
      l = ${newState.l},
      totalDigits = ${newState.totalDigits}
    WHERE id = 1
  `;
};

export const appendDigits = async (chunk: string) => {
    const state = await getDbState();
    const startIndex = state.totalDigits;

    await sql`INSERT INTO digits (chunk, startIndex) VALUES (${chunk}, ${startIndex})`;
    // Note: We don't update totalDigits here, it's done in updateDbState in the calculator
};

export const getDigits = async (limit: number = 1000, offset: number = 0): Promise<string> => {
    const state = await getDbState();
    const total = state.totalDigits;
    const start = Math.max(0, total - limit);

    const { rows } = await sql`
    SELECT chunk FROM digits 
    WHERE startIndex + length(chunk) > ${start} 
    ORDER BY id ASC
  `;

    let fullStr = rows.map(c => c.chunk).join('');
    return fullStr.slice(-limit);
};

export const searchSequence = async (seq: string): Promise<number> => {
    const { rows } = await sql`
    SELECT chunk, startIndex FROM digits 
    WHERE chunk LIKE ${'%' + seq + '%'}
    ORDER BY id ASC
    LIMIT 1
  `;

    if (rows.length > 0) {
        const row = rows[0];
        const index = row.chunk.indexOf(seq);
        return row.startindex + index;
    }
    return -1;
};

export const addHistory = async (count: number, timeTaken: number) => {
    const now = Date.now();
    await sql`INSERT INTO history (timestamp, count, timeTaken) VALUES (${now}, ${count}, ${timeTaken})`;
    
    // Cleanup
    await sql`
    DELETE FROM history 
    WHERE id NOT IN (
      SELECT id FROM history ORDER BY id DESC LIMIT 100
    )
  `;
};

export const getHistory = async () => {
    const { rows } = await sql`SELECT * FROM history ORDER BY id ASC`;
    return rows.map(r => ({
        ...r,
        timestamp: Number(r.timestamp)
    }));
};

