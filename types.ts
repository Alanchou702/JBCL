
export interface Violation {
  type: string;
  law: string;
  explanation: string;
  originalText: string;
}

export interface AnalysisResult {
  productName: string;
  violations: Violation[];
  summary: string;
  isAd: boolean;
  publicationDate?: string;
  isOldArticle?: boolean;
  isDuplicate?: boolean; // New flag for repeat offenders
}

export interface Complainee {
  id: string;
  name: string;
  addedAt: number;
  note?: string;
}

export enum InputMode {
  TEXT = 'TEXT',
  URL = 'URL'
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: AnalysisResult | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  productName: string;
  summary: string;
  result: AnalysisResult;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// Fix: Add missing DiscoveryItem interface required by services/geminiService.ts and components/DiscoveryPanel.tsx
export interface DiscoveryItem {
  title: string;
  url: string;
  source: string;
  snippet?: string;
}
