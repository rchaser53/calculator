/**
 * ローン計算機
 * ローン金額、金利、年数から月額返済額と年ごとの残金を計算します
 */

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
  // サンプル計算
  console.log('サンプル計算例:');
  displayLoanCalculation(3000000, 1.5, 35); // 3000万円、年利1.5%、35年
  
  console.log('\n');
  console.log('住宅ローン控除適用例:');
  displayLoanCalculation(3000000, 1.5, 35, true); // 住宅ローン控除あり
}

// 関数をエクスポート
module.exports = {
  calculateMonthlyPayment,
  calculateYearlyBalance,
  displayLoanCalculation,
  calculateLoanDeduction
};
