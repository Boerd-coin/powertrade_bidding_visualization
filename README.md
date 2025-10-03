# 📊 电力交易招投标中标电价趋势可视化系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)]()
[![Tech Stack](https://img.shields.io/badge/tech-HTML%2FCSS%2FJS%2BPlotly-orange.svg)]()

一个现代化的电力交易数据可视化平台，采用深色科技主题设计，提供交互式的电价趋势分析和数据展示功能。

## 🚀 项目介绍

### 项目目的
本项目旨在为广西电力交易市场提供一个直观的数据可视化，帮助使用者：
- 分析电力市场价格趋势
- 识别市场参与者行为模式
- 支持数据驱动的决策制定

### 核心功能
- **时间序列可视化**：彩色渐变散点图展示电价时间趋势
- **平滑趋势线**：基于三次样条插值的智能趋势分析
- **交互式数据表**：实时显示最新交易记录
- **响应式设计**：完美适配各种设备尺寸
- **深色科技主题**：现代化的视觉设计

### 技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| **HTML5** | - | 页面结构和语义化标记 |
| **CSS3** | - | 样式设计和响应式布局 |
| **JavaScript ES6+** | - | 交互逻辑和数据处理 |
| **Plotly.js** | Latest | 图表渲染和可视化 |
| **GitHub Pages** | - | 静态站点托管和部署 |

## ✨ 功能特色


### 📈 数据可视化
- **时间轴颜色映射**：不同时间的数据点使用不同颜色
- **交互式选择**：点击散点高亮显示详细信息
- **双击清除**：双击图表清除所有选择状态

### 📱 响应式体验
- **多端适配**：支持手机、平板、桌面设备
- **自适应布局**：图表和表格动态调整比例
- **触摸友好**：优化的触控交互体验

### 🔄 数据交互
- **实时表格**：显示最新交易记录
- **悬停提示**：丰富的数据详情展示
- **点击联动**：图表与表格数据联动

## 🛠️ 使用方法

### 1. 数据文件格式

项目使用JSON格式的数据文件，标准格式如下：

```json
{
  "data": [
    {
      "user_name": "华东钢铁集团",
      "power_company": "华能售电公司", 
      "bid_date": "2023-01-15",
      "bid_price": 0.485
    }
  ]
}
```

**字段说明：**
- `user_name`: 用户名称（字符串）
- `power_company`: 售电公司名称（字符串）
- `bid_date`: 中标日期（YYYY-MM-DD格式）
- `bid_price`: 中标电价（数值，单位：元/kWh）

### 2. 本地开发环境搭建

#### 环境要求
- 现代浏览器（Chrome 88+, Firefox 85+, Safari 14+）
- Git（用于版本控制）

#### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/Boerd-coin/powertrade_bidding_visualization.git
cd powertrade_bidding_visualization

# 2. 启动本地服务器
# 方法一：使用Python
python3 -m http.server 8080

# 方法二：使用Node.js
npx http-server -p 8080

# 3. 访问应用
# 在浏览器中打开：http://localhost:8080
```

### 3. GitHub Pages部署

1. Fork本项目到你的GitHub账户
2. 进入项目设置 (Settings)
3. 找到Pages选项
4. 选择部署源为"Deploy from a branch"
5. 选择分支为"main"，目录为"/ (root)"
6. 点击Save，等待部署完成

### 4. 数据更新方法

#### 方法一：直接替换文件
1. 准备符合格式的JSON数据文件
2. 替换`bidding_data.json`文件
3. 提交并推送到GitHub

#### 方法二：修改数据源
在`data-handler.js`中修改数据源路径：
```javascript
// 修改数据文件路径
const DATA_SOURCE = './your-data-file.json';
```

## 📁 项目结构

```
powertrade_bidding_visualization/
│
├── 📄 index.html              # 主页面文件
├── 🎨 main.css               # 主样式文件（深色主题）
├── 📱 responsive.css         # 响应式样式
├── 🧠 main.js                # 主应用逻辑
├── 📊 chart.js               # 图表配置和交互
├── 🔄 data-handler.js        # 数据处理模块
├── 📋 bidding_data.json       # 数据文件
├── 📖 README.md              # 项目文档
└── 🖼️ screenshots/           # 项目截图（可选）
```

### 文件功能介绍

| 文件 | 功能描述 |
|------|----------|
| `index.html` | 页面结构定义，包含图表容器和数据表格 |
| `main.css` | 深色科技主题样式，发光效果和动画 |
| `responsive.css` | 响应式布局适配，多设备兼容 |
| `main.js` | 应用程序入口，协调各模块工作 |
| `chart.js` | Plotly图表配置，交互事件处理 |
| `data-handler.js` | 数据加载、验证和格式化处理 |
| `bidding_data.json` | 电力交易数据 |

## 🎨 定制化指南

### 修改样式主题

#### 1. 颜色主题定制
在`main.css`中修改CSS变量：
```css
:root {
  --primary-color: #00ffff;      /* 主色调 */
  --secondary-color: #66d9ef;    /* 辅助色 */
  --accent-color: #ff6b6b;       /* 强调色 */
  --bg-color: #0a0f1c;          /* 背景色 */
}
```

#### 2. 字体配置
修改字体族设置：
```css
body {
  font-family: 'Your-Font', 'STZhongsong', 'SimSun', serif;
}
```

#### 3. 动画效果
调整动画参数：
```css
.header::before {
  animation: shimmer 3s infinite; /* 修改动画时长 */
}
```

### 添加新的数据字段

#### 1. 修改数据结构
在数据文件中添加新字段：
```json
{
  "user_name": "企业名称",
  "power_company": "售电公司",
  "bid_date": "2023-01-15",
  "bid_price": 485,
  "new_field": "新字段值"  // 添加新字段
}
```

#### 2. 更新表格显示
在`index.html`中添加新的表头：
```html
<thead>
  <tr>
    <th>时间</th>
    <th>电价(元/kWh)</th>
    <th>用户名称</th>
    <th>新字段</th>  <!-- 添加新列 -->
  </tr>
</thead>
```

#### 3. 修改数据处理
在`data-handler.js`中更新数据处理逻辑：
```javascript
populateTable(data) {
  // 添加新字段的显示逻辑
  cell4.textContent = item.new_field || '未知';
}
```

### 调整图表配置

#### 1. 修改散点图样式
在`chart.js`中调整散点图配置：
```javascript
marker: {
  size: 12,                    // 散点大小
  opacity: 0.85,              // 透明度
  colorscale: [               // 自定义颜色映射
    [0, '#your-color-1'],
    [1, '#your-color-2']
  ]
}
```

#### 2. 调整趋势线算法
修改平滑算法参数：
```javascript
// 调整移动平均窗口大小
const windowSize = Math.max(3, Math.floor(n / 10)); // 修改除数

// 调整样条平滑度
line: {
  shape: 'spline',
  smoothing: 1.5  // 修改平滑度
}
```

#### 3. 自定义轴标签
修改轴配置：
```javascript
xaxis: {
  title: {
    text: '自定义X轴标题',
    font: { size: 16, color: '#custom-color' }
  },
  tickformat: '%m/%d/%Y'  // 自定义日期格式
}
```

## 🙏 致谢

- [Plotly.js](https://plotly.com/javascript/) - 强大的数据可视化库
- [GitHub Pages](https://pages.github.com/) - 免费的静态站点托管

## 

- 项目主页：[GitHub Repository](https://github.com/Boerd-coin/powertrade_bidding_visualization)
- 问题反馈：[Issues](https://github.com/Boerd-coin/powertrade_bidding_visualization/issues)
- 线上网址：[广西电力交易零售市场动态](https://boerd-coin.github.io/powertrade_bidding_visualization/)

---
