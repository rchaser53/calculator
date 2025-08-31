/**
 * USD/JPY専用 FX証拠金維持率分析ツール
 * ドル円レートのテーブル表示による詳細分析
 */

const fs = require('fs');

/**
 * 設定ファイルを読み込む
 * @param {string} configPath - 設定ファイルのパス
 * @returns {Object} 設定データ
 */
function loadConfig(configPath = './fx-usdjpy-config.json') {
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    throw new Error(`設定ファイルの読み込みに失敗しました: ${error.message}`);
  }
}

/**
 * USD/JPYポジションの損益を計算する（楽天FX仕様）
 * @param {Object} position - ポジション情報
 * @param {number} currentRate - 現在のレート
 * @returns {Object} 損益情報
 */
function calculateUsdJpyPnL(position, currentRate) {
  const { side, lots, entryPrice } = position;
  const lotSize = 10000; // 楽天FX: 1ロット = 1万通貨（10ロットで1円動くと10万円の損益）
  const units = lots * lotSize;
  
  let pnl;
  if (side.toLowerCase() === 'buy') {
    pnl = (currentRate - entryPrice) * units;
  } else {
    pnl = (entryPrice - currentRate) * units;
  }
  
  return {
    pnl: pnl,
    units: units
  };
}

/**
 * 必要証拠金を計算する（楽天FX仕様）
 * @param {Object} position - ポジション情報
 * @param {number} currentRate - 現在のレート
 * @param {number} leverage - レバレッジ
 * @returns {number} 必要証拠金
 */
function calculateRequiredMargin(position, currentRate, leverage) {
  const lotSize = 10000; // 楽天FX: 1ロット = 1万通貨
  const units = position.lots * lotSize;
  const notionalValue = units * currentRate;
  return notionalValue / leverage;
}

/**
 * 証拠金維持率を計算する
 * @param {Object} config - 設定データ
 * @param {number} rate - USD/JPYレート
 * @returns {Object} 証拠金維持率情報
 */
function calculateMarginLevelAtRate(config, rate) {
  const { account, position, settings } = config;
  
  // 損益計算
  const pnlInfo = calculateUsdJpyPnL(position, rate);
  const requiredMargin = calculateRequiredMargin(position, rate, settings.leverage);
  
  // 有効証拠金（純資産 + 含み損益）
  const equity = account.balance + pnlInfo.pnl;
  
  // 証拠金維持率（％）
  const marginLevel = requiredMargin > 0 ? (equity / requiredMargin) * 100 : 0;
  
  return {
    rate: rate,
    pnl: pnlInfo.pnl,
    equity: equity,
    requiredMargin: requiredMargin,
    marginLevel: marginLevel
  };
}

/**
 * USD/JPYレート範囲での詳細テーブルを表示
 * @param {string} configPath - 設定ファイルのパス
 */
function displayUsdJpyAnalysisTable(configPath = './fx-usdjpy-config.json') {
  try {
    const config = loadConfig(configPath);
    const { position, settings } = config;
    const { minRate, maxRate, step } = settings.analysis;
    
    console.log('='.repeat(80));
    console.log('                 USD/JPY 証拠金維持率分析テーブル (楽天FX仕様)');
    console.log('='.repeat(80));
    
    // 基本情報の表示
    console.log(`口座残高: ${config.account.balance.toLocaleString()}円`);
    console.log(`ポジション: ${position.side.toUpperCase()} ${position.lots}ロット (${(position.lots * 10000).toLocaleString()}通貨)`);
    console.log(`建値: ${position.entryPrice.toFixed(2)}円`);
    console.log(`現在価格: ${position.currentPrice.toFixed(2)}円`);
    console.log(`レバレッジ: ${settings.leverage}倍`);
    console.log(`楽天FX仕様: 1ロット = 1万通貨 (10ロットで1円動くと10万円の損益)`);
    console.log(`分析範囲: ${minRate.toFixed(1)}円 ～ ${maxRate.toFixed(1)}円 (${step}円刻み)`);
    console.log('');
    
    // テーブルヘッダー
    console.log('-'.repeat(80));
    console.log('USD/JPY  |  黒字/赤字金額  | 証拠金維持率 |     状態     |  必要証拠金');
    console.log('レート   |      (円)      |     (%)     |              |     (円)');
    console.log('-'.repeat(80));
    
    // レートごとの計算結果をテーブルで表示
    const results = [];
    for (let rate = minRate; rate <= maxRate; rate += step) {
      const analysis = calculateMarginLevelAtRate(config, rate);
      
      // 状態の判定
      let status;
      let statusColor = '';
      if (analysis.marginLevel <= 50) {
        status = '🚨強制決済';
        statusColor = '\x1b[31m'; // 赤
      } else if (analysis.marginLevel <= 100) {
        status = '⚠️ 警告';
        statusColor = '\x1b[33m'; // 黄
      } else if (analysis.marginLevel <= 150) {
        status = '△ 注意';
        statusColor = '\x1b[36m'; // シアン
      } else if (analysis.marginLevel <= 200) {
        status = '○ やや安全';
        statusColor = '\x1b[32m'; // 緑
      } else {
        status = '✅ 安全';
        statusColor = '\x1b[32m'; // 緑
      }
      
      // 黒字/赤字の表示
      const pnlDisplay = analysis.pnl >= 0 ? 
        `+${Math.round(analysis.pnl).toLocaleString()}`.padStart(13) :
        `${Math.round(analysis.pnl).toLocaleString()}`.padStart(13);
      
      // テーブル行の表示
      console.log(
        `${rate.toFixed(1).padStart(7)} | ${pnlDisplay} | ${analysis.marginLevel.toFixed(1).padStart(9)} | ` +
        `${statusColor}${status.padEnd(12)}\x1b[0m | ${Math.round(analysis.requiredMargin).toLocaleString().padStart(10)}`
      );
      
      results.push(analysis);
    }
    
    console.log('-'.repeat(80));
    
    // サマリー情報
    console.log('\n【重要なレベル分析】');
    
    // マージンコール（100%）レベルの価格を求める
    const marginCall100 = findCriticalRate(config, 100);
    const stopOut50 = findCriticalRate(config, 50);
    
    if (marginCall100) {
      console.log(`マージンコール(100%)到達価格: ${marginCall100.toFixed(2)}円`);
    }
    
    if (stopOut50) {
      console.log(`ストップアウト(50%)到達価格: ${stopOut50.toFixed(2)}円`);
    }
    
    // 現在価格での状況
    const currentAnalysis = calculateMarginLevelAtRate(config, position.currentPrice);
    console.log(`\n現在価格(${position.currentPrice.toFixed(2)}円)での状況:`);
    console.log(`- 含み損益: ${currentAnalysis.pnl >= 0 ? '+' : ''}${Math.round(currentAnalysis.pnl).toLocaleString()}円`);
    console.log(`- 証拠金維持率: ${currentAnalysis.marginLevel.toFixed(2)}%`);
    console.log(`- 有効証拠金: ${Math.round(currentAnalysis.equity).toLocaleString()}円`);
    
    console.log('='.repeat(80));
    
    return results;
    
  } catch (error) {
    console.error('分析実行中にエラーが発生しました:', error.message);
  }
}

