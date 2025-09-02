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
 * 複数ポジションの合計損益を計算する（楽天FX仕様）
 * @param {Array} positions - ポジション配列
 * @param {number} currentRate - 現在のレート
 * @returns {Object} 損益情報
 */
function calculateTotalPnL(positions, currentRate) {
  const lotSize = 10000; // 楽天FX: 1ロット = 1万通貨
  let totalPnL = 0;
  let totalUnits = 0;
  const positionDetails = [];
  
  positions.forEach(position => {
    const { side, lots, entryPrice, id, comment } = position;
    const units = lots * lotSize;
    
    let pnl;
    if (side.toLowerCase() === 'buy') {
      pnl = (currentRate - entryPrice) * units;
    } else {
      pnl = (entryPrice - currentRate) * units;
    }
    
    totalPnL += pnl;
    totalUnits += units;
    
    positionDetails.push({
      id: id,
      side: side,
      lots: lots,
      entryPrice: entryPrice,
      units: units,
      pnl: pnl,
      comment: comment
    });
  });
  
  return {
    totalPnL: totalPnL,
    totalUnits: totalUnits,
    totalLots: totalUnits / lotSize,
    positionDetails: positionDetails
  };
}

/**
 * 複数ポジションの必要証拠金を計算する（楽天FX仕様）
 * @param {Array} positions - ポジション配列
 * @param {number} currentRate - 現在のレート
 * @param {number} leverage - レバレッジ
 * @returns {number} 必要証拠金
 */
function calculateTotalRequiredMargin(positions, currentRate, leverage) {
  const lotSize = 10000; // 楽天FX: 1ロット = 1万通貨
  let totalUnits = 0;
  
  positions.forEach(position => {
    totalUnits += position.lots * lotSize;
  });
  
  const notionalValue = totalUnits * currentRate;
  return notionalValue / leverage;
}

/**
 * 複数ポジションでの証拠金維持率を計算する
 * @param {Object} config - 設定データ
 * @param {number} rate - USD/JPYレート
 * @returns {Object} 証拠金維持率情報
 */
function calculateMarginLevelAtRate(config, rate) {
  const { account, positions, settings } = config;
  
  // 複数ポジションの損益計算
  const pnlInfo = calculateTotalPnL(positions, rate);
  const requiredMargin = calculateTotalRequiredMargin(positions, rate, settings.leverage);
  
  // 有効証拠金（純資産 + 含み損益）
  const equity = account.balance + pnlInfo.totalPnL;
  
  // 証拠金維持率（％）
  const marginLevel = requiredMargin > 0 ? (equity / requiredMargin) * 100 : 0;
  
  return {
    rate: rate,
    totalPnL: pnlInfo.totalPnL,
    equity: equity,
    requiredMargin: requiredMargin,
    marginLevel: marginLevel,
    positionDetails: pnlInfo.positionDetails,
    totalLots: pnlInfo.totalLots,
    totalUnits: pnlInfo.totalUnits
  };
}

/**
 * USD/JPYレート範囲での詳細テーブルを表示（複数ポジション対応）
 * @param {string} configPath - 設定ファイルのパス
 */
