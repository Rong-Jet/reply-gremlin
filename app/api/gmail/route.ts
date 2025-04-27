import { NextResponse } from 'next/server';
import { handleGmailFunctionCall } from '@/lib/gmail-functions';

export async function POST(request: Request) {
  try {
    const { functionName, args } = await request.json();
    
    if (!functionName) {
      return NextResponse.json({ error: 'Function name is required' }, { status: 400 });
    }
    
    const result = await handleGmailFunctionCall(functionName, args || {});
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in Gmail API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 