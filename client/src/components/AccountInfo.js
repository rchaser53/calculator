import React from 'react';
import { Card } from 'react-bootstrap';

const AccountInfo = ({ data }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(amount)) + '円';
  };

  return (
    <Card className="border-info h-100">
      <Card.Body>
        <Card.Title className="text-info">💰 口座情報</Card.Title>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span>口座残高</span>
          <strong>{formatCurrency(data.account.balance)}</strong>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span>必要証拠金</span>
          <strong>{formatCurrency(data.currentAnalysis.requiredMargin)}</strong>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span>レバレッジ</span>
          <strong>{data.settings.leverage}倍</strong>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AccountInfo;