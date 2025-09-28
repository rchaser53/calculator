# 計算機ツール集

このプロジェクトは、ローン計算とFX証拠金維持率監視のためのJavaScriptライブラリです。

## 機能

### ローン計算機
- 月額返済額の計算
- 年ごとの残高テーブルの表示
- 総支払額と総利息額の計算
- **住宅ローン控除の計算**（13年間、年末残高または4500万円の少ない方の0.7%）
- **13年目終了時点での中間集計表示**（控除期間終了時の詳細な分析）

### FX証拠金維持率監視
- **25倍レバレッジでの証拠金維持率計算**
- **マージンコール（100%）とストップアウト（50%）の監視**
- **危険価格レベルの自動計算**
- **リアルタイム価格更新対応**
- **ポジション管理機能**

## 使い方

### ローン計算機

#### 基本的な使い方

```javascript
const { displayLoanCalculation } = require('./loanCalculator');

// ローン金額3000万円、年利1.5%、35年で計算
displayLoanCalculation(3000000, 1.5, 35);

// 住宅ローン控除ありで計算
displayLoanCalculation(3000000, 1.5, 35, true);
```

#### 設定ファイルを使用した計算

ローン計算機は、設定ファイル（`loan-config.json`）から設定を読み込んで複数のシナリオを管理できます。

```bash
# デフォルト設定で計算実行
node loanCalculator.js

# 利用可能なシナリオ一覧を表示
node loanCalculator.js --list

# 特定のシナリオを名前で指定して実行
node loanCalculator.js --scenario "基本ケース"

# 特定のシナリオを番号で指定して実行
node loanCalculator.js --scenario 1

# 全シナリオを一括実行
node loanCalculator.js --all
```

#### 設定ファイル (loan-config.json)

```json
{
  "defaultConfig": {
    "loanAmount": 30000000,
    "annualRate": 1.5,
    "years": 35,
    "hasDeduction": false,
    "description": "デフォルト設定（3000万円、年利1.5%、35年、住宅ローン控除なし）"
  },
  "scenarios": [
    {
      "name": "基本ケース",
      "loanAmount": 30000000,
      "annualRate": 1.5,
      "years": 35,
      "hasDeduction": false,
      "description": "3000万円、年利1.5%、35年、住宅ローン控除なし"
    },
    {
      "name": "住宅ローン控除適用ケース",
      "loanAmount": 30000000,
      "annualRate": 1.5,
      "years": 35,
      "hasDeduction": true,
      "description": "3000万円、年利1.5%、35年、住宅ローン控除あり"
    }
  ]
}
```

#### プログラムから設定ファイルを使用

```javascript
const { loadConfig, calculateFromConfig, listScenarios } = require('./loanCalculator');

// 設定ファイルを読み込み
const config = loadConfig('./loan-config.json');

// シナリオ一覧を表示
listScenarios(config);

// デフォルト設定で計算
calculateFromConfig(config);

// 特定のシナリオを名前で指定
calculateFromConfig(config, "基本ケース");

// 特定のシナリオをインデックスで指定（0から開始）
calculateFromConfig(config, 0);
```

### FX証拠金維持率監視の使い方

#### 基本的な使い方

```javascript
const { loadConfig, displayMarginReport } = require('./fxMarginMonitor');

// 設定ファイルから情報を読み込んでレポートを表示
const config = loadConfig('./fx-config.json');
displayMarginReport(config);
```

#### 設定ファイル (fx-config.json)

```json
{
  "account": {
    "balance": 1000000,
    "comment": "純資産（円）"
  },
  "positions": [
    {
      "pair": "USD/JPY",
      "side": "buy",
      "lots": 10,
      "entryPrice": 150.00,
      "currentPrice": 149.50,
      "comment": "買いポジション：10万通貨"
    }
  ],
  "settings": {
    "leverage": 25,
    "marginCallLevel": 100,
    "stopOutLevel": 50
  }
}
```

#### USD/JPY専用設定ファイル (fx-usdjpy-config.json)

