import React from 'react';
import { Card } from 'react-bootstrap';
import { Position, CurrentAnalysis } from '../types';

interface PositionsListProps {
  positions: Position[];
  currentAnalysis: CurrentAnalysis;
}

const PositionsList: React.FC<PositionsListProps> = ({ positions, currentAnalysis }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(amount)) + '円';
  };

  const totalLots = positions.reduce((sum, pos) => sum + pos.lots, 0);
  const totalUnits = totalLots * 10000;

  return (
    <Card>
      <Card.Body>
        <Card.Title>📋 ポジション一覧</Card.Title>
        {positions.map((position, index) => {
          const positionDetail = currentAnalysis.positionDetails[index];
          const pnlClass = positionDetail.pnl >= 0 ? 'text-success' : 'text-danger';
          const pnlPrefix = positionDetail.pnl >= 0 ? '+' : '';
          const units = position.lots * 10000;

          return (
            <div key={position.id} className="position-card p-3 mb-2 bg-light rounded">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>[{position.id}] {position.side.toUpperCase()} {position.lots}ロット</strong>
                  <div className="text-muted small">
                    @ {position.entryPrice.toFixed(2)}円 ({units.toLocaleString()}通貨)
                  </div>
                  <div className="small">{position.comment || ''}</div>
                </div>
                <div className="text-end">
                  <div className={`${pnlClass} fw-bold`}>
                    {pnlPrefix}{formatCurrency(positionDetail.pnl)}
                  </div>
                  <div className="text-muted small">{position.entryDate}</div>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="mt-3">
          <div className="d-flex justify-content-between">
            <strong>合計ロット数:</strong>
            <span>{totalLots}ロット</span>
          </div>
          <div className="d-flex justify-content-between">
            <strong>合計通貨:</strong>
            <span>{totalUnits.toLocaleString()}通貨</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PositionsList;