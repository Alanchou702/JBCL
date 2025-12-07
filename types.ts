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

export interface DiscoveryItem {
  title: string;
  url: string;
  snippet: string;
  source: string;
}