```json
{
  "account": {
    "balance": 1000000,
    "comment": "純資産（円）"
  },
  "position": {
    "pair": "USD/JPY",
    "side": "buy",
    "lots": 10,
    "entryPrice": 150.00,
    "currentPrice": 150.00,
    "comment": "買いポジション：10万通貨"
  },
  "settings": {
    "leverage": 25,
    "marginCallLevel": 100,
    "stopOutLevel": 50,
    "analysis": {
      "minRate": 140.0,
      "maxRate": 160.0,
      "step": 0.5,
      "comment": "分析レンジ設定（0.5円刻み）"
    }
  }
}
```

#### USD/JPY分析テーブル出力例

```
================================================================================
                    USD/JPY 証拠金維持率分析テーブル
================================================================================
口座残高: 3,000,000円
ポジション: BUY 5ロット
建値: 150.00円
レバレッジ: 25倍
分析範囲: 145.0円 ～ 155.0円 (0.5円刻み)

--------------------------------------------------------------------------------
USD/JPY  |  黒字/赤字金額  | 証拠金維持率 |     状態     |  必要証拠金
レート   |      (円)      |     (%)     |              |     (円)
--------------------------------------------------------------------------------
  145.0 |    -2,500,000 |      17.2 | 🚨強制決済       |  2,900,000
  146.0 |    -2,000,000 |      34.2 | 🚨強制決済       |  2,920,000
  147.0 |    -1,500,000 |      51.0 | ⚠️ 警告        |  2,940,000
  148.0 |    -1,000,000 |      67.6 | ⚠️ 警告        |  2,960,000
  149.0 |      -500,000 |      83.9 | ⚠️ 警告        |  2,980,000
  150.0 |            +0 |     100.0 | ⚠️ 警告        |  3,000,000
  151.0 |      +500,000 |     115.9 | △ 注意         |  3,020,000
  152.0 |    +1,000,000 |     131.6 | △ 注意         |  3,040,000
  153.0 |    +1,500,000 |     147.1 | △ 注意         |  3,060,000
  154.0 |    +2,000,000 |     162.3 | ○ やや安全       |  3,080,000
  155.0 |    +2,500,000 |     177.4 | ○ やや安全       |  3,100,000
--------------------------------------------------------------------------------

【重要なレベル分析】
マージンコール(100%)到達価格: 150.00円
ストップアウト(50%)到達価格: 146.94円
```

```javascript
const { updatePricesAndRecalculate } = require('./fxMarginMonitor');

// 価格を更新して再計算
updatePricesAndRecalculate('./fx-config.json', {
  'USD/JPY': 148.50,
  'EUR/JPY': 163.00
});
```

```javascript
const { calculateMonthlyPayment, calculateYearlyBalance } = require('./loanCalculator');

// 月額返済額のみ計算
const monthlyPayment = calculateMonthlyPayment(3000000, 1.5, 35);
console.log(`月額返済額: ${Math.round(monthlyPayment).toLocaleString()}円`);

// 年ごとの詳細データを取得
const yearlyData = calculateYearlyBalance(3000000, monthlyPayment, 1.5, 35);
console.log(yearlyData);
```

### コマンドラインから実行

#### ローン計算機
```bash
# サンプル計算を実行
npm start

# インタラクティブモード（対話形式で入力）
npm run interactive

# 様々な例を確認
npm run examples

# 基本のサンプル実行
npm run loan
```

#### FX証拠金維持率監視
```bash
# FX証拠金維持率レポートを表示
npm run fx

# インタラクティブモード（対話形式でリアルタイム監視）
npm run fx-interactive

# 詳細分析（レンジ分析、最適ポジションサイズ、ストレステスト）
npm run fx-analyze

# USD/JPY専用テーブル分析（0.5円刻みの詳細テーブル）
npm run fx-usdjpy
```

## 関数リファレンス

### `loadConfig(configPath)`

設定ファイルを読み込みます。

- `configPath`: 設定ファイルのパス（省略可、デフォルトは'./loan-config.json'）
- 戻り値: 設定オブジェクト

### `calculateFromConfig(config, scenarioSelector)`

設定を元にローン計算を実行します。

