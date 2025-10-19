/**
 * 电力交易招投标数据可视化 - 图表模块
 * 负责Plotly散点图的配置、渲染和交互功能
 * 
 * @author PowerTrade Visualization Team
 * @version 1.0.0
 * @date 2025-10-02
 */

class PowerTradeChart {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.chartData = null;
        this.selectedPoint = null;
        this.isInitialized = false;
        
        // 图表配置
        this.layout = this.getDefaultLayout();
        this.config = this.getDefaultConfig();
        
        // 绑定事件处理器
        this.bindEvents();
    }

    /**
     * 获取默认图表布局配置
     */
    getDefaultLayout() {
        return {
            xaxis: {
                title: {
                    text: '中标日期',
                    font: {
                        family: 'STZhongsong, Arial',
                        size: 16,
                        color: '#00ffff'
                    },
                    standoff: 20
                },
                type: 'date',
                tickformat: '%Y/%m/%d',
                tickangle: -45,
                showgrid: true,
                gridcolor: 'rgba(0, 255, 255, 0.15)',
                gridwidth: 1,
                linecolor: 'rgba(0, 255, 255, 0.5)',
                linewidth: 2,
                zerolinecolor: 'rgba(0, 255, 255, 0.4)',
                zerolinewidth: 2,
                tickfont: {
                    family: 'STZhongsong, Arial',
                    size: 12,
                    color: '#66d9ef'
                },
                tickcolor: 'rgba(0, 255, 255, 0.3)',
                ticklen: 8,
                tickwidth: 2,
                mirror: false,  // 不显示右侧边框
                ticks: 'outside',
                showline: true
            },
            yaxis: {
                title: {
                    text: '中标电价 (元/MWh)',
                    font: {
                        family: 'STZhongsong, Arial',
                        size: 16,
                        color: '#00ffff'
                    },
                    standoff: 20
                },
                showgrid: true,
                gridcolor: 'rgba(0, 255, 255, 0.15)',
                gridwidth: 1,
                linecolor: 'rgba(0, 255, 255, 0.5)',
                linewidth: 2,
                zerolinecolor: 'rgba(0, 255, 255, 0.4)',
                zerolinewidth: 2,
                tickfont: {
                    family: 'STZhongsong, Arial',
                    size: 12,
                    color: '#66d9ef'
                },
                tickformat: '.3f',
                tickcolor: 'rgba(0, 255, 255, 0.3)',
                ticklen: 8,
                tickwidth: 2,
                mirror: false,  // 不显示上方边框
                ticks: 'outside',
                showline: true,
            },
            plot_bgcolor: 'rgba(0, 0, 0, 0)',
            paper_bgcolor: 'rgba(0, 0, 0, 0)',
            font: {
                family: 'STZhongsong, Arial',
                size: 12,
                color: '#e0e0e0'
            },
            hovermode: 'closest',
            margin: {
                l: 80,
                r: 20,
                t: 60,
                b: 80
            },
            showlegend: false,
            autosize: true,
            responsive: true
        };
    }

    /**
     * 获取默认图表配置
     */
    getDefaultConfig() {
        return {
            displayModeBar: true,
            modeBarButtonsToRemove: [
                'pan2d', 'select2d', 'lasso2d', 'resetScale2d',
                'hoverClosestCartesian', 'hoverCompareCartesian',
                'toggleSpikelines'
            ],
            displaylogo: false,
            locale: 'zh-CN',
            responsive: true,
            useResizeHandler: true,
            style: {
                width: '100%',
                height: '100%'
            }
        };
    }

    /**
     * 绑定窗口事件
     */
    bindEvents() {
        // 窗口大小改变时重新调整图表
        window.addEventListener('resize', this.debounce(() => {
            if (this.isInitialized) {
                this.resizeChart();
            }
        }, 250));
    }

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 初始化图表
     * @param {Array} data - 招投标数据数组
     */
    async initChart(data) {
        try {
            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error('无效的数据格式');
            }

            this.chartData = data;
            const plotData = this.prepareChartData(data);
            
            // 确保容器有正确的尺寸
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            
            // 创建图表
            await Plotly.newPlot(this.containerId, plotData, this.layout, this.config);
            
            // 强制调整大小以填满容器
            setTimeout(() => {
                Plotly.Plots.resize(this.containerId);
            }, 100);
            
            // 绑定点击事件
            this.container.on('plotly_click', (eventData) => {
                this.handlePointClick(eventData);
            });

            // 绑定悬停事件
            this.container.on('plotly_hover', (eventData) => {
                this.handlePointHover(eventData);
            });

            // 绑定双击事件来清除选择
            this.container.on('plotly_doubleclick', () => {
                this.clearSelection();
            });

            this.isInitialized = true;
            console.log('图表初始化成功');
            
        } catch (error) {
            console.error('图表初始化失败:', error);
            this.showError('图表加载失败，请重试');
            throw error;
        }
    }

    /**
     * 准备图表数据
     * @param {Array} data - 原始数据
     * @returns {Array} Plotly格式的数据
     */
    prepareChartData(data) {
        // 按日期排序
        const sortedData = data.sort((a, b) => new Date(a.bid_date) - new Date(b.bid_date));

        // 创建时间基础的调色板
        const colors = this.generateTimeBasedColors(sortedData);

        // 准备散点图数据
        const scatter = {
            x: sortedData.map(item => item.bid_date),
            y: sortedData.map(item => item.bid_price),
            text: sortedData.map(item => 
                `用户: ${item.user_name}<br>` +
                `售电公司: ${item.power_company}<br>` +
                `日期: ${item.bid_date}<br>` +
                `电价: ${item.bid_price} 元/MWh`
            ),
            mode: 'markers',
            type: 'scatter',
            name: '中标电价',
            marker: {
                size: 10,
                color: colors,
                symbol: 'circle',
                line: {
                    width: 2,
                    color: 'rgba(255, 255, 255, 0.3)'
                },
                opacity: 0.85,
                colorscale: [
                    [0, '#ff006e'],      // 深粉色 (最早)
                    [0.15, '#fb5607'],   // 橙红色
                    [0.3, '#ffbe0b'],    // 金黄色
                    [0.45, '#8ecae6'],   // 浅蓝色
                    [0.6, '#219ebc'],    // 中蓝色
                    [0.75, '#023047'],   // 深蓝色
                    [0.9, '#00ffff'],    // 青色
                    [1, '#9d4edd']       // 紫色 (最新)
                ],
                showscale: false     // 移除colorbar
            },
            hovertemplate: 
                '<b>%{text}</b>' +
                '<extra></extra>',
            hoverlabel: {
                bgcolor: 'rgba(26, 26, 46, 0.95)',
                bordercolor: '#00ffff',
                font: {
                    size: 12,
                    color: '#e0e0e0'
                }
            }
        };

        // 添加简单线性趋势线
        const trendLine = this.calculateLinearTrendLine(sortedData);
        
        return [scatter, trendLine];
    }

    /**
     * 生成基于时间的颜色数组
     * @param {Array} sortedData - 按时间排序的数据
     * @returns {Array} 颜色值数组
     */
    generateTimeBasedColors(sortedData) {
        const dataLength = sortedData.length;
        const colors = [];
        
        for (let i = 0; i < dataLength; i++) {
            // 基于索引位置生成0-1之间的值，用于颜色映射
            const normalizedTime = i / (dataLength - 1);
            colors.push(normalizedTime);
        }
        
        return colors;
    }

    /**
     * 计算线性趋势线
     * @param {Array} data - 排序后的数据
     * @returns {Object} 线性趋势线数据
     */
    calculateLinearTrendLine(data) {
        const n = data.length;
        const xValues = data.map((_, index) => index);
        const yValues = data.map(item => item.bid_price);
        
        // 线性回归计算
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // 只用起点和终点确保是直线
        const startY = slope * 0 + intercept;
        const endY = slope * (n - 1) + intercept;
        
        return {
            x: [data[0].bid_date, data[n - 1].bid_date],  // 只用起始和结束日期
            y: [startY, endY],  // 只用起始和结束的Y值
            mode: 'lines',
            type: 'scatter',
            name: '线性趋势线',
            line: {
                color: 'rgba(255, 107, 107, 0.8)',
                width: 2,
                dash: 'dash',
                shape: 'linear'  // 强制指定为直线
            },
            hovertemplate: '线性趋势<br>电价: %{y:.3f} 元/MWh<extra></extra>',
            opacity: 0.7
        };
    }

    /**
     * 处理点击事件
     * @param {Object} eventData - 点击事件数据
     */
    handlePointClick(eventData) {
        try {
            if (eventData.points && eventData.points.length > 0) {
                const point = eventData.points[0];
                const pointIndex = point.pointIndex;
                
                if (this.chartData && this.chartData[pointIndex]) {
                    const selectedData = this.chartData[pointIndex];
                    this.selectedPoint = pointIndex;
                    
                    // 高亮选中的点
                    this.highlightPoint(pointIndex);
                    
                    // 触发自定义事件，通知其他模块
                    const customEvent = new CustomEvent('pointSelected', {
                        detail: {
                            data: selectedData,
                            index: pointIndex
                        }
                    });
                    window.dispatchEvent(customEvent);
                    
                    console.log('选中数据点:', selectedData);
                }
            }
        } catch (error) {
            console.error('处理点击事件失败:', error);
        }
    }

    /**
     * 处理悬停事件
     * @param {Object} eventData - 悬停事件数据
     */
    handlePointHover(eventData) {
        if (eventData.points && eventData.points.length > 0) {
            const point = eventData.points[0];
            // 可以在这里添加悬停效果
            this.container.style.cursor = 'pointer';
        }
    }

    /**
     * 高亮选中的点
     * @param {number} pointIndex - 点的索引
     */
    highlightPoint(pointIndex) {
        try {
            // 获取原始的颜色数组（基于时间的渐变色）
            const originalColors = this.generateTimeBasedColors(this.chartData);
            
            // 只改变大小，保持原有颜色
            const update = {
                'marker.size': this.chartData.map((_, index) => index === pointIndex ? 14 : 10),
                'marker.color': originalColors,  // 保持原有的时间基础颜色
                'marker.line.width': this.chartData.map((_, index) => index === pointIndex ? 3 : 2),
                'marker.line.color': this.chartData.map((_, index) => 
                    index === pointIndex ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)'
                )
            };
            
            Plotly.restyle(this.containerId, update, 0);
        } catch (error) {
            console.error('高亮点失败:', error);
        }
    }

    /**
     * 更新图表数据
     * @param {Array} newData - 新的数据
     */
    async updateChart(newData) {
        try {
            if (!newData || !Array.isArray(newData)) {
                throw new Error('无效的数据格式');
            }

            this.chartData = newData;
            const plotData = this.prepareChartData(newData);
            
            await Plotly.react(this.containerId, plotData, this.layout, this.config);
            
            console.log('图表更新成功');
        } catch (error) {
            console.error('图表更新失败:', error);
            this.showError('图表更新失败');
            throw error;
        }
    }

    /**
     * 调整图表大小
     */
    resizeChart() {
        try {
            if (this.container && this.isInitialized) {
                Plotly.Plots.resize(this.containerId);
            }
        } catch (error) {
            console.error('图表大小调整失败:', error);
        }
    }

    /**
     * 清空选中状态
     */
    clearSelection() {
        try {
            this.selectedPoint = null;
            if (this.chartData && this.isInitialized) {
                // 恢复原始的颜色和大小
                const originalColors = this.generateTimeBasedColors(this.chartData);
                const update = {
                    'marker.size': this.chartData.map(() => 10),
                    'marker.color': originalColors,
                    'marker.line.width': this.chartData.map(() => 2),
                    'marker.line.color': this.chartData.map(() => 'rgba(255, 255, 255, 0.3)')
                };
                Plotly.restyle(this.containerId, update, 0);
            }
        } catch (error) {
            console.error('清空选中状态失败:', error);
        }
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
     */
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="chart-error">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">${message}</div>
                    <button class="retry-btn" onclick="window.location.reload()">重新加载</button>
                </div>
            `;
        }
    }

    /**
     * 获取图表统计信息
     * @returns {Object} 统计信息
     */
    getChartStats() {
        if (!this.chartData || this.chartData.length === 0) {
            return null;
        }

        const prices = this.chartData.map(item => item.bid_price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

        return {
            totalRecords: this.chartData.length,
            minPrice: minPrice.toFixed(3),
            maxPrice: maxPrice.toFixed(3),
            avgPrice: avgPrice.toFixed(3),
            dateRange: {
                start: this.chartData[0]?.bid_date,
                end: this.chartData[this.chartData.length - 1]?.bid_date
            }
        };
    }

    /**
     * 销毁图表
     */
    destroy() {
        try {
            if (this.isInitialized) {
                Plotly.purge(this.containerId);
                this.isInitialized = false;
            }
            
            // 移除事件监听器
            window.removeEventListener('resize', this.resizeChart);
            
            console.log('图表已销毁');
        } catch (error) {
            console.error('销毁图表失败:', error);
        }
    }
}

// 导出图表类
window.PowerTradeChart = PowerTradeChart;