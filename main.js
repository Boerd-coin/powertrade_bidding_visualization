/**
 * 电力交易招投标数据可视化 - 主控制模块
 * 负责页面初始化、模块协调、错误处理和用户交互
 * 
 * @author PowerTrade Visualization Team
 * @version 1.0.0
 * @date 2025-10-02
 */

class PowerTradeApp {
    constructor() {
        // 核心模块
        this.dataHandler = null;
        this.chart = null;
        
        // DOM元素
        this.elements = {
            chartContainer: null,
            tableContainer: null,
            chartLoading: null,
            tableLoading: null,
            tableBody: null
        };
        
        // 应用状态
        this.state = {
            isInitialized: false,
            isLoading: false,
            currentData: null,
            selectedPoint: null,
            lastUpdateTime: null
        };
        
        // 配置
        this.config = {
            dataUrl: './bidding_data.json',
            recentRecordsCount: 10
        };

        // 初始化应用
        this.init();
    }

    /**
     * 应用初始化
     */
    async init() {
        try {
            console.log('开始初始化电力交易数据展示应用...');
            
            // 初始化DOM元素
            this.initializeElements();
            
            // 初始化核心模块
            this.initializeModules();
            
            // 绑定事件监听器
            this.bindEvents();
            
            // 加载初始数据
            await this.loadInitialData();
            
            this.state.isInitialized = true;
            console.log('应用初始化完成');
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.handleError('应用初始化失败', error);
        }
    }

    /**
     * 初始化DOM元素
     */
    initializeElements() {
        this.elements = {
            chartContainer: document.getElementById('price-chart'),
            tableContainer: document.getElementById('recent-data-table'),
            chartLoading: document.getElementById('chart-loading'),
            tableLoading: document.getElementById('table-loading'),
            tableBody: document.getElementById('table-body')
        };

        // 验证必要元素是否存在
        const requiredElements = ['chartContainer', 'tableContainer'];
        for (const key of requiredElements) {
            if (!this.elements[key]) {
                throw new Error(`必要的DOM元素不存在: ${key}`);
            }
        }
    }

