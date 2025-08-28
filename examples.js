/**
 * ローン計算機の使用例
 * 様々なシナリオでの計算例を示します
 */

const { displayLoanCalculation, calculateMonthlyPayment } = require('./loanCalculator');

console.log('ローン計算機の使用例\n');

// 例1: 一般的な住宅ローン（フラット35）
console.log('例1: 一般的な住宅ローン（フラット35）');
console.log('条件: 借入額3500万円、金利1.3%、35年返済');
displayLoanCalculation(35000000, 1.3, 35);
console.log('\n' + '='.repeat(80) + '\n');

// 例1-2: 同条件で住宅ローン控除適用
console.log('例1-2: 同条件で住宅ローン控除適用');
console.log('条件: 借入額3500万円、金利1.3%、35年返済（住宅ローン控除あり）');
displayLoanCalculation(35000000, 1.3, 35, true);
console.log('\n' + '='.repeat(80) + '\n');

// 例2: 短期間・高金利のローン
console.log('例2: 短期間・高金利のローン');
console.log('条件: 借入額500万円、金利3.5%、10年返済');
displayLoanCalculation(5000000, 3.5, 10);
console.log('\n' + '='.repeat(80) + '\n');

// 例3: 無利息ローン（金利0%）
console.log('例3: 無利息ローン（親族からの借入など）');
console.log('条件: 借入額1000万円、金利0%、15年返済');
displayLoanCalculation(10000000, 0, 15);
console.log('\n' + '='.repeat(80) + '\n');

// 例4: 異なる金利での比較
console.log('例4: 同条件での金利比較（借入額2000万円、20年返済）');
const scenarios = [
  { rate: 0.5, name: '超低金利' },
  { rate: 1.0, name: '低金利' },
  { rate: 1.5, name: '標準金利' },
  { rate: 2.0, name: 'やや高金利' },
  { rate: 3.0, name: '高金利' }
];

console.log('金利比較表:');
console.log('金利(%) | 月額返済額 | 総支払額   | 総利息額  ');
console.log('-'.repeat(45));

scenarios.forEach(scenario => {
  const monthly = calculateMonthlyPayment(20000000, scenario.rate, 20);
  const total = monthly * 20 * 12;
  const interest = total - 20000000;
  
  console.log(
    `${scenario.rate.toString().padStart(6)} | ` +
    `${Math.round(monthly).toLocaleString().padStart(9)} | ` +
    `${Math.round(total).toLocaleString().padStart(9)} | ` +
    `${Math.round(interest).toLocaleString().padStart(8)}`
  );
});

console.log('\n' + '='.repeat(80) + '\n');

// 例5: 繰上返済シミュレーション（概算）
console.log('例5: 繰上返済の効果（概算）');
console.log('ベース条件: 借入額3000万円、金利1.5%、35年返済');

const baseMonthly = calculateMonthlyPayment(30000000, 1.5, 35);
const baseTotal = baseMonthly * 35 * 12;

console.log(`通常返済: 月額${Math.round(baseMonthly).toLocaleString()}円、総支払額${Math.round(baseTotal).toLocaleString()}円`);

// より簡単な比較：期間短縮による効果
console.log('\n期間短縮による効果の比較:');
const periods = [35, 30, 25, 20, 15];
console.log('期間(年) | 月額返済額 | 総支払額   | 節約額    ');
console.log('-'.repeat(45));

periods.forEach(period => {
  const monthly = calculateMonthlyPayment(30000000, 1.5, period);
  const total = monthly * period * 12;
  const savings = baseTotal - total;
  
  console.log(
    `${period.toString().padStart(7)} | ` +
    `${Math.round(monthly).toLocaleString().padStart(9)} | ` +
    `${Math.round(total).toLocaleString().padStart(9)} | ` +
    `${Math.round(savings).toLocaleString().padStart(8)}`
  );
});

// 例6: 住宅ローン控除の上限効果（4500万円）
console.log('例6: 住宅ローン控除の上限効果の比較');
console.log('借入額5000万円の場合（控除上限4500万円）');
displayLoanCalculation(50000000, 1.3, 35, true);

console.log('\n借入額4000万円の場合（控除上限内）');
displayLoanCalculation(40000000, 1.3, 35, true);

console.log('\n※ 実際の繰上返済効果の計算は複雑です。詳細は金融機関にご相談ください。');