function displayUsdJpyAnalysisTable(configPath = './fx-usdjpy-config.json') {
  try {
    const config = loadConfig(configPath);
    const { positions, settings, currentPrice } = config;
    const { minRate, maxRate, step } = settings.analysis;
    
    console.log('='.repeat(80));
    console.log('              USD/JPY 証拠金維持率分析テーブル (楽天FX仕様 - 複数ポジション)');
    console.log('='.repeat(80));
    
    // 基本情報の表示
    console.log(`口座残高: ${config.account.balance.toLocaleString()}円`);
    console.log(`現在価格: ${currentPrice.toFixed(2)}円`);
    console.log(`レバレッジ: ${settings.leverage}倍`);
    console.log(`楽天FX仕様: 1ロット = 1万通貨`);
    console.log('');
    
    // ポジション一覧の表示
    console.log('=== ポジション一覧 ===');
    let totalLots = 0;
    let totalUnits = 0;
    
    positions.forEach((position, index) => {
      const units = position.lots * 10000;
      totalLots += position.lots;
      totalUnits += units;
      
      console.log(`${index + 1}. [${position.id}] ${position.side.toUpperCase()} ${position.lots}ロット @ ${position.entryPrice.toFixed(2)}円`);
      console.log(`   ${position.comment || ''} (${units.toLocaleString()}通貨)`);
    });
    
    console.log(`\n合計: ${totalLots}ロット (${totalUnits.toLocaleString()}通貨)`);
    console.log(`分析範囲: ${minRate.toFixed(1)}円 ～ ${maxRate.toFixed(1)}円 (${step}円刻み)`);
    console.log('');
    
    // テーブルヘッダー
    console.log('-'.repeat(80));
    console.log('USD/JPY  |  合計損益    | 証拠金維持率 |     状態     |  必要証拠金');
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
      const pnlDisplay = analysis.totalPnL >= 0 ? 
        `+${Math.round(analysis.totalPnL).toLocaleString()}`.padStart(13) :
        `${Math.round(analysis.totalPnL).toLocaleString()}`.padStart(13);
      
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
    const currentAnalysis = calculateMarginLevelAtRate(config, currentPrice);
    console.log(`\n現在価格(${currentPrice.toFixed(3)}円)での詳細状況:`);
    console.log(`- 合計含み損益: ${currentAnalysis.totalPnL >= 0 ? '+' : ''}${Math.round(currentAnalysis.totalPnL).toLocaleString()}円`);
    console.log(`- 証拠金維持率: ${currentAnalysis.marginLevel.toFixed(2)}%`);
    console.log(`- 有効証拠金: ${Math.round(currentAnalysis.equity).toLocaleString()}円`);
    console.log(`- 必要証拠金: ${Math.round(currentAnalysis.requiredMargin).toLocaleString()}円`);
    
    // 手動計算での検証
    const manualRequiredMargin = (currentAnalysis.totalUnits * currentPrice) / settings.leverage;
    console.log(`- 手動計算検証: ${currentAnalysis.totalUnits.toLocaleString()}通貨 × ${currentPrice}円 ÷ ${settings.leverage} = ${Math.round(manualRequiredMargin).toLocaleString()}円`);
    
    // ポジション別詳細
    console.log('\n=== ポジション別損益詳細 ===');
    currentAnalysis.positionDetails.forEach(pos => {
      console.log(`[${pos.id}] ${pos.side.toUpperCase()} ${pos.lots}ロット @ ${pos.entryPrice.toFixed(2)}円 -> 損益: ${pos.pnl >= 0 ? '+' : ''}${Math.round(pos.pnl).toLocaleString()}円`);
    });
    
    console.log('='.repeat(80));
    
    // 折れ線グラフの表示
    displayMarginLevelChart(config, results);
    
    return results;
    
  } catch (error) {
    console.error('分析実行中にエラーが発生しました:', error.message);
  }
}

/**
 * 証拠金維持率の折れ線グラフを表示する（ASCII版）
 * @param {Object} config - 設定データ
 * @param {Array} analysisResults - 分析結果配列
 */
function displayMarginLevelChart(config, analysisResults) {
  console.log('\n' + '='.repeat(80));
  console.log('                    証拠金維持率 推移グラフ');
  console.log('='.repeat(80));
  
  if (!analysisResults || analysisResults.length === 0) {
    console.log('グラフ表示用のデータがありません。');
    return;
  }
  
  // Y軸の範囲を決定（証拠金維持率）
  const marginLevels = analysisResults.map(r => r.marginLevel);
  const minMargin = Math.min(...marginLevels);
  const maxMargin = Math.max(...marginLevels);
  
  // グラフの設定
  const graphHeight = 20;
  const graphWidth = 60;
  const marginRange = maxMargin - minMargin;
  
  console.log(`Y軸: 証拠金維持率 ${minMargin.toFixed(0)}% ～ ${maxMargin.toFixed(0)}%`);
  console.log(`X軸: USD/JPYレート ${analysisResults[0].rate.toFixed(1)} ～ ${analysisResults[analysisResults.length-1].rate.toFixed(1)}円`);
  console.log('');
  
  // グラフの描画
  for (let row = graphHeight; row >= 0; row--) {
    let line = '';
    
    // Y軸ラベル
    const yValue = minMargin + (marginRange * row / graphHeight);
    line += yValue.toFixed(0).padStart(4) + '% |';
    
    // グラフの点をプロット
    for (let col = 0; col < graphWidth; col++) {
      const dataIndex = Math.floor((col / (graphWidth - 1)) * (analysisResults.length - 1));
      const dataPoint = analysisResults[dataIndex];
      
      if (dataPoint) {
        const normalizedY = (dataPoint.marginLevel - minMargin) / marginRange * graphHeight;
        
        if (Math.abs(normalizedY - row) < 0.5) {
          // 重要レベルの表示
          if (dataPoint.marginLevel <= 50) {
            line += '\x1b[31m●\x1b[0m'; // 赤（強制決済）
          } else if (dataPoint.marginLevel <= 100) {
            line += '\x1b[33m●\x1b[0m'; // 黄（マージンコール）
          } else if (dataPoint.marginLevel <= 200) {
            line += '\x1b[36m●\x1b[0m'; // シアン（注意）
          } else {
            line += '\x1b[32m●\x1b[0m'; // 緑（安全）
          }
        } else {
          line += ' ';
        }
      } else {
        line += ' ';
      }
    }
    
    console.log(line);
  }
  
  // X軸ラベル
  let xAxisLine = '     +';
  for (let i = 0; i < graphWidth; i++) {
    xAxisLine += '-';
  }
  console.log(xAxisLine);
  
  // X軸の値
  let xLabels = '      ';
  const numLabels = 5;
  for (let i = 0; i < numLabels; i++) {
    const dataIndex = Math.floor((i / (numLabels - 1)) * (analysisResults.length - 1));
    const rate = analysisResults[dataIndex].rate;
    const label = rate.toFixed(1);
    const position = Math.floor((i / (numLabels - 1)) * (graphWidth - label.length));
    
    while (xLabels.length < 6 + position) {
      xLabels += ' ';
    }
    xLabels += label;
  }
  console.log(xLabels);
  
  // 凡例
  console.log('\n凡例:');
  console.log('\x1b[31m●\x1b[0m 強制決済レベル (≤50%)   \x1b[33m●\x1b[0m マージンコール (≤100%)');
  console.log('\x1b[36m●\x1b[0m 注意レベル (≤200%)     \x1b[32m●\x1b[0m 安全レベル (>200%)');
  console.log('='.repeat(80));
}

/**
 * 指定した証拠金維持率に到達する価格を求める（複数ポジション対応）
 * @param {Object} config - 設定データ
 * @param {number} targetMarginLevel - 目標証拠金維持率（％）
 * @returns {number|null} 到達価格
 */
function findCriticalRate(config, targetMarginLevel) {
  const { account, positions, settings } = config;
  
  const leverage = settings.leverage;
  const lotSize = 10000; // 楽天FX: 1ロット = 1万通貨
  const balance = account.balance;
  
  // 各ポジションの情報を集約
  let totalUnits = 0;
  let totalEntryValue = 0; // 建値 * 数量の合計
  let allBuyPositions = true;
  let allSellPositions = true;
  
  positions.forEach(position => {
    const units = position.lots * lotSize;
    totalUnits += units;
    totalEntryValue += position.entryPrice * units;
    
    if (position.side.toLowerCase() !== 'buy') {
      allBuyPositions = false;
    }
    if (position.side.toLowerCase() !== 'sell') {
      allSellPositions = false;
    }
  });
  
  // 混合ポジション（買いと売りが混在）の場合、簡単な公式では解けない
  if (!allBuyPositions && !allSellPositions) {
    console.log('警告: 混合ポジションのため、重要レベルの精密な計算ができません');
    return null;
  }
  
  // 全て買いポジションの場合
  if (allBuyPositions) {
    // 各ポジションの損益 = (rate - entryPrice) * units
    // 合計損益 = Σ(rate - entryPrice_i) * units_i = rate * Σunits_i - Σ(entryPrice_i * units_i)
    // 合計損益 = rate * totalUnits - totalEntryValue
    
    // 証拠金維持率 = (balance + totalPnL) / requiredMargin * 100 = targetMarginLevel
    // requiredMargin = totalUnits * rate / leverage
    // (balance + rate * totalUnits - totalEntryValue) = (totalUnits * rate / leverage) * (targetMarginLevel / 100)
    
    const coefficient = totalUnits * (1 - targetMarginLevel / (leverage * 100));
    const constant = totalEntryValue - balance;
    
    if (Math.abs(coefficient) < 1e-10) return null;
    
    return constant / coefficient;
  }
  
  // 全て売りポジションの場合
  if (allSellPositions) {
    // 各ポジションの損益 = (entryPrice - rate) * units
    // 合計損益 = Σ(entryPrice_i - rate) * units_i = Σ(entryPrice_i * units_i) - rate * Σunits_i
    // 合計損益 = totalEntryValue - rate * totalUnits
    
    const coefficient = totalUnits * (1 + targetMarginLevel / (leverage * 100));
    const constant = balance + totalEntryValue;
    
    if (Math.abs(coefficient) < 1e-10) return null;
    
    return constant / coefficient;
  }
  
  return null;
}

// メイン実行部分
if (require.main === module) {
  const configPath = './fx-usdjpy-config.json';
  
  console.log('USD/JPY証拠金維持率分析システム（複数ポジション対応）\n');
  
  // 分析テーブルの表示
  displayUsdJpyAnalysisTable(configPath);
  
  console.log('\n' + '='.repeat(50));
  console.log('複数ポジション設定変更のデモンストレーション');
  console.log('='.repeat(50));
  
  
  displayUsdJpyAnalysisTable(configPath);
}

module.exports = {
  loadConfig,
  displayUsdJpyAnalysisTable,
  calculateMarginLevelAtRate,
  calculateTotalPnL,
  calculateTotalRequiredMargin,
  findCriticalRate
};