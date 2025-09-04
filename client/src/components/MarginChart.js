import React from 'react';
import { Card } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MarginChart = ({ data, criticalLevels }) => {
  const getChartColor = (riskLevel) => {
    const colors = {
      'danger': '#dc3545',
      'warning': '#fd7e14',
      'caution': '#20c997',
      'safe': '#198754'
    };
    return colors[riskLevel] || '#007bff';
  };

  const labels = data.map(r => `${r.rate.toFixed(1)}円`);
  const marginData = data.map(r => r.marginLevel);
  const colors = data.map(r => getChartColor(r.riskLevel));

  const chartData = {
    labels: labels,
    datasets: [{
      label: '証拠金維持率 (%)',
      data: marginData,
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      borderWidth: 3,
      pointBackgroundColor: colors,
      pointBorderColor: colors,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.4,
      fill: true
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'USD/JPY証拠金維持率推移 (楽天FX仕様)',
        font: {
          size: 16
        }
      },
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: '証拠金維持率 (%)'
        },
        beginAtZero: false,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'USD/JPYレート (円)'
        },
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    hover: {
      animationDuration: 0
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  // 水平線描画プラグイン
  const horizontalLinesPlugin = {
    id: 'horizontalLines',
    afterDraw: (chart) => {
      const ctx = chart.canvas.getContext('2d');
      const yAxis = chart.scales.y;
      
      // マージンコールライン (100%)
      const marginCallY = yAxis.getPixelForValue(100);
      ctx.save();
      ctx.strokeStyle = '#fd7e14';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(chart.chartArea.left, marginCallY);
      ctx.lineTo(chart.chartArea.right, marginCallY);
      ctx.stroke();
      
      // ラベル
      ctx.fillStyle = '#fd7e14';
      ctx.font = '12px Arial';
      ctx.fillText('マージンコール (100%)', chart.chartArea.left + 10, marginCallY - 5);
      
      // ストップアウトライン (50%)
      const stopOutY = yAxis.getPixelForValue(50);
      ctx.strokeStyle = '#dc3545';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(chart.chartArea.left, stopOutY);
      ctx.lineTo(chart.chartArea.right, stopOutY);
      ctx.stroke();
      
      // ラベル
      ctx.fillStyle = '#dc3545';
      ctx.fillText('ストップアウト (50%)', chart.chartArea.left + 10, stopOutY - 5);
      
      ctx.restore();
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>📊 証拠金維持率推移グラフ</Card.Title>
        <div className="chart-container">
          <Line data={chartData} options={options} plugins={[horizontalLinesPlugin]} />
        </div>
      </Card.Body>
    </Card>
  );
};

export default MarginChart;