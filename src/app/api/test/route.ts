import { NextResponse } from 'next/server';
import { getChatCompletion } from '@/lib/ai/openai';

export async function GET() {
  try {
    const haiku = await getChatCompletion('Write a haiku about AI');
    
    return NextResponse.json({
      success: true,
      haiku
    });
  } catch (error) {
    console.error('Error testing OpenAI:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 