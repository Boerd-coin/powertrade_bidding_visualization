/**
 * 电力交易招投标数据可视化 - 数据处理模块
 * 负责数据加载、格式化、验证和处理功能
 * 
 * @author PowerTrade Visualization Team
 * @version 1.0.0
 * @date 2025-10-02
 */

class DataHandler {
    constructor() {
        this.rawData = null;
        this.processedData = null;
        this.dataCache = new Map();
        this.isLoading = false;
        
        // 数据字段配置
        this.requiredFields = ['user_name', 'power_company', 'bid_date', 'bid_price'];
        this.dataTypes = {
            user_name: 'string',
            power_company: 'string',
            bid_date: 'date',
            bid_price: 'number'
        };
    }

    /**
     * 异步加载JSON数据
     * @param {string} dataUrl - 数据文件URL
     * @param {boolean} useCache - 是否使用缓存
     * @returns {Promise<Array>} 返回处理后的数据数组
     */
    async loadData(dataUrl = './data-sample.json', useCache = true) {
        try {
            // 检查缓存
            if (useCache && this.dataCache.has(dataUrl)) {
                console.log('从缓存加载数据');
                return this.dataCache.get(dataUrl);
            }

            if (this.isLoading) {
                throw new Error('数据正在加载中，请稍候');
            }

            this.isLoading = true;
            this.showLoadingState(true);

            console.log(`开始加载数据: ${dataUrl}`);
            
            const response = await fetch(dataUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                cache: 'default'
            });

            if (!response.ok) {
                throw new Error(`数据加载失败: ${response.status} ${response.statusText}`);
            }

            const jsonData = await response.json();
            
            // 验证数据结构
            const validatedData = this.validateDataStructure(jsonData);
            
            // 处理数据
            const processedData = this.processData(validatedData);
            
            // 缓存数据
            if (useCache) {
                this.dataCache.set(dataUrl, processedData);
            }

            this.rawData = validatedData;
            this.processedData = processedData;

            console.log(`数据加载成功，共 ${processedData.length} 条记录`);
            
            return processedData;

        } catch (error) {
            console.error('数据加载失败:', error);
            this.showError(error.message);
            throw error;
        } finally {
            this.isLoading = false;
            this.showLoadingState(false);
        }
    }

    /**
     * 验证数据结构
     * @param {Object} jsonData - JSON数据对象
     * @returns {Array} 验证后的数据数组
     */
    validateDataStructure(jsonData) {
        if (!jsonData) {
            throw new Error('数据为空');
        }

        // 支持多种数据结构
        let dataArray;
        if (Array.isArray(jsonData)) {
            dataArray = jsonData;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
            dataArray = jsonData.data;
        } else {
            throw new Error('数据格式不正确，期望数组或包含data字段的对象');
        }

        if (dataArray.length === 0) {
            throw new Error('数据为空');
        }

        // 验证每条记录
        const validatedData = [];
        const errors = [];

        dataArray.forEach((item, index) => {
            try {
                const validatedItem = this.validateRecord(item, index);
                validatedData.push(validatedItem);
            } catch (error) {
                errors.push(`第${index + 1}条记录: ${error.message}`);
            }
        });

        if (errors.length > 0) {
            console.warn('数据验证警告:', errors);
            // 如果超过20%的数据有问题，抛出错误
            if (errors.length / dataArray.length > 0.2) {
                throw new Error(`数据质量较差，${errors.length}/${dataArray.length} 条记录有问题`);
            }
        }

        if (validatedData.length === 0) {
            throw new Error('没有有效的数据记录');
        }

        return validatedData;
    }

    /**
     * 验证单条记录
     * @param {Object} record - 单条数据记录
     * @param {number} index - 记录索引
     * @returns {Object} 验证后的记录
     */
    validateRecord(record, index) {
        if (!record || typeof record !== 'object') {
            throw new Error('记录格式无效');
        }

        const validatedRecord = {};

        // 检查必需字段
        for (const field of this.requiredFields) {
            if (!(field in record)) {
                throw new Error(`缺少必需字段: ${field}`);
            }

            const value = record[field];
            const expectedType = this.dataTypes[field];

            // 类型验证和转换
            switch (expectedType) {
                case 'string':
                    if (typeof value !== 'string' || value.trim() === '') {
                        throw new Error(`字段 ${field} 必须为非空字符串`);
                    }
                    validatedRecord[field] = value.trim();
                    break;

                case 'number':
                    const numValue = parseFloat(value);
                    if (isNaN(numValue) || !isFinite(numValue)) {
                        throw new Error(`字段 ${field} 必须为有效数字`);
                    }
                    // 电价合理性检查
                    if (field === 'bid_price' && (numValue < 0.1 || numValue > 2.0)) {
                        throw new Error(`电价 ${numValue} 超出合理范围 (0.1-2.0)`);
                    }
                    validatedRecord[field] = numValue;
                    break;

                case 'date':
                    const dateValue = new Date(value);
                    if (isNaN(dateValue.getTime())) {
                        throw new Error(`字段 ${field} 必须为有效日期格式`);
                    }
                    // 日期合理性检查
                    const now = new Date();
                    const minDate = new Date('2020-01-01');
                    if (dateValue > now || dateValue < minDate) {
                        throw new Error(`日期 ${value} 超出合理范围`);
                    }
                    validatedRecord[field] = value; // 保持原始字符串格式
                    validatedRecord[`${field}_parsed`] = dateValue; // 添加解析后的日期对象
                    break;

                default:
                    validatedRecord[field] = value;
            }
        }

        return validatedRecord;
    }

    /**
     * 处理数据
     * @param {Array} data - 验证后的原始数据
     * @returns {Array} 处理后的数据
     */
    processData(data) {
        try {
            // 按日期排序
            const sortedData = this.sortByDate(data);
            
            // 数据清洗
            const cleanedData = this.cleanData(sortedData);
            
            // 添加计算字段
            const enrichedData = this.enrichData(cleanedData);
            
            return enrichedData;
        } catch (error) {
            console.error('数据处理失败:', error);
            throw new Error(`数据处理失败: ${error.message}`);
        }
    }

    /**
     * 按日期排序数据
     * @param {Array} data - 数据数组
     * @returns {Array} 排序后的数据
     */
    sortByDate(data, ascending = true) {
        return data.sort((a, b) => {
            const dateA = new Date(a.bid_date);
            const dateB = new Date(b.bid_date);
            return ascending ? dateA - dateB : dateB - dateA;
        });
    }

    /**
     * 数据清洗
     * @param {Array} data - 数据数组
     * @returns {Array} 清洗后的数据
     */
    cleanData(data) {
        return data.map(item => ({
            ...item,
            user_name: this.cleanString(item.user_name),
            power_company: this.cleanString(item.power_company),
            bid_price: this.roundPrice(item.bid_price)
        }));
    }

    /**
     * 清理字符串
     * @param {string} str - 原始字符串
     * @returns {string} 清理后的字符串
     */
    cleanString(str) {
        return str.replace(/\s+/g, ' ').trim();
    }

    /**
     * 价格四舍五入
     * @param {number} price - 原始价格
     * @returns {number} 四舍五入后的价格
     */
    roundPrice(price) {
        return Math.round(price * 1000) / 1000; // 保留3位小数
    }

    /**
     * 数据增强
     * @param {Array} data - 清洗后的数据
     * @returns {Array} 增强后的数据
     */
    enrichData(data) {
        return data.map((item, index) => ({
            ...item,
            id: index + 1,
            bid_date_formatted: this.formatDate(item.bid_date),
            bid_price_formatted: `${item.bid_price.toFixed(3)} 元/kWh`,
            quarter: this.getQuarter(item.bid_date),
            month: this.getMonth(item.bid_date),
            year: this.getYear(item.bid_date)
        }));
    }

    /**
     * 格式化日期
     * @param {string} dateStr - 日期字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    /**
     * 获取季度
     * @param {string} dateStr - 日期字符串
     * @returns {string} 季度
     */
    getQuarter(dateStr) {
        const month = new Date(dateStr).getMonth() + 1;
        return `Q${Math.ceil(month / 3)}`;
    }

    /**
     * 获取月份
     * @param {string} dateStr - 日期字符串
     * @returns {number} 月份
     */
    getMonth(dateStr) {
        return new Date(dateStr).getMonth() + 1;
    }

    /**
     * 获取年份
     * @param {string} dateStr - 日期字符串
     * @returns {number} 年份
     */
    getYear(dateStr) {
        return new Date(dateStr).getFullYear();
    }

    /**
     * 获取最新N条记录
     * @param {number} count - 记录数量，默认10条
     * @param {Array} data - 数据数组，默认使用处理后的数据
     * @returns {Array} 最新的记录
     */
    getLatestRecords(count = 10, data = null) {
        const sourceData = data || this.processedData;
        if (!sourceData || sourceData.length === 0) {
            return [];
        }

        // 按日期降序排序，获取最新的记录
        const sortedData = this.sortByDate([...sourceData], false);
        return sortedData.slice(0, count);
    }

    /**
     * 数据过滤
     * @param {Object} filters - 过滤条件
     * @param {Array} data - 数据数组，默认使用处理后的数据
     * @returns {Array} 过滤后的数据
     */
    filterData(filters, data = null) {
        const sourceData = data || this.processedData;
        if (!sourceData || sourceData.length === 0) {
            return [];
        }

        return sourceData.filter(item => {
            // 日期范围过滤
            if (filters.startDate && new Date(item.bid_date) < new Date(filters.startDate)) {
                return false;
            }
            if (filters.endDate && new Date(item.bid_date) > new Date(filters.endDate)) {
                return false;
            }

            // 价格范围过滤
            if (filters.minPrice && item.bid_price < filters.minPrice) {
                return false;
            }
            if (filters.maxPrice && item.bid_price > filters.maxPrice) {
                return false;
            }

            // 用户名过滤
            if (filters.userName && !item.user_name.includes(filters.userName)) {
                return false;
            }

            // 售电公司过滤
            if (filters.powerCompany && !item.power_company.includes(filters.powerCompany)) {
                return false;
            }

            return true;
        });
    }

    /**
     * 获取数据统计信息
     * @param {Array} data - 数据数组，默认使用处理后的数据
     * @returns {Object} 统计信息
     */
    getDataStatistics(data = null) {
        const sourceData = data || this.processedData;
        if (!sourceData || sourceData.length === 0) {
            return null;
        }

        const prices = sourceData.map(item => item.bid_price);
        const dates = sourceData.map(item => new Date(item.bid_date));

        return {
            totalRecords: sourceData.length,
            priceStats: {
                min: Math.min(...prices),
                max: Math.max(...prices),
                average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
                median: this.calculateMedian(prices)
            },
            dateRange: {
                earliest: new Date(Math.min(...dates)),
                latest: new Date(Math.max(...dates))
            },
            uniqueUsers: new Set(sourceData.map(item => item.user_name)).size,
            uniqueCompanies: new Set(sourceData.map(item => item.power_company)).size
        };
    }

    /**
     * 计算中位数
     * @param {Array} numbers - 数字数组
     * @returns {number} 中位数
     */
    calculateMedian(numbers) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        } else {
            return sorted[middle];
        }
    }

    /**
     * 显示加载状态
     * @param {boolean} isLoading - 是否正在加载
     */
    showLoadingState(isLoading) {
        // 触发自定义事件通知UI更新
        const event = new CustomEvent('dataLoadingStateChanged', {
            detail: { isLoading }
        });
        window.dispatchEvent(event);
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
     */
    showError(message) {
        // 触发自定义事件通知UI显示错误
        const event = new CustomEvent('dataError', {
            detail: { message }
        });
        window.dispatchEvent(event);
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.dataCache.clear();
        console.log('数据缓存已清除');
    }

    /**
     * 获取缓存信息
     * @returns {Object} 缓存信息
     */
    getCacheInfo() {
        return {
            size: this.dataCache.size,
            keys: Array.from(this.dataCache.keys())
        };
    }

    /**
     * 导出数据
     * @param {string} format - 导出格式 ('json' | 'csv')
     * @param {Array} data - 要导出的数据
     * @returns {string} 导出的数据字符串
     */
    exportData(format = 'json', data = null) {
        const sourceData = data || this.processedData;
        if (!sourceData || sourceData.length === 0) {
            throw new Error('没有可导出的数据');
        }

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(sourceData, null, 2);
            
            case 'csv':
                return this.convertToCSV(sourceData);
            
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
    }

    /**
     * 转换为CSV格式
     * @param {Array} data - 数据数组
     * @returns {string} CSV字符串
     */
    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        const csvRows = data.map(row => 
            headers.map(header => {
                const value = row[header];
                // 处理包含逗号的字段
                return typeof value === 'string' && value.includes(',') 
                    ? `"${value}"` 
                    : value;
            }).join(',')
        );

        return [csvHeaders, ...csvRows].join('\n');
    }
}

// 导出数据处理类
window.DataHandler = DataHandler;
