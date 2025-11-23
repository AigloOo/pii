
// Unbounded Spigot Algorithm for Pi
// Based on the work of Jeremy Gibbons

let isRunning = false;

self.onmessage = function (e) {
    if (e.data === 'start') {
        if (!isRunning) {
            isRunning = true;
            generatePi();
        }
    } else if (e.data === 'stop') {
        isRunning = false;
    }
};

function generatePi() {
    let q = 1n;
    let r = 0n;
    let t = 1n;
    let k = 1n;
    let n = 3n;
    let l = 3n;

    // Batch size for sending updates to main thread to avoid flooding
    const BATCH_SIZE = 100;
    let batch = '';
    let count = 0;

    function step() {
        if (!isRunning) return;

        // Run a chunk of calculations
        const startTime = performance.now();
        while (performance.now() - startTime < 10) { // Run for 10ms
            if (4n * q + r - t < n * t) {
                batch += n.toString();
                count++;

                if (batch.length >= BATCH_SIZE) {
                    self.postMessage({ type: 'digits', digits: batch });
                    batch = '';
                }

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

        // Schedule next chunk
        setTimeout(step, 0);
    }

    step();
}
