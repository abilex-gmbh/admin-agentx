export interface CreditUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  tokenCredits: number;
  lastSetAt: string | null;
  dailyUsage: number;
  projectedDays: number | null;
}

export interface UsageTelemetry {
  tokenType: string;
  model?: string;
  rate?: number;
  rawAmount?: number;
  tokenValue?: number;
  inputTokens?: number;
  writeTokens?: number;
  readTokens?: number;
}

export interface LogEntry {
  createdAt: string;
  sender?: string;
  requestOrResponse: 'request' | 'response';
  text?: string;
  content?: Array<{ text?: string }>;
  model?: string;
  endpoint?: string;
  tokenCount?: number;
  summaryTokenCount?: number;
  finishReason?: string;
  error: boolean;
  chatType: string;
  projectContextApplied: boolean;
  addedContext?: Record<string, string | number | boolean | null>;
  telemetry: UsageTelemetry[];
}
