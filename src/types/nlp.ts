export interface CommandIntent {
  type: 'bridge' | 'info' | 'help' | 'settings' | 'unknown';
  confidence: number;
}

export interface CommandEntity {
  type: 'chain' | 'token' | 'amount' | 'time';
  value: string;
  confidence: number;
  role?: 'source' | 'destination';
}

export interface CommandAnalysis {
  intent: CommandIntent;
  entities: CommandEntity[];
  originalText: string;
  normalizedText: string;
  missingInformation: string[];
  ambiguities: {
    type: string;
    options: string[];
  }[];
  confidence: number;
}

export interface ProcessCommandResponse {
  success: boolean;
  analysis: CommandAnalysis;
  interpretation: string;
  error?: string;
}

export interface NLPProviderConfig {
  apiKey: string;
  model: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
} 