/**
 * 指定した証拠金維持率に到達する価格を求める
 * @param {Object} config - 設定データ
 * @param {number} targetMarginLevel - 目標証拠金維持率（％）
 * @returns {number|null} 到達価格
 */
function findCriticalRate(config, targetMarginLevel) {
  const { account, position, settings } = config;
  
  // 目標証拠金維持率での方程式を解く
  // marginLevel = (balance + pnl) / requiredMargin * 100 = targetMarginLevel
  // (balance + pnl) = requiredMargin * (targetMarginLevel / 100)
  
  const leverage = settings.leverage;
  const lotSize = 10000; // 楽天FX: 1ロット = 1万通貨
  const units = position.lots * lotSize;
  const balance = account.balance;
  const entryPrice = position.entryPrice;
  
  // 買いポジションの場合: pnl = (rate - entryPrice) * units
  // 売りポジションの場合: pnl = (entryPrice - rate) * units
  
  // requiredMargin = units * rate / leverage
  // equity = balance + pnl
  // marginLevel = equity / requiredMargin * 100
  
  // 方程式: (balance + pnl) = (units * rate / leverage) * (targetMarginLevel / 100)
  
  let a, b, c;
  
  if (position.side.toLowerCase() === 'buy') {
    // pnl = (rate - entryPrice) * units
    // balance + (rate - entryPrice) * units = (units * rate / leverage) * (targetMarginLevel / 100)
    // balance + rate * units - entryPrice * units = units * rate * targetMarginLevel / (leverage * 100)
    // rate * units - rate * units * targetMarginLevel / (leverage * 100) = entryPrice * units - balance
    // rate * (units - units * targetMarginLevel / (leverage * 100)) = entryPrice * units - balance
    
    const coefficient = units * (1 - targetMarginLevel / (leverage * 100));
    const constant = entryPrice * units - balance;
    
    if (Math.abs(coefficient) < 1e-10) return null;
    
    return constant / coefficient;
    
  } else {
    // 売りポジション: pnl = (entryPrice - rate) * units
    // balance + (entryPrice - rate) * units = (units * rate / leverage) * (targetMarginLevel / 100)
    // balance + entryPrice * units - rate * units = units * rate * targetMarginLevel / (leverage * 100)
    // -rate * units - rate * units * targetMarginLevel / (leverage * 100) = -balance - entryPrice * units
    // rate * (units + units * targetMarginLevel / (leverage * 100)) = balance + entryPrice * units
    
    const coefficient = units * (1 + targetMarginLevel / (leverage * 100));
    const constant = balance + entryPrice * units;
    
    if (Math.abs(coefficient) < 1e-10) return null;
    
    return constant / coefficient;
  }
}

/**
 * 簡単な設定更新機能
 * @param {string} configPath - 設定ファイルのパス
 * @param {Object} updates - 更新内容
 */
function updateConfig(configPath, updates) {
  try {
    const config = loadConfig(configPath);
    
    // 更新内容をマージ
    if (updates.position) {
      Object.assign(config.position, updates.position);
    }
    if (updates.account) {
      Object.assign(config.account, updates.account);
    }
    if (updates.analysis) {
      Object.assign(config.settings.analysis, updates.analysis);
    }
    
    // ファイルに保存
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('設定ファイルが更新されました。');
    
  } catch (error) {
    console.error('設定更新中にエラーが発生しました:', error.message);
  }
}

// メイン実行部分
if (require.main === module) {
  const configPath = './fx-usdjpy-config.json';
  
  console.log('USD/JPY証拠金維持率分析システム\n');
  
  // 分析テーブルの表示
  displayUsdJpyAnalysisTable(configPath);
  
  console.log('\n' + '='.repeat(50));
  console.log('設定変更例のデモンストレーション');
  console.log('='.repeat(50));
  
  // 設定変更の例
  console.log('\n【レート範囲を145-155円に変更して再分析】');
  updateConfig(configPath, {
    analysis: {
      minRate: 145.0,
      maxRate: 155.0,
      step: 0.5
    }
  });
  
  displayUsdJpyAnalysisTable(configPath);
}

module.exports = {
  loadConfig,
  displayUsdJpyAnalysisTable,
  calculateMarginLevelAtRate,
  findCriticalRate,
  updateConfig
};