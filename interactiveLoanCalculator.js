/**
 * インタラクティブローン計算機
 * ユーザーからの入力を受け取ってローン計算を行います
 */

const readline = require('readline');
const { displayLoanCalculation } = require('./loanCalculator');

// 入力インターフェースの作成
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 数値入力を促す関数
 * @param {string} prompt - 入力を促すメッセージ
 * @param {function} validator - 入力値の検証関数
 * @returns {Promise<number>} 入力された数値
 */
function askNumber(prompt, validator) {
  return new Promise((resolve) => {
    function ask() {
      rl.question(prompt, (answer) => {
        const num = parseFloat(answer.replace(/,/g, '')); // カンマを除去して数値に変換
        
        if (validator(num)) {
          resolve(num);
        } else {
          console.log('無効な値です。もう一度入力してください。');
          ask();
        }
      });
    }
    ask();
  });
}

/**
 * メイン関数：ユーザーからの入力を受け取ってローン計算を実行
 */
async function main() {
  console.log('='.repeat(50));
  console.log('        インタラクティブローン計算機');
  console.log('='.repeat(50));
  console.log('※ 数値にはカンマを入れても構いません（例: 30,000,000）\n');

  try {
    // ローン金額の入力
    const loanAmount = await askNumber(
      'ローン金額（円）を入力してください: ',
      (num) => !isNaN(num) && num > 0
    );

    // 年利率の入力
    const annualRate = await askNumber(
      '年利率（%）を入力してください: ',
      (num) => !isNaN(num) && num >= 0 && num <= 100
    );

    // 借入期間の入力
    const years = await askNumber(
      '借入期間（年）を入力してください: ',
      (num) => !isNaN(num) && num > 0 && Number.isInteger(num)
    );

    console.log('\n計算中...\n');

    // 計算結果の表示
    displayLoanCalculation(loanAmount, annualRate, years);

    // 別の計算を行うかの確認
    rl.question('\n別の条件で計算しますか？ (y/N): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\n');
        main(); // 再帰的に実行
      } else {
        console.log('\nありがとうございました！');
        rl.close();
      }
    });

  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    rl.close();
  }
}

// プログラムの開始
if (require.main === module) {
  main();
}
