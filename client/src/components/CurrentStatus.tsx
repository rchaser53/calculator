import React from 'react';
import { Card } from 'react-bootstrap';
import { CurrentAnalysis } from '../types';

interface CurrentStatusProps {
  data: CurrentAnalysis;
  currentPrice: number;
}

const CurrentStatus: React.FC<CurrentStatusProps> = ({ data, currentPrice }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(amount)) + '円';
  };

  return (
    <Card className="metrics-card h-100">
      <Card.Body>
        <Card.Title>📈 現在の状況</Card.Title>
        <div className="row text-center">
          <div className="col-6">
            <h3 className="mb-1">{data.marginLevel.toFixed(1)}%</h3>
            <small>証拠金維持率</small>
          </div>
          <div className="col-6">
            <h3 className="mb-1">{currentPrice.toFixed(2)}円</h3>
            <small>現在価格</small>
          </div>
          <div className="col-6 mt-3">
            <h4 className="mb-1">{formatCurrency(data.totalPnL)}</h4>
            <small>合計損益</small>
          </div>
          <div className="col-6 mt-3">
            <h4 className="mb-1">{formatCurrency(data.equity)}</h4>
            <small>有効証拠金</small>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CurrentStatus;