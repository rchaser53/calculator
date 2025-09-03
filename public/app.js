class FXAnalyzer {
    constructor() {
        this.chart = null;
        this.data = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            document.getElementById('loading').style.display = 'flex';
            document.getElementById('content').style.display = 'none';

            const response = await fetch('/api/fx-analysis');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.data = await response.json();
            this.updateUI();
            this.createChart();

            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'block';

        } catch (error) {
            console.error('データ読み込みエラー:', error);
            this.showError('データの読み込みに失敗しました: ' + error.message);
        }
    }

    updateUI() {
        if (!this.data) return;

        // 現在の状況
        document.getElementById('currentPrice').textContent = this.data.currentPrice.toFixed(2) + '円';
        document.getElementById('currentMarginLevel').textContent = this.data.currentAnalysis.marginLevel.toFixed(1) + '%';
        document.getElementById('totalPnL').textContent = this.formatCurrency(this.data.currentAnalysis.totalPnL);
        document.getElementById('equity').textContent = this.formatCurrency(this.data.currentAnalysis.equity);

        // 重要レベル
        document.getElementById('marginCallLevel').textContent = 
            this.data.criticalLevels.marginCall100 ? this.data.criticalLevels.marginCall100.toFixed(2) + '円' : 'N/A';
        document.getElementById('stopOutLevel').textContent = 
            this.data.criticalLevels.stopOut50 ? this.data.criticalLevels.stopOut50.toFixed(2) + '円' : 'N/A';

        // 口座情報
        document.getElementById('balance').textContent = this.formatCurrency(this.data.account.balance);
        document.getElementById('requiredMargin').textContent = this.formatCurrency(this.data.currentAnalysis.requiredMargin);
        document.getElementById('leverage').textContent = this.data.settings.leverage + '倍';

        // ポジション一覧
        this.updatePositionsList();

        // データテーブル
        this.updateAnalysisTable();
    }

    updatePositionsList() {
        const container = document.getElementById('positionsList');
        container.innerHTML = '';

        let totalLots = 0;
        let totalUnits = 0;

        this.data.positions.forEach((position, index) => {
            const units = position.lots * 10000;
            totalLots += position.lots;
            totalUnits += units;

            const positionDetail = this.data.currentAnalysis.positionDetails[index];
            const pnlClass = positionDetail.pnl >= 0 ? 'text-success' : 'text-danger';
            const pnlPrefix = positionDetail.pnl >= 0 ? '+' : '';

            const card = document.createElement('div');
            card.className = 'position-card p-3 mb-2 bg-light rounded';
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>[${position.id}] ${position.side.toUpperCase()} ${position.lots}ロット</strong>
                        <div class="text-muted small">@ ${position.entryPrice.toFixed(2)}円 (${units.toLocaleString()}通貨)</div>
                        <div class="small">${position.comment || ''}</div>
                    </div>
                    <div class="text-end">
                        <div class="${pnlClass} fw-bold">${pnlPrefix}${this.formatCurrency(positionDetail.pnl)}</div>
                        <div class="text-muted small">${position.entryDate}</div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        document.getElementById('totalLots').textContent = totalLots + 'ロット';
        document.getElementById('totalUnits').textContent = totalUnits.toLocaleString() + '通貨';
    }

    updateAnalysisTable() {
        const tbody = document.getElementById('analysisTableBody');
        tbody.innerHTML = '';

        this.data.analysisResults.forEach(result => {
            const row = document.createElement('tr');
            const riskClass = this.getRiskClass(result.riskLevel);
            const pnlPrefix = result.totalPnL >= 0 ? '+' : '';
            
            row.innerHTML = `
                <td class="fw-bold">${result.rate.toFixed(1)}円</td>
                <td class="${riskClass}">${result.marginLevel.toFixed(1)}%</td>
                <td class="${result.totalPnL >= 0 ? 'text-success' : 'text-danger'}">${pnlPrefix}${this.formatCurrency(result.totalPnL)}</td>
                <td><span class="badge bg-${this.getRiskBadgeColor(result.riskLevel)}">${this.getRiskText(result.riskLevel)}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    createChart() {
        const ctx = document.getElementById('marginChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = this.data.analysisResults.map(r => r.rate.toFixed(1) + '円');
        const marginData = this.data.analysisResults.map(r => r.marginLevel);
        const colors = this.data.analysisResults.map(r => this.getChartColor(r.riskLevel));

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
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
            },
            options: {
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
            }
        });

        // 重要レベルの水平線を追加
        this.addHorizontalLines();
    }

    addHorizontalLines() {
        // Chart.jsプラグインで重要レベルの水平線を追加
        Chart.register({
            id: 'horizontalLines',
            beforeDraw: (chart) => {
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
                ctx.beginPath();
                ctx.moveTo(chart.chartArea.left, stopOutY);
                ctx.lineTo(chart.chartArea.right, stopOutY);
                ctx.stroke();
                
                // ラベル
                ctx.fillStyle = '#dc3545';
                ctx.fillText('ストップアウト (50%)', chart.chartArea.left + 10, stopOutY - 5);
                
                ctx.restore();
            }
        });
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', async () => {
            const btn = document.getElementById('refreshBtn');
            const spinner = btn.querySelector('.spinner-border');
            
            btn.disabled = true;
            spinner.style.display = 'inline-block';
            
            try {
                await this.loadData();
            } finally {
                btn.disabled = false;
                spinner.style.display = 'none';
            }
        });
    }

    // ユーティリティ関数
    formatCurrency(amount) {
        return new Intl.NumberFormat('ja-JP').format(Math.round(amount)) + '円';
    }

    getRiskClass(riskLevel) {
        const classes = {
            'danger': 'risk-danger',
            'warning': 'risk-warning',
            'caution': 'risk-caution',
            'safe': 'risk-safe'
        };
        return classes[riskLevel] || '';
    }

    getRiskText(riskLevel) {
        const texts = {
            'danger': '強制決済',
            'warning': '警告',
            'caution': '注意',
            'safe': '安全'
        };
        return texts[riskLevel] || '';
    }

    getRiskBadgeColor(riskLevel) {
        const colors = {
            'danger': 'danger',
            'warning': 'warning',
            'caution': 'info',
            'safe': 'success'
        };
        return colors[riskLevel] || 'secondary';
    }

    getChartColor(riskLevel) {
        const colors = {
            'danger': '#dc3545',
            'warning': '#fd7e14',
            'caution': '#20c997',
            'safe': '#198754'
        };
        return colors[riskLevel] || '#007bff';
    }

    showError(message) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').innerHTML = `
            <div class="alert alert-danger text-center" role="alert">
                <h4 class="alert-heading">エラーが発生しました</h4>
                <p>${message}</p>
                <hr>
                <button class="btn btn-outline-danger" onclick="location.reload()">ページを再読み込み</button>
            </div>
        `;
        document.getElementById('content').style.display = 'block';
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    new FXAnalyzer();
});