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
 * 年ごとの残金を計算する
 * @param {number} loanAmount - ローン金額（元本）
 * @param {number} monthlyPayment - 月額返済額
 * @param {number} annualRate - 年利率（%）
 * @param {number} years - 借入期間（年）
 * @returns {Array} 年ごとの残金情報
 */
function calculateYearlyBalance(loanAmount, monthlyPayment, annualRate, years) {
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
      remainingBalance: Math.max(0, remainingBalance)
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
 */
function displayLoanCalculation(loanAmount, annualRate, years) {
  console.log('='.repeat(80));
  console.log('                            ローン計算結果');
  console.log('='.repeat(80));
  
  const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, years);
  const yearlyData = calculateYearlyBalance(loanAmount, monthlyPayment, annualRate, years);

  // 基本情報の表示
  console.log(`ローン金額: ${loanAmount.toLocaleString()}円`);
  console.log(`年利率: ${annualRate}%`);
  console.log(`借入期間: ${years}年`);
  console.log(`月額返済額: ${Math.round(monthlyPayment).toLocaleString()}円`);
  console.log('');

  // 年ごとの詳細テーブル
  console.log('年ごとの返済計画:');
  console.log('-'.repeat(80));
  console.log('年 |   年間返済額   |   元本返済額   |   利息支払額   |     残債額     ');
  console.log('-'.repeat(80));

  yearlyData.forEach(data => {
    console.log(
      `${data.year.toString().padStart(2)} | ` +
      `${Math.round(data.yearlyPayment).toLocaleString().padStart(12)} | ` +
      `${Math.round(data.yearlyPrincipal).toLocaleString().padStart(12)} | ` +
      `${Math.round(data.yearlyInterest).toLocaleString().padStart(12)} | ` +
      `${Math.round(data.remainingBalance).toLocaleString().padStart(12)}`
    );
  });

  console.log('-'.repeat(80));

  // 総支払額の計算
  const totalPayments = yearlyData.reduce((sum, data) => sum + data.yearlyPayment, 0);
  const totalInterest = yearlyData.reduce((sum, data) => sum + data.yearlyInterest, 0);

  console.log(`総支払額: ${Math.round(totalPayments).toLocaleString()}円`);
  console.log(`総利息額: ${Math.round(totalInterest).toLocaleString()}円`);
  console.log('='.repeat(80));
}

// 使用例
if (require.main === module) {
  // サンプル計算
  console.log('サンプル計算例:');
  displayLoanCalculation(3000000, 1.5, 35); // 3000万円、年利1.5%、35年
  
  console.log('\n');
  displayLoanCalculation(2000000, 2.0, 20); // 2000万円、年利2.0%、20年
}

// 関数をエクスポート
module.exports = {
  calculateMonthlyPayment,
  calculateYearlyBalance,
  displayLoanCalculation
};
