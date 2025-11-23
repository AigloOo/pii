import { NextResponse } from 'next/server';
import { startCalculation } from '@/lib/calculator';

export async function GET() {
  // Trigger calculation loop if not running
  startCalculation();
  
  return NextResponse.json({ status: 'ok', message: 'Calculation triggered' });
}
