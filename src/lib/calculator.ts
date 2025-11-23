import { getDbState, updateDbState, appendDigits, addHistory } from './db';
import { EventEmitter } from 'events';

// Singleton event emitter
export const piEvents = new EventEmitter();
// Increase limit for multiple listeners (SSE clients)
piEvents.setMaxListeners(100);

let isRunning = false;

const serializeBigInt = (n: bigint) => n.toString();
const deserializeBigInt = (s: string) => BigInt(s);

export function startCalculation() {
  if (isRunning) return;
  isRunning = true;
  console.log("Starting background Pi calculation...");

  const runBatch = () => {
    try {
      const state = getDbState();
      let q = deserializeBigInt(state.q);
      let r = deserializeBigInt(state.r);
      let t = deserializeBigInt(state.t);
      let k = deserializeBigInt(state.k);
      let n = deserializeBigInt(state.n);
      let l = deserializeBigInt(state.l);

      let newDigits = "";
      // Calculate a batch
      // Adjust batch size for performance vs responsiveness
      const BATCH_SIZE = 50;
      const startTime = performance.now();

      // Run a few iterations
      for (let i = 0; i < BATCH_SIZE * 20; i++) {
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

      const timeTaken = performance.now() - startTime;

      if (newDigits.length > 0) {
        appendDigits(newDigits);
        updateDbState({
          q: serializeBigInt(q),
          r: serializeBigInt(r),
          t: serializeBigInt(t),
          k: serializeBigInt(k),
          n: serializeBigInt(n),
          l: serializeBigInt(l)
        });

        // Log history every 100 digits
        if ((state.totalDigits + newDigits.length) % 100 < newDigits.length) {
          addHistory(state.totalDigits + newDigits.length, timeTaken);
        }

        // Emit event for stream
        piEvents.emit('update', {
          newDigits,
          totalDigits: state.totalDigits + newDigits.length
        });
      }

      // Schedule next run immediately to keep it "infinite"
      // Use setImmediate if available or setTimeout 0
      // On Vercel, we might want to yield more often to avoid blocking the event loop too much
      setTimeout(runBatch, 10);
    } catch (error) {
      console.error("Calculation error:", error);
      // If readonly error, we might be on Vercel cold start or permission issue
      // We can't do much but retry or stop.
      // Retry after delay on error
      setTimeout(runBatch, 2000);
    }
  };

  runBatch();
}
