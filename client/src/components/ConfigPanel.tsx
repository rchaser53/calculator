import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import { FXData, ConfigData, Position } from '../types';

interface ConfigPanelProps {
  data: FXData;
  onSave: (configData: ConfigData) => Promise<void>;
  onCancel: () => void;
}

interface ConfigState {
  balance: number;
  currentPrice: number;
  positions: Position[];
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ data, onSave, onCancel }) => {
  const [config, setConfig] = useState<ConfigState>({
    balance: 0,
    currentPrice: 0,
    positions: []
  });
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (data) {
      setConfig({
        balance: data.account.balance,
        currentPrice: data.currentPrice,
        positions: [...data.positions]
      });
    }
  }, [data]);

  const handleAccountChange = (field: 'balance' | 'currentPrice', value: string): void => {
    setConfig(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handlePositionChange = (index: number, field: keyof Position, value: string | number): void => {
    setConfig(prev => ({
      ...prev,
      positions: prev.positions.map((pos, i) => 
        i === index ? { 
          ...pos, 
          [field]: (field === 'lots' || field === 'entryPrice' || field === 'swapPoint') 
            ? parseFloat(value.toString()) || 0 
            : value 
        } : pos
      )
    }));
  };

  const addPosition = (): void => {
    const newPosition: Position = {
      id: `pos${config.positions.length + 1}`,
      pair: "USD/JPY",
      side: 'buy',
      lots: 1,
      entryPrice: config.currentPrice,
      entryDate: new Date().toISOString().split('T')[0],
      comment: '',
      swapPoint: 1
    };

    setConfig(prev => ({
      ...prev,
      positions: [...prev.positions, newPosition]
    }));
  };

  const removePosition = (index: number): void => {
    setConfig(prev => ({
      ...prev,
      positions: prev.positions.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      const saveData: ConfigData = {
        account: { balance: config.balance },
        currentPrice: config.currentPrice,
        positions: config.positions
      };
      await onSave(saveData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Row className="mb-4">
      <Col xs={12}>
        <Card>
          <Card.Header>
            <h5 className="mb-0">📝 設定編集</h5>
          </Card.Header>
          <Card.Body>
            {/* 口座情報設定 */}
            <div className="config-section">
              <h6 className="text-primary mb-3">💰 口座情報</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>口座残高（円）</Form.Label>
                    <Form.Control
                      type="number"
                      value={config.balance}
                      onChange={(e) => handleAccountChange('balance', e.target.value)}
                      placeholder="4500000"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>現在価格（円）</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.001"
                      value={config.currentPrice}
                      onChange={(e) => handleAccountChange('currentPrice', e.target.value)}
                      placeholder="147.000"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* ポジション設定 */}
            <div className="config-section">
              <h6 className="text-primary mb-3">📋 ポジション設定</h6>
              {config.positions.map((position, index) => (
                <div key={index} className="editable-position">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">ポジション {index + 1}</h6>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removePosition(index)}
                    >
                      削除
                    </Button>
                  </div>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>ID</Form.Label>
                        <Form.Control
                          type="text"
                          value={position.id || ''}
                          onChange={(e) => handlePositionChange(index, 'id', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>売買</Form.Label>
                        <Form.Select
                          value={position.side}
                          onChange={(e) => handlePositionChange(index, 'side', e.target.value)}
                        >
                          <option value="buy">買い</option>
                          <option value="sell">売り</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>ロット数</Form.Label>
                        <Form.Control
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={position.lots}
                          onChange={(e) => handlePositionChange(index, 'lots', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-2">
                        <Form.Label>建値（円）</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.001"
                          value={position.entryPrice}
                          onChange={(e) => handlePositionChange(index, 'entryPrice', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>建日</Form.Label>
                        <Form.Control
                          type="date"
                          value={position.entryDate || ''}
                          onChange={(e) => handlePositionChange(index, 'entryDate', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>スワップポイント</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.1"
                          value={position.swapPoint || 1}
                          onChange={(e) => handlePositionChange(index, 'swapPoint', e.target.value)}
                          placeholder="1"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>コメント</Form.Label>
                        <Form.Control
                          type="text"
                          value={position.comment || ''}
                          onChange={(e) => handlePositionChange(index, 'comment', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              ))}
              <Button variant="success" size="sm" onClick={addPosition}>
                ➕ ポジション追加
              </Button>
            </div>

            {/* 操作ボタン */}
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={onCancel}>
                キャンセル
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '💾 保存して更新'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ConfigPanel;