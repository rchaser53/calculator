import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { AnalysisResult } from '../types';

interface AnalysisTableProps {
  data: AnalysisResult[];
}

const AnalysisTable: React.FC<AnalysisTableProps> = ({ data }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(amount)) + '円';
  };

  const getRiskClass = (riskLevel: AnalysisResult['riskLevel']): string => {
    const classes = {
      'danger': 'risk-danger',
      'warning': 'risk-warning',
      'caution': 'risk-caution',
      'safe': 'risk-safe'
    };
    return classes[riskLevel] || '';
  };

  const getRiskText = (riskLevel: AnalysisResult['riskLevel']): string => {
    const texts = {
      'danger': '強制決済',
      'warning': '警告',
      'caution': '注意',
      'safe': '安全'
    };
    return texts[riskLevel] || '';
  };

  const getRiskBadgeColor = (riskLevel: AnalysisResult['riskLevel']): string => {
    const colors = {
      'danger': 'danger',
      'warning': 'warning',
      'caution': 'info',
      'safe': 'success'
    };
    return colors[riskLevel] || 'secondary';
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>📈 価格別分析データ</Card.Title>
        <div className="table-responsive" style={{ maxHeight: '400px' }}>
          <Table striped hover size="sm">
            <thead className="table-dark sticky-top">
              <tr>
                <th>レート</th>
                <th>証拠金維持率</th>
                <th>損益</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {data.map((result, index) => {
                const pnlPrefix = result.totalPnL >= 0 ? '+' : '';
                return (
                  <tr key={index}>
                    <td className="fw-bold">{result.rate.toFixed(1)}円</td>
                    <td className={getRiskClass(result.riskLevel)}>
                      {result.marginLevel.toFixed(1)}%
                    </td>
                    <td className={result.totalPnL >= 0 ? 'text-success' : 'text-danger'}>
                      {pnlPrefix}{formatCurrency(result.totalPnL)}
                    </td>
                    <td>
                      <Badge bg={getRiskBadgeColor(result.riskLevel)}>
                        {getRiskText(result.riskLevel)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AnalysisTable;