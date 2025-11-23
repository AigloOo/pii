
// Global store to simulate a database
// In a real production environment, this should be Redis, Postgres, or MongoDB

interface PiState {
    digits: string;
    q: string; // BigInt as string for serialization
    r: string;
    t: string;
    k: string;
    n: string;
    l: string;
    startTime: number;
    history: { timestamp: number; count: number; timeTaken: number }[];
    isRunning: boolean;
}

// Initial state
let globalState: PiState = {
    digits: "",
    q: "1",
    r: "0",
    t: "1",
    k: "1",
    n: "3",
    l: "3",
    startTime: Date.now(),
    history: [],
    isRunning: true
};

export const getPiState = () => {
    return globalState;
};

export const updatePiState = (newState: Partial<PiState>) => {
    globalState = { ...globalState, ...newState };
    return globalState;
};

// Helper to convert BigInt to string and back
export const serializeBigInt = (n: bigint) => n.toString();
export const deserializeBigInt = (s: string) => BigInt(s);
