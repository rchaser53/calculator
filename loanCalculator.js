/**
 * ローン計算機
 * ローン金額、金利、年数から月額返済額と年ごとの残金を計算します
 */

const fs = require('fs');
const path = require('path');

/**
 * 月額返済額を計算する
 * @param {number} loanAmount - ローン金額（元本）
 * @param {number} annualRate - 年利率（%）
 * @param {number} years - 借入期間（年）
 * @returns {number} 月額返済額
 */
function calculateMonthlyPayment(loanAmount, annualRate, years) {
  const monthlyRate = annualRate / 100 / 12; // 月利率
  const numberOfPayments = years * 12; // 総支払回数

  // 金利が0の場合
  if (monthlyRate === 0) {
    return loanAmount / numberOfPayments;
  }

  // 元利均等返済の計算式
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return monthlyPayment;
}

/**
 * 住宅ローン控除額を計算する
 * @param {number} remainingBalance - 年末時点の借入残高
 * @param {number} year - 何年目か（1から開始）
 * @param {boolean} hasDeduction - 住宅ローン控除を適用するか
 * @returns {number} 控除額
 */
function calculateLoanDeduction(remainingBalance, year, hasDeduction) {
  if (!hasDeduction || year > 13) {
    return 0;
  }
  
  // 借入残高と4500万円のいずれか少ない方の0.7%
  const deductionBase = Math.min(remainingBalance, 45000000);
  return deductionBase * 0.007;
}

/**
 * 年ごとの残金を計算する
 * @param {number} loanAmount - ローン金額（元本）
 * @param {number} monthlyPayment - 月額返済額
 * @param {number} annualRate - 年利率（%）
 * @param {number} years - 借入期間（年）
 * @param {boolean} hasDeduction - 住宅ローン控除を適用するか
 * @returns {Array} 年ごとの残金情報
 */
function calculateYearlyBalance(loanAmount, monthlyPayment, annualRate, years, hasDeduction = false) {
  const monthlyRate = annualRate / 100 / 12; // 月利率
  let remainingBalance = loanAmount;
  const yearlyData = [];

  for (let year = 1; year <= years; year++) {
    let yearlyPrincipal = 0; // 年間元本返済額
    let yearlyInterest = 0;  // 年間利息支払額

    // 1年分（12ヶ月）の計算
    for (let month = 1; month <= 12; month++) {
      if (remainingBalance <= 0) break;

      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;

      yearlyInterest += interestPayment;
      yearlyPrincipal += principalPayment;
      remainingBalance -= principalPayment;

      // 残高が負になった場合の調整
      if (remainingBalance < 0) {
        yearlyPrincipal += remainingBalance; // 最後の月の元本を調整
        remainingBalance = 0;
      }
    }

    yearlyData.push({
      year: year,
      yearlyPayment: monthlyPayment * 12,
      yearlyPrincipal: yearlyPrincipal,
      yearlyInterest: yearlyInterest,
      remainingBalance: Math.max(0, remainingBalance),
      loanDeduction: calculateLoanDeduction(Math.max(0, remainingBalance), year, hasDeduction)
    });

    if (remainingBalance <= 0) break;
  }

  return yearlyData;
}

/**
 * 設定ファイルを読み込む
 * @param {string} configPath - 設定ファイルのパス
 * @returns {Object} 設定オブジェクト
 */