    /**
     * 初始化核心模块
     */
    initializeModules() {
        // 初始化数据处理器
        this.dataHandler = new DataHandler();
        
        // 初始化图表
        this.chart = new PowerTradeChart('price-chart');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 监听数据加载状态变化
        window.addEventListener('dataLoadingStateChanged', (event) => {
            this.handleLoadingStateChange(event.detail.isLoading);
        });

        // 监听数据错误
        window.addEventListener('dataError', (event) => {
            this.handleError('数据加载错误', new Error(event.detail.message));
        });

        // 监听图表点击选择
        window.addEventListener('pointSelected', (event) => {
            this.handlePointSelection(event.detail);
        });

        // 页面可见性变化事件（处理标签页切换）
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.state.isInitialized) {
                this.handleVisibilityChange();
            }
        });

        // 窗口聚焦事件
        window.addEventListener('focus', () => {
            if (this.state.isInitialized) {
                this.handleWindowFocus();
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
        try {
            this.state.isLoading = true;
            this.showLoading(true);

            // 加载数据
            const data = await this.dataHandler.loadData(this.config.dataUrl);
            
            if (!data || data.length === 0) {
                throw new Error('没有可用的数据');
            }

            this.state.currentData = data;
            
            // 初始化图表
            await this.chart.initChart(data);
            
            // 更新表格
            this.updateRecentDataTable(data);
            
            // 更新最后更新时间
            this.updateLastUpdateTime();
            
            this.showLoading(false);
            console.log(`初始数据加载完成，共 ${data.length} 条记录`);
            
        } catch (error) {
            this.showLoading(false);
            throw error;
        }
    }

    /**
     * 处理点选择事件
     * @param {Object} detail - 选择详情
     */
    handlePointSelection(detail) {
        try {
            this.state.selectedPoint = detail;
            
            // 高亮表格中对应的行
            this.highlightTableRow(detail.data);
            
            // 显示详细信息（可选）
            this.showPointDetails(detail.data);
            
            console.log('选中数据点:', detail.data);
            
        } catch (error) {
            console.error('处理点选择失败:', error);
        }
    }

    /**
     * 更新最新数据表格
     * @param {Array} data - 数据数组
     */
    updateRecentDataTable(data) {
        try {
            if (!this.elements.tableBody) {
                console.warn('表格容器不存在');
                return;
            }

            // 获取最新的记录
            const recentData = this.dataHandler.getLatestRecords(
                this.config.recentRecordsCount, 
                data
            );

            // 清空现有内容
            this.elements.tableBody.innerHTML = '';

            // 生成表格行
            recentData.forEach((item, index) => {
                const row = this.createTableRow(item, index);
                this.elements.tableBody.appendChild(row);
            });

            // 显示表格容器
            if (this.elements.tableContainer) {
                this.elements.tableContainer.style.display = 'block';
            }
            
            console.log(`表格更新完成，显示 ${recentData.length} 条最新记录`);
            
        } catch (error) {
            console.error('更新表格失败:', error);
        }
    }

    /**
     * 创建表格行
     * @param {Object} item - 数据项
     * @param {number} index - 索引
     * @returns {HTMLElement} 表格行元素
     */
    createTableRow(item, index) {
        const row = document.createElement('tr');
        row.setAttribute('data-id', item.id || index);
        row.setAttribute('data-date', item.bid_date);
        
        row.innerHTML = `
            <td title="${item.bid_date}">${item.bid_date_formatted || item.bid_date}</td>
            <td title="${item.bid_price_formatted}">${item.bid_price.toFixed(3)}</td>
            <td title="${item.user_name}">${this.truncateText(item.user_name, 8)}</td>
        `;

        // 添加行点击事件
        row.addEventListener('click', () => {
            this.handleTableRowClick(item, row);
        });

        // 添加悬停效果
        row.addEventListener('mouseenter', () => {
            this.showRowTooltip(item, row);
        });

        return row;
    }

    /**
     * 处理表格行点击
     * @param {Object} item - 数据项
     * @param {HTMLElement} row - 表格行元素
     */
    handleTableRowClick(item, row) {
        try {
            // 清除之前的选中状态
            const previousSelected = this.elements.tableBody.querySelector('.selected');
            if (previousSelected) {
                previousSelected.classList.remove('selected');
            }

            // 高亮当前行
            row.classList.add('selected');
            
            // 在图表中高亮对应点
            const dataIndex = this.state.currentData.findIndex(d => 
                d.bid_date === item.bid_date && d.bid_price === item.bid_price
            );
            
            if (dataIndex !== -1) {
                this.chart.highlightPoint(dataIndex);
            }

            // 显示详细信息
            this.showPointDetails(item);
            
        } catch (error) {
            console.error('处理表格行点击失败:', error);
        }
    }

    /**
     * 高亮表格行
     * @param {Object} data - 数据项
     */
    highlightTableRow(data) {
        try {
            if (!this.elements.tableBody) return;

            // 清除之前的高亮
            const rows = this.elements.tableBody.querySelectorAll('tr');
            rows.forEach(row => row.classList.remove('selected'));

            // 找到匹配的行并高亮
            const matchingRow = Array.from(rows).find(row => 
                row.getAttribute('data-date') === data.bid_date
            );

            if (matchingRow) {
                matchingRow.classList.add('selected');
                matchingRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
        } catch (error) {
            console.error('高亮表格行失败:', error);
        }
    }

    /**
     * 更新最后更新时间
     */
    updateLastUpdateTime() {
        try {
            const now = new Date();
            this.state.lastUpdateTime = now;
        } catch (error) {
            console.error('更新时间失败:', error);
        }
    }

    /**
     * 显示/隐藏加载状态
     * @param {boolean} isLoading - 是否显示加载状态
     */
    showLoading(isLoading) {
        try {
            if (this.elements.chartLoading) {
                this.elements.chartLoading.style.display = isLoading ? 'flex' : 'none';
            }
            
            if (this.elements.tableLoading) {
                this.elements.tableLoading.style.display = isLoading ? 'flex' : 'none';
            }
            
            if (this.elements.chartContainer) {
                this.elements.chartContainer.style.display = isLoading ? 'none' : 'block';
            }
            
            if (this.elements.tableContainer) {
                this.elements.tableContainer.style.display = isLoading ? 'none' : 'block';
            }
        } catch (error) {
            console.error('显示加载状态失败:', error);
        }
    }

    /**
     * 处理加载状态变化
     * @param {boolean} isLoading - 是否正在加载
     */
    handleLoadingStateChange(isLoading) {
        this.state.isLoading = isLoading;
    }

    /**
     * 显示成功消息
     * @param {string} message - 成功消息
     */
    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    /**
     * 显示通知消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success|error|warning|info)
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => notification.classList.add('show'), 100);
        
        // 自动移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 处理错误
     * @param {string} context - 错误上下文
     * @param {Error} error - 错误对象
     */
    handleError(context, error) {
        console.error(`${context}:`, error);
        
        const errorMessage = error.message || '未知错误';
        this.showNotification(`${context}: ${errorMessage}`, 'error');
        
        // 错误恢复逻辑
        this.attemptErrorRecovery(context, error);
    }

    /**
     * 尝试错误恢复
     * @param {string} context - 错误上下文
     * @param {Error} error - 错误对象
     */
    attemptErrorRecovery(context, error) {
        // 根据错误类型尝试不同的恢复策略
        if (context.includes('数据加载') || context.includes('数据刷新')) {
            // 数据加载错误，尝试使用缓存数据
            setTimeout(() => {
                console.log('尝试使用缓存数据恢复...');
                // 实现缓存恢复逻辑
            }, 2000);
        }
    }

    /**
     * 处理可见性变化
     */
    handleVisibilityChange() {
        // 页面重新可见时的处理逻辑（已移除自动刷新）
        console.log('页面重新可见');
    }

    /**
     * 处理窗口聚焦
     */
    handleWindowFocus() {
        // 窗口获得焦点时的处理逻辑
        this.updateLastUpdateTime();
    }

    /**
     * 处理键盘快捷键
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyboardShortcuts(event) {
        // Escape: 清除选择
        if (event.key === 'Escape') {
            this.clearSelection();
        }
    }

    /**
     * 清除选择
     */
    clearSelection() {
        try {
            // 清除图表选择
            if (this.chart) {
                this.chart.clearSelection();
            }
            
            // 清除表格选择
            if (this.elements.tableBody) {
                const selected = this.elements.tableBody.querySelector('.selected');
                if (selected) {
                    selected.classList.remove('selected');
                }
            }
            
            this.state.selectedPoint = null;
            
        } catch (error) {
            console.error('清除选择失败:', error);
        }
    }

    /**
     * 显示点详情
     * @param {Object} data - 数据项
     */
    showPointDetails(data) {
        console.log('显示详情:', data);
    }

    /**
     * 显示行提示
     * @param {Object} item - 数据项
     * @param {HTMLElement} row - 表格行
     */
    showRowTooltip(item, row) {
        row.title = `${item.user_name} - ${item.power_company}\n日期: ${item.bid_date}\n电价: ${item.bid_price} 元/MWh`;
    }

    /**
     * 截断文本
     * @param {string} text - 原始文本
     * @param {number} maxLength - 最大长度
     * @returns {string} 截断后的文本
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
    }

    /**
     * 获取应用状态
     * @returns {Object} 应用状态
     */
    getAppState() {
        return {
            ...this.state,
            dataCount: this.state.currentData?.length || 0,
            cacheInfo: this.dataHandler?.getCacheInfo()
        };
    }

    /**
     * 销毁应用
     */
    destroy() {
        try {
            // 销毁图表
            if (this.chart) {
                this.chart.destroy();
            }
            
            // 清除数据缓存
            if (this.dataHandler) {
                this.dataHandler.clearCache();
            }
            
            // 移除事件监听器
            // 注意：这里应该移除所有添加的事件监听器
            
            console.log('应用已销毁');
            
        } catch (error) {
            console.error('销毁应用失败:', error);
        }
    }
}

// 全局变量
let powerTradeApp = null;

/**
 * 页面加载完成后初始化应用
 */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('页面DOM加载完成，开始初始化应用...');
        
        // 检查必要的依赖
        if (typeof Plotly === 'undefined') {
            throw new Error('Plotly.js 未加载');
        }
        
        if (typeof DataHandler === 'undefined') {
            throw new Error('DataHandler 模块未加载');
        }
        
        if (typeof PowerTradeChart === 'undefined') {
            throw new Error('PowerTradeChart 模块未加载');
        }
        
        // 创建应用实例
        powerTradeApp = new PowerTradeApp();
        
        // 将应用实例暴露到全局作用域（便于调试）
        window.powerTradeApp = powerTradeApp;
        
    } catch (error) {
        console.error('应用启动失败:', error);
        
        // 显示启动失败的错误页面
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                padding: 20px;
                border: 1px solid #e74c3c;
                border-radius: 8px;
                background: #fff;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            ">
                <h2 style="color: #e74c3c; margin-bottom: 10px;">应用启动失败</h2>
                <p style="color: #666; margin-bottom: 15px;">${error.message}</p>
                <button onclick="window.location.reload()" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                ">重新加载</button>
            </div>
        `;
    }
});

// 导出主应用类
window.PowerTradeApp = PowerTradeApp;
