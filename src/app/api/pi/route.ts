import { NextResponse } from 'next/server';
import { getPiState, updatePiState, deserializeBigInt, serializeBigInt } from '@/lib/store';

// Prevent caching
export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(getPiState());
}

export async function POST() {
    const state = getPiState();

    // If not "running", we can still calculate if forced, but let's respect the flag
    // Actually, user said "server calculates all the time", so we ignore isRunning for the calculation loop
    // We'll just compute a batch.

    let q = deserializeBigInt(state.q);
    let r = deserializeBigInt(state.r);
    let t = deserializeBigInt(state.t);
    let k = deserializeBigInt(state.k);
    let n = deserializeBigInt(state.n);
    let l = deserializeBigInt(state.l);

    let newDigits = "";
    const BATCH_SIZE = 50; // Calculate 50 digits per request
    const startTime = performance.now();

    // Unbounded Spigot Algorithm
    for (let i = 0; i < BATCH_SIZE * 100; i++) { // Safety break to prevent timeout
        if (newDigits.length >= BATCH_SIZE) break;

        if (4n * q + r - t < n * t) {
            newDigits += n.toString();

            let nr = 10n * (r - n * t);
            n = ((10n * (3n * q + r)) / t) - 10n * n;
            q *= 10n;
            r = nr;
        } else {
            let nr = (2n * q + r) * l;
            let nn = (q * (7n * k + 2n) + r * l) / (t * l);
            q *= k;
            t *= l;
            l += 2n;
            k += 1n;
            n = nn;
            r = nr;
        }
    }

    const endTime = performance.now();
    const timeTaken = endTime - startTime;

    // Update history occasionally
    const currentHistory = [...state.history];
    if (newDigits.length > 0 && (state.digits.length + newDigits.length) % 100 === 0) {
        currentHistory.push({
            timestamp: Date.now(),
            count: state.digits.length + newDigits.length,
            timeTaken: timeTaken
        });
        // Keep history size manageable
        if (currentHistory.length > 50) currentHistory.shift();
    }

    const newState = updatePiState({
        digits: state.digits + newDigits,
        q: serializeBigInt(q),
        r: serializeBigInt(r),
        t: serializeBigInt(t),
        k: serializeBigInt(k),
        n: serializeBigInt(n),
        l: serializeBigInt(l),
        history: currentHistory
    });

    return NextResponse.json({
        success: true,
        newDigitsCount: newDigits.length,
        totalDigits: newState.digits.length,
        history: newState.history
    });
}
