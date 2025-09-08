import React, { useState, useMemo } from 'react';
import { Card, Form, Row, Col, Table } from 'react-bootstrap';
import { Position } from '../types';

interface SwapCalculatorProps {
  positions: Position[];
}

const SwapCalculator: React.FC<SwapCalculatorProps> = ({ positions }) => {
  const [days, setDays] = useState<number>(30);

  const swapCalculations = useMemo(() => {
    const calculations = positions.map(position => {
      const swapPoint = position.swapPoint || 1; // デフォルト値1
      const dailySwap = position.lots * swapPoint;
      const totalSwap = dailySwap * days;
      
      return {
        id: position.id,
        side: position.side,
        lots: position.lots,
        swapPoint,
        dailySwap,
        totalSwap
      };
    });

    const totalDailySwap = calculations.reduce((sum, calc) => sum + calc.dailySwap, 0);
    const totalSwapAmount = totalDailySwap * days;

    return {
      positions: calculations,
      totalDailySwap,
      totalSwapAmount
    };
  }, [positions, days]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>💰 スワップポイント計算</Card.Title>
        
        {/* 日数入力 */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>計算日数</Form.Label>
              <Form.Control
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 1)}
                min="1"
                max="365"
              />
            </Form.Group>
          </Col>
          <Col md={8} className="d-flex align-items-end">
            <div className="ms-3">
              <div className="text-muted">1日あたり合計: <strong>{formatCurrency(swapCalculations.totalDailySwap)}</strong></div>
              <div className="text-success fs-5">
                {days}日後の合計スワップ: <strong>{formatCurrency(swapCalculations.totalSwapAmount)}</strong>
              </div>
            </div>
          </Col>
        </Row>

        {/* ポジション別スワップ詳細 */}
        {swapCalculations.positions.length > 0 && (
          <div>
            <h6 className="text-primary mb-3">📋 ポジション別スワップ詳細</h6>
            <Table striped hover size="sm" responsive>
              <thead className="table-dark">
                <tr>
                  <th>ポジションID</th>
                  <th>売買</th>
                  <th>ロット数</th>
                  <th>スワップポイント</th>
                  <th>1日あたり</th>
                  <th>{days}日後</th>
                </tr>
              </thead>
              <tbody>
                {swapCalculations.positions.map((calc, index) => (
                  <tr key={calc.id}>
                    <td className="fw-bold">{calc.id}</td>
                    <td>
                      <span className={`badge ${calc.side === 'buy' ? 'bg-success' : 'bg-danger'}`}>
                        {calc.side === 'buy' ? '買い' : '売り'}
                      </span>
                    </td>
                    <td>{calc.lots}</td>
                    <td>{calc.swapPoint}</td>
                    <td className="text-success">{formatCurrency(calc.dailySwap)}</td>
                    <td className="text-success fw-bold">{formatCurrency(calc.totalSwap)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan={4} className="fw-bold">合計</td>
                  <td className="text-success fw-bold">{formatCurrency(swapCalculations.totalDailySwap)}</td>
                  <td className="text-success fw-bold fs-6">{formatCurrency(swapCalculations.totalSwapAmount)}</td>
                </tr>
              </tfoot>
            </Table>
          </div>
        )}

        {swapCalculations.positions.length === 0 && (
          <div className="text-muted text-center py-4">
            ポジションがありません
          </div>
        )}

        {/* 説明 */}
        <div className="mt-3">
          <small className="text-muted">
            ※ スワップポイントは通貨ペアや証券会社により異なります。実際の値は各証券会社の情報をご確認ください。
            <br />
            ※ デフォルトでスワップポイント1として計算しています。
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SwapCalculator;