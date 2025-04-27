import { NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/gmail-api';
import path from 'path';
import os from 'os';

export async function GET() {
  try {
    const credentialsPath = path.join(os.homedir(), '.gmail-mcp', 'credentials.json');
    const verification = await verifyCredentials();
    
    const result = {
      homeDir: os.homedir(),
      credentialsPath,
      verification,
      platform: os.platform(),
      type: os.type(),
      userInfo: os.userInfo().username,
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in verify API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 