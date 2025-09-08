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
  swapPoint?: number; // スワップポイント (デフォルト: 1)
}

export interface PositionDetail {
  id: string;
  side: string;
  lots: number;
  entryPrice: number;
  units: number;
  pnl: number;
  comment?: string;
  swapPoint?: number;
}

export interface SwapCalculation {
  days: number;
  dailySwap: number;
  totalSwap: number;
  positionSwaps: Array<{
    id: string;
    lots: number;
    dailySwap: number;
    totalSwap: number;
  }>;
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
  swapCalculation?: SwapCalculation;
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