function loadConfig(configPath = './loan-config.json') {
  try {
    const configFile = path.resolve(configPath);
    const configData = fs.readFileSync(configFile, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(`設定ファイルの読み込みに失敗しました: ${error.message}`);
    console.log('デフォルト設定を使用します。');
    return {
      defaultConfig: {
        loanAmount: 30000000,
        annualRate: 1.5,
        years: 35,
        hasDeduction: false,
        description: 'デフォルト設定（3000万円、年利1.5%、35年、住宅ローン控除なし）'
      },
      scenarios: []
    };
  }
}

/**
 * 設定を元にローン計算を実行する
 * @param {Object} config - 設定オブジェクト
 * @param {string|number} scenarioSelector - シナリオ名またはインデックス（省略時はdefaultConfig使用）
 */
function calculateFromConfig(config, scenarioSelector = null) {
  let selectedConfig;
  
  if (scenarioSelector === null) {
    // デフォルト設定を使用
    selectedConfig = config.defaultConfig;
    console.log('デフォルト設定を使用します。');
  } else if (typeof scenarioSelector === 'string') {
    // シナリオ名で検索
    const scenario = config.scenarios.find(s => s.name === scenarioSelector);
    if (scenario) {
      selectedConfig = scenario;
      console.log(`シナリオ "${scenarioSelector}" を使用します。`);
    } else {
      console.error(`シナリオ "${scenarioSelector}" が見つかりません。`);
      return;
    }
  } else if (typeof scenarioSelector === 'number') {
    // インデックスで選択
    if (scenarioSelector >= 0 && scenarioSelector < config.scenarios.length) {
      selectedConfig = config.scenarios[scenarioSelector];
      console.log(`シナリオ ${scenarioSelector + 1}: "${selectedConfig.name}" を使用します。`);
    } else {
      console.error(`無効なシナリオインデックス: ${scenarioSelector}`);
      return;
    }
  } else {
    console.error('無効なシナリオセレクタです。');
    return;
  }
  
  console.log(`設定内容: ${selectedConfig.description}`);
  console.log('');
  
  displayLoanCalculation(
    selectedConfig.loanAmount,
    selectedConfig.annualRate,
    selectedConfig.years,
    selectedConfig.hasDeduction
  );
}

/**
 * 利用可能なシナリオ一覧を表示する
 * @param {Object} config - 設定オブジェクト
 */
function listScenarios(config) {
  console.log('='.repeat(60));
  console.log('                    利用可能なシナリオ一覧');
  console.log('='.repeat(60));
  
  console.log('デフォルト設定:');
  console.log(`  ${config.defaultConfig.description}`);
  console.log('');
  
  if (config.scenarios.length > 0) {
    console.log('シナリオ:');
    config.scenarios.forEach((scenario, index) => {
      console.log(`  ${index + 1}. ${scenario.name}`);
      console.log(`     ${scenario.description}`);
    });
  } else {
    console.log('定義済みシナリオはありません。');
  }
  
  console.log('='.repeat(60));
}

/**
 * ローン計算結果を表形式で表示する
 * @param {number} loanAmount - ローン金額（元本）
 * @param {number} annualRate - 年利率（%）
 * @param {number} years - 借入期間（年）
 * @param {boolean} hasDeduction - 住宅ローン控除を適用するか
 */
function displayLoanCalculation(loanAmount, annualRate, years, hasDeduction = false) {
  console.log('='.repeat(80));
  console.log('                            ローン計算結果');
  console.log('='.repeat(80));
  
  const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, years);
  const yearlyData = calculateYearlyBalance(loanAmount, monthlyPayment, annualRate, years, hasDeduction);

  // 基本情報の表示
  console.log(`ローン金額: ${loanAmount.toLocaleString()}円`);
  console.log(`年利率: ${annualRate}%`);
  console.log(`借入期間: ${years}年`);
  console.log(`月額返済額: ${Math.round(monthlyPayment).toLocaleString()}円`);
  if (hasDeduction) {
    console.log('住宅ローン控除: 適用あり（13年間、年末残高または4500万円の少ない方の0.7%）');
  }
  console.log('');

  // 年ごとの詳細テーブル
  console.log('年ごとの返済計画:');
  console.log('-'.repeat(hasDeduction ? 96 : 80));
  if (hasDeduction) {
    console.log('年 |   年間返済額   |   元本返済額   |   利息支払額   |     残債額     |   住宅ローン控除');
  } else {
    console.log('年 |   年間返済額   |   元本返済額   |   利息支払額   |     残債額     ');
  }
  console.log('-'.repeat(hasDeduction ? 96 : 80));

  yearlyData.forEach(data => {
    if (hasDeduction) {
      console.log(
        `${data.year.toString().padStart(2)} | ` +
        `${Math.round(data.yearlyPayment).toLocaleString().padStart(12)} | ` +
        `${Math.round(data.yearlyPrincipal).toLocaleString().padStart(12)} | ` +
        `${Math.round(data.yearlyInterest).toLocaleString().padStart(12)} | ` +
        `${Math.round(data.remainingBalance).toLocaleString().padStart(12)} | ` +
        `${Math.round(data.loanDeduction).toLocaleString().padStart(14)}`
      );
    } else {
      console.log(
        `${data.year.toString().padStart(2)} | ` +
        `${Math.round(data.yearlyPayment).toLocaleString().padStart(12)} | ` +
        `${Math.round(data.yearlyPrincipal).toLocaleString().padStart(12)} | ` +
        `${Math.round(data.yearlyInterest).toLocaleString().padStart(12)} | ` +
        `${Math.round(data.remainingBalance).toLocaleString().padStart(12)}`
      );
    }
  });

  console.log('-'.repeat(hasDeduction ? 96 : 80));

  // 総支払額の計算
  const totalPayments = yearlyData.reduce((sum, data) => sum + data.yearlyPayment, 0);
  const totalInterest = yearlyData.reduce((sum, data) => sum + data.yearlyInterest, 0);
  const totalDeduction = yearlyData.reduce((sum, data) => sum + data.loanDeduction, 0);

  // 住宅ローン控除適用時は13年目終了時点の集計も表示
  if (hasDeduction) {
    const data13Years = yearlyData.slice(0, Math.min(13, yearlyData.length));
    const payments13Years = data13Years.reduce((sum, data) => sum + data.yearlyPayment, 0);
    const interest13Years = data13Years.reduce((sum, data) => sum + data.yearlyInterest, 0);
    const deduction13Years = data13Years.reduce((sum, data) => sum + data.loanDeduction, 0);
    
    console.log('\n【住宅ローン控除期間終了時点（13年目終了時）の集計】');
    console.log(`13年間の総支払額: ${Math.round(payments13Years).toLocaleString()}円`);
    console.log(`13年間の総利息額: ${Math.round(interest13Years).toLocaleString()}円`);
    console.log(`13年間の総控除額: ${Math.round(deduction13Years).toLocaleString()}円`);
    console.log(`13年間の実質負担額: ${Math.round(payments13Years - deduction13Years).toLocaleString()}円`);
    
    if (yearlyData.length > 13) {
      const remainingBalance13 = yearlyData[12].remainingBalance; // 13年目終了時の残債
      console.log(`13年目終了時の残債額: ${Math.round(remainingBalance13).toLocaleString()}円`);
      
      // 14年目以降の集計
      const dataAfter13 = yearlyData.slice(13);
      const paymentsAfter13 = dataAfter13.reduce((sum, data) => sum + data.yearlyPayment, 0);
      const interestAfter13 = dataAfter13.reduce((sum, data) => sum + data.yearlyInterest, 0);
      
      console.log('\n【14年目以降（控除終了後）の見通し】');
      console.log(`14年目以降の総支払額: ${Math.round(paymentsAfter13).toLocaleString()}円`);
      console.log(`14年目以降の総利息額: ${Math.round(interestAfter13).toLocaleString()}円`);
      console.log(`残り返済期間: ${dataAfter13.length}年`);
    }
    console.log('');
  }

  console.log(`総支払額: ${Math.round(totalPayments).toLocaleString()}円`);
  console.log(`総利息額: ${Math.round(totalInterest).toLocaleString()}円`);
  if (hasDeduction) {
    console.log(`総控除額: ${Math.round(totalDeduction).toLocaleString()}円`);
    console.log(`実質負担額: ${Math.round(totalPayments - totalDeduction).toLocaleString()}円`);
  }
  console.log('='.repeat(80));
}

// 使用例
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // 設定ファイルを読み込み
  const config = loadConfig();
  
  // コマンドライン引数の処理
  if (args.length === 0) {
    // 引数なし: シナリオ一覧を表示してからデフォルト設定で実行
    listScenarios(config);
    console.log('\n');
    calculateFromConfig(config);
  } else if (args[0] === '--list' || args[0] === '-l') {
    // シナリオ一覧表示
    listScenarios(config);
  } else if (args[0] === '--scenario' || args[0] === '-s') {
    // 特定シナリオ実行
    if (args[1]) {
      // 数字かどうかチェック
      const scenarioSelector = isNaN(args[1]) ? args[1] : parseInt(args[1]) - 1;
      calculateFromConfig(config, scenarioSelector);
    } else {
      console.error('シナリオ名またはインデックスを指定してください。');
      console.log('使用例: node loanCalculator.js --scenario "基本ケース"');
      console.log('使用例: node loanCalculator.js --scenario 1');
    }
  } else if (args[0] === '--all' || args[0] === '-a') {
    // 全シナリオ実行
    listScenarios(config);
    console.log('\n');
    
    // デフォルト設定実行
    calculateFromConfig(config);
    
    // 全シナリオ実行
    config.scenarios.forEach((scenario, index) => {
      console.log('\n');
      calculateFromConfig(config, index);
    });
  } else {
    // ヘルプ表示
    console.log('ローン計算機 - 使用方法:');
    console.log('  node loanCalculator.js                    # デフォルト設定で実行');
    console.log('  node loanCalculator.js --list             # シナリオ一覧表示');
    console.log('  node loanCalculator.js --scenario <名前>   # 特定シナリオ実行');
    console.log('  node loanCalculator.js --scenario <番号>   # 特定シナリオ実行（番号指定）');
    console.log('  node loanCalculator.js --all              # 全シナリオ実行');
    console.log('');
    console.log('例:');
    console.log('  node loanCalculator.js --scenario "基本ケース"');
    console.log('  node loanCalculator.js --scenario 1');
  }
}

// 関数をエクスポート
module.exports = {
  calculateMonthlyPayment,
  calculateYearlyBalance,
  displayLoanCalculation,
  calculateLoanDeduction,
  loadConfig,
  calculateFromConfig,
  listScenarios
};
