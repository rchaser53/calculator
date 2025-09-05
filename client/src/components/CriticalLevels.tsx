import React from 'react';
import { Card } from 'react-bootstrap';
import { CriticalLevels as CriticalLevelsType } from '../types';

interface CriticalLevelsProps {
  data: CriticalLevelsType;
}

const CriticalLevels: React.FC<CriticalLevelsProps> = ({ data }) => {
  return (
    <Card className="border-warning h-100">
      <Card.Body>
        <Card.Title className="text-warning">⚠️ 重要レベル</Card.Title>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span>マージンコール (100%)</span>
          <strong className="text-danger">
            {data.marginCall100 ? `${data.marginCall100}円` : 'N/A'}
          </strong>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span>ストップアウト (50%)</span>
          <strong className="text-danger">
            {data.stopOut50 ? `${data.stopOut50}円` : 'N/A'}
          </strong>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CriticalLevels;