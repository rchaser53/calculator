const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// FX分析ツールのインポート
const {
  loadConfig,
  calculateMarginLevelAtRate,
  findCriticalRate
} = require('./fxUsdJpyAnalyzer');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 静的ファイルの配信
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// FX分析データのAPI
app.get('/api/fx-analysis', (req, res) => {
  try {
    const config = loadConfig('./fx-usdjpy-config.json');
    const { positions, settings, currentPrice } = config;
    const { minRate, maxRate, step } = settings.analysis;

    // 分析データの生成
    const analysisResults = [];
    for (let rate = minRate; rate <= maxRate; rate += step) {
      const analysis = calculateMarginLevelAtRate(config, rate);
      analysisResults.push({
        rate: parseFloat(rate.toFixed(2)),
        marginLevel: parseFloat(analysis.marginLevel.toFixed(2)),
        totalPnL: Math.round(analysis.totalPnL),
        equity: Math.round(analysis.equity),
        requiredMargin: Math.round(analysis.requiredMargin),
        riskLevel: getRiskLevel(analysis.marginLevel)
      });
    }

    // 重要レベルの計算
    const marginCall100 = findCriticalRate(config, 100);
    const stopOut50 = findCriticalRate(config, 50);

    // 現在価格での分析
    const currentAnalysis = calculateMarginLevelAtRate(config, currentPrice);

    const response = {
      account: config.account,
      positions: positions,
      currentPrice: currentPrice,
      settings: settings,
      analysisResults: analysisResults,
      currentAnalysis: {
        rate: currentPrice,
        totalPnL: Math.round(currentAnalysis.totalPnL),
        marginLevel: parseFloat(currentAnalysis.marginLevel.toFixed(2)),
        equity: Math.round(currentAnalysis.equity),
        requiredMargin: Math.round(currentAnalysis.requiredMargin),
        positionDetails: currentAnalysis.positionDetails.map(pos => ({
          ...pos,
          pnl: Math.round(pos.pnl)
        }))
      },
      criticalLevels: {
        marginCall100: marginCall100 ? parseFloat(marginCall100.toFixed(2)) : null,
        stopOut50: stopOut50 ? parseFloat(stopOut50.toFixed(2)) : null
      }
    };

    res.json(response);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'データの取得に失敗しました', details: error.message });
  }
});

// ポジション更新API
app.put('/api/fx-config', (req, res) => {
  try {
    const { positions, currentPrice, account } = req.body;
    
    const config = loadConfig('./fx-usdjpy-config.json');
    
    if (positions) config.positions = positions;
    if (currentPrice !== undefined) config.currentPrice = currentPrice;
    if (account) config.account = { ...config.account, ...account };

    fs.writeFileSync('./fx-usdjpy-config.json', JSON.stringify(config, null, 2));
    
    res.json({ success: true, message: '設定が更新されました' });
  } catch (error) {
    console.error('Config Update Error:', error);
    res.status(500).json({ error: '設定の更新に失敗しました', details: error.message });
  }
});

// リスクレベルの判定関数
function getRiskLevel(marginLevel) {
  if (marginLevel <= 50) return 'danger';
  if (marginLevel <= 100) return 'warning';
  if (marginLevel <= 200) return 'caution';
  return 'safe';
}

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 FX証拠金分析Webアプリが起動しました`);
  console.log(`📊 アクセス: http://localhost:${PORT}`);
  console.log(`🔧 開発モード: npm run dev`);
});

module.exports = app;