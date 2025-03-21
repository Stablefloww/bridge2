import { NextResponse } from 'next/server';
import { processNLPCommand } from '@/lib/nlp/bridgeNLP';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { command } = body;
    
    if (!command) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing command' 
        }, 
        { status: 400 }
      );
    }
    
    // Process the natural language command
    const result = await processNLPCommand(command);
    
    if (!result) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to process command' 
        }, 
        { status: 400 }
      );
    }
    
    // Determine if we have all the required information
    const missingInfo = [];
    if (!result.destinationChain) missingInfo.push('destination chain');
    if (!result.token) missingInfo.push('token');
    if (!result.amount) missingInfo.push('amount');
    
    return NextResponse.json({
      success: missingInfo.length === 0,
      result: {
        sourceChain: result.sourceChain || 'base', // Default to Base if not specified
        destinationChain: result.destinationChain,
        token: result.token,
        amount: result.amount,
        gasPreference: result.gasPreference || 'normal',
        confidence: result.confidence
      },
      missingInfo,
      needsClarification: missingInfo.length > 0
    });
  } catch (error) {
    console.error('NLP API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error processing command' 
      }, 
      { status: 500 }
    );
  }
} 