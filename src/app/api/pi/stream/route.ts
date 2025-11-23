import { NextRequest, NextResponse } from 'next/server';
import { getDbState, getHistory, getDigits } from '@/lib/db';
import { startCalculation, piEvents } from '@/lib/calculator';

// Ensure calculation is running in the background
// This will start the loop the first time this file is imported/executed
startCalculation();

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            const sendEvent = (data: any) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch (e) {
                    // Controller might be closed
                }
            };

            // Send initial state
            const state = getDbState();
            const history = getHistory();
            const lastDigits = getDigits(5000); // Send more initial context

            sendEvent({
                type: 'init',
                totalDigits: state.totalDigits,
                startTime: state.startTime,
                history: history,
                digits: lastDigits
            });

            // Listener for updates
            const onUpdate = (data: any) => {
                // Fetch latest history to send to client
                // In a high-scale app, we'd optimize this, but for local it's fine
                const currentHistory = getHistory();

                sendEvent({
                    type: 'update',
                    newDigits: data.newDigits,
                    totalDigits: data.totalDigits,
                    history: currentHistory
                });
            };

            piEvents.on('update', onUpdate);

            req.signal.addEventListener('abort', () => {
                piEvents.off('update', onUpdate);
                controller.close();
            });
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