- `config`: 設定オブジェクト
- `scenarioSelector`: シナリオ名、インデックス番号、またはnull（デフォルト設定使用）

### `listScenarios(config)`

利用可能なシナリオ一覧を表示します。

- `config`: 設定オブジェクト

### `calculateMonthlyPayment(loanAmount, annualRate, years)`

月額返済額を計算します。

- `loanAmount`: ローン金額（円）
- `annualRate`: 年利率（%）
- `years`: 借入期間（年）
- 戻り値: 月額返済額（円）

### `calculateYearlyBalance(loanAmount, monthlyPayment, annualRate, years)`

年ごとの残高情報を計算します。

- `loanAmount`: ローン金額（円）
- `monthlyPayment`: 月額返済額（円）
- `annualRate`: 年利率（%）
- `years`: 借入期間（年）
- 戻り値: 年ごとの返済情報の配列

### `displayLoanCalculation(loanAmount, annualRate, years, hasDeduction)`

ローン計算結果を見やすい表形式で表示します。

- `loanAmount`: ローン金額（円）
- `annualRate`: 年利率（%）
- `years`: 借入期間（年）
- `hasDeduction`: 住宅ローン控除を適用するか（省略可、デフォルトはfalse）

### `calculateLoanDeduction(remainingBalance, year, hasDeduction)`

住宅ローン控除額を計算します。

- `remainingBalance`: 年末時点の借入残高（円）
- `year`: 何年目か（1から開始）
- `hasDeduction`: 住宅ローン控除を適用するか
- 戻り値: 控除額（円）

## 出力例

### 通常のローン計算

```
================================================================================
                            ローン計算結果
================================================================================
ローン金額: 30,000,000円
年利率: 1.5%
借入期間: 35年
月額返済額: 91,855円

年ごとの返済計画:
--------------------------------------------------------------------------------
年 |   年間返済額   |   元本返済額   |   利息支払額   |     残債額     
--------------------------------------------------------------------------------
 1 |    1,102,260 |      652,136 |      450,124 |   29,347,864
 2 |    1,102,260 |      661,916 |      440,344 |   28,685,948
 3 |    1,102,260 |      671,844 |      430,416 |   28,014,104
...
```

### 住宅ローン控除適用時

```
================================================================================
                            ローン計算結果
================================================================================
ローン金額: 40,000,000円
年利率: 1.3%
借入期間: 35年
月額返済額: 118,593円
住宅ローン控除: 適用あり（13年間、年末残高または4500万円の少ない方の0.7%）

年ごとの返済計画:
------------------------------------------------------------------------------------------------
年 |   年間返済額   |   元本返済額   |   利息支払額   |     残債額     |   住宅ローン控除
------------------------------------------------------------------------------------------------
 1 |    1,423,114 |      908,515 |      514,599 |   39,091,485 |        273,640
 2 |    1,423,114 |      920,396 |      502,718 |   38,171,089 |        267,198
...
13 |    1,423,114 |    1,061,807 |      361,308 |   27,216,635 |        190,516
14 |    1,423,114 |    1,075,693 |      347,422 |   26,140,942 |              0
...

【住宅ローン控除期間終了時点（13年目終了時）の集計】
13年間の総支払額: 18,500,488円
13年間の総利息額: 5,717,123円
13年間の総控除額: 3,029,885円
13年間の実質負担額: 15,470,604円
13年目終了時の残債額: 27,216,635円

【14年目以降（控除終了後）の見通し】
14年目以降の総支払額: 31,308,519円
14年目以降の総利息額: 4,091,884円
残り返済期間: 22年

総支払額: 49,809,007円
総利息額: 9,809,007円
総控除額: 3,029,885円
実質負担額: 46,779,122円
```

## 計算方法

このライブラリは元利均等返済方式を使用しています。月額返済額は以下の式で計算されます：

```
月額返済額 = 元本 × (月利率 × (1 + 月利率)^返済回数) / ((1 + 月利率)^返済回数 - 1)
```

金利が0%の場合は、元本を返済回数で割った金額が月額返済額となります。
