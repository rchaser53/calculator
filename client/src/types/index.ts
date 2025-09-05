export interface Account {
  balance: number;
  comment?: string;
}

export interface Position {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  lots: number;
  entryPrice: number;
  entryDate?: string;
  comment?: string;
}

export interface PositionDetail {
  id: string;
  side: string;
  lots: number;
  entryPrice: number;
  units: number;
  pnl: number;
  comment?: string;
}

export interface Settings {
  leverage: number;
  marginCallLevel: number;
  stopOutLevel: number;
  analysis: {
    minRate: number;
    maxRate: number;
    step: number;
    comment?: string;
  };
}

export interface CurrentAnalysis {
  rate: number;
  totalPnL: number;
  marginLevel: number;
  equity: number;
  requiredMargin: number;
  positionDetails: PositionDetail[];
}

export interface AnalysisResult {
  rate: number;
  marginLevel: number;
  totalPnL: number;
  equity: number;
  requiredMargin: number;
  riskLevel: 'danger' | 'warning' | 'caution' | 'safe';
}

export interface CriticalLevels {
  marginCall100: number | null;
  stopOut50: number | null;
}

export interface FXData {
  account: Account;
  positions: Position[];
  currentPrice: number;
  settings: Settings;
  analysisResults: AnalysisResult[];
  currentAnalysis: CurrentAnalysis;
  criticalLevels: CriticalLevels;
}

export interface ConfigData {
  account: Pick<Account, 'balance'>;
  currentPrice: number;
  positions: Position[];
}

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
}