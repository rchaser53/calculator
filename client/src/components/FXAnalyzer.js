import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap';
import CurrentStatus from './CurrentStatus';
import CriticalLevels from './CriticalLevels';
import AccountInfo from './AccountInfo';
import MarginChart from './MarginChart';
import PositionsList from './PositionsList';
import AnalysisTable from './AnalysisTable';
import ConfigPanel from './ConfigPanel';
import Toast from './Toast';

const FXAnalyzer = () => {
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fx-analysis');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      setOriginalData(JSON.parse(JSON.stringify(result))); // Deep copy
      setLoading(false);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      showToast('データの読み込みに失敗しました: ' + error.message, 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleConfigPanel = () => {
    setShowConfig(!showConfig);
  };

  const handleConfigSave = async (configData) => {
    try {
      const response = await fetch('/api/fx-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showToast('設定が保存されました', 'success');
      await loadData();
      setShowConfig(false);
    } catch (error) {
      console.error('設定保存エラー:', error);
      showToast('設定の保存に失敗しました: ' + error.message, 'error');
    }
  };

  const handleConfigCancel = () => {
    setData(JSON.parse(JSON.stringify(originalData)));
    setShowConfig(false);
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  if (loading && !data) {
    return (
      <Container fluid className="py-4">
        <div className="loading">
          <div className="text-center">
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-2">データを読み込んでいます...</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col xs={12}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2 mb-0">📊 FX証拠金維持率分析ツール</h1>
            <div>
              <Button 
                variant={showConfig ? "outline-danger" : "outline-primary"}
                className="me-2"
                onClick={toggleConfigPanel}
              >
                {showConfig ? "❌ 編集終了" : "⚙️ 設定編集"}
              </Button>
              <span className="badge bg-info fs-6">楽天FX仕様対応</span>
            </div>
          </div>
        </Col>
      </Row>

      {showConfig && (
        <ConfigPanel
          data={data}
          onSave={handleConfigSave}
          onCancel={handleConfigCancel}
        />
      )}

      {data && (
        <>
          <Row>
            <Col xl={4} lg={6} className="mb-4">
              <CurrentStatus data={data.currentAnalysis} currentPrice={data.currentPrice} />
            </Col>
            <Col xl={4} lg={6} className="mb-4">
              <CriticalLevels data={data.criticalLevels} />
            </Col>
            <Col xl={4} lg={12} className="mb-4">
              <AccountInfo data={data} />
            </Col>
          </Row>

          <Row>
            <Col xs={12} className="mb-4">
              <MarginChart data={data.analysisResults} criticalLevels={data.criticalLevels} />
            </Col>
          </Row>

          <Row>
            <Col lg={6} className="mb-4">
              <PositionsList 
                positions={data.positions} 
                currentAnalysis={data.currentAnalysis}
              />
            </Col>
            <Col lg={6} className="mb-4">
              <AnalysisTable data={data.analysisResults} />
            </Col>
          </Row>

          <Row>
            <Col xs={12} className="text-center">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing && (
                  <Spinner 
                    animation="border" 
                    size="sm" 
                    className="me-2" 
                  />
                )}
                🔄 データを更新
              </Button>
            </Col>
          </Row>
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Container>
  );
};

export default FXAnalyzer;