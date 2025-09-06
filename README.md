# SimpleMath - 数学动画生成平台

一个基于AI的数学概念可视化动画生成平台，通过自然语言描述生成交互式的p5.js数学动画。

## 🌟 项目概述

SimpleMath是一个创新的数学教育工具，它结合了人工智能和可视化技术，让用户通过简单的文字描述就能生成精美的数学动画。无论是傅里叶变换、排序算法，还是几何图形，都能通过AI智能生成对应的p5.js动画代码。

## ✨ 主要功能

- 🤖 **AI驱动代码生成**：使用OpenAI GPT模型根据自然语言描述生成p5.js动画代码
- 🎨 **实时动画预览**：生成的动画在独立的iframe中实时展示
- 📝 **代码编辑器**：内置Monaco编辑器，支持语法高亮和自动补全
- 🔧 **灵活配置**：支持自定义OpenAI API配置和模型参数
- 📱 **响应式设计**：适配不同屏幕尺寸的设备
- 🎯 **示例代码**：内置多种数学动画示例

## 🏗️ 技术栈

### 前端
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript超集
- **Vite** - 快速的前端构建工具
- **TailwindCSS** - 实用优先的CSS框架
- **Pinia** - Vue状态管理库
- **Monaco Editor** - VS Code同款代码编辑器
- **Lucide Vue** - 美观的图标库

### 后端
- **Express** - Node.js Web应用框架
- **TypeScript** - 服务端类型安全
- **CORS** - 跨域资源共享支持
- **UUID** - 唯一标识符生成

### 动画引擎
- **p5.js** - 创意编程JavaScript库
- **CDN加载** - 快速的p5.js库加载

### AI服务
- **OpenAI API** - GPT模型驱动的代码生成
- **自定义提示词** - 优化的数学动画生成提示

## 🏛️ 架构设计

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vue Frontend  │    │  Express Server │    │   OpenAI API    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ ChatPanel   │ │◄──►│ │ API Routes  │ │◄──►│ │ GPT Models  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    └─────────────────┘
│ │AnimationPanel│ │◄──►│ │Static Files │ │
│ └─────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ CodeEditor  │ │    │ │HTML Generator│ │
│ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘
```

### 核心工作流程

1. **用户输入**：在ChatPanel中描述想要的数学动画
2. **AI处理**：调用OpenAI API生成p5.js代码
3. **后端处理**：Express服务器接收代码，生成HTML页面
4. **动画展示**：AnimationPanel通过iframe加载生成的动画
5. **代码编辑**：用户可在CodeEditor中查看和修改代码

## 📁 项目结构

```
SimpleMath/
├── api/                    # 后端服务
│   └── server.ts          # Express服务器主文件
├── src/                   # 前端源码
│   ├── components/        # Vue组件
│   │   ├── AnimationPanel.vue  # 动画展示面板
│   │   ├── ChatPanel.vue      # 对话面板
│   │   ├── CodeEditor.vue     # 代码编辑器
│   │   ├── HeaderNav.vue      # 顶部导航
│   │   ├── MessageItem.vue    # 消息项组件
│   │   └── SettingsModal.vue  # 设置弹窗
│   ├── stores/            # 状态管理
│   │   ├── conversation.ts    # 对话状态
│   │   ├── p5.ts             # p5.js状态
│   │   └── settings.ts       # 设置状态
│   ├── services/          # 服务层
│   │   └── openai.ts         # OpenAI API服务
│   └── pages/             # 页面组件
│       └── HomePage.vue      # 主页
├── .trae/documents/       # 项目文档
│   ├── 产品需求文档.md
│   └── 技术架构文档.md
└── dist/                  # 构建输出目录
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd SimpleMath

# 安装依赖
npm install
```

### 配置OpenAI API

1. 获取OpenAI API密钥：访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 启动应用后，点击右上角设置按钮
3. 填入API密钥和Base URL（默认：https://api.openai.com/v1）
4. 选择模型（推荐：gpt-4）

### 开发模式

```bash
# 启动前端开发服务器（端口5173）
npm run dev

# 启动后端开发服务器（端口3001）
npm run server:dev
```

访问：http://localhost:5173

### 生产模式

```bash
# 构建并启动完整应用（一体化部署）
npm run start

# 或者分步执行
npm run build      # 构建前端
npm run server     # 启动生产服务器
```

访问：http://localhost:3001

## 📚 API接口文档

### 创建动画

```http
POST /api/p5/create
Content-Type: application/json

{
  "code": "function setup() { createCanvas(400, 400); }",
  "title": "动画标题",
  "width": 400,
  "height": 400
}
```

**响应：**
```json
{
  "success": true,
  "url": "http://localhost:3001/animation/abc123-def456",
  "id": "abc123-def456"
}
```

### 获取动画信息

```http
GET /api/p5/:id
```

**响应：**
```json
{
  "success": true,
  "code": "function setup() { ... }",
  "title": "动画标题",
  "width": 400,
  "height": 400,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 访问动画页面

```http
GET /animation/:id
```

返回完整的HTML页面，包含p5.js动画。

## 🎯 使用示例

### 1. 基础几何动画

**输入：** "创建一个旋转的彩色正方形"

**生成代码：**
```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(20);
  
  push();
  translate(width/2, height/2);
  rotate(frameCount * 0.02);
  fill(100, 150, 255);
  rectMode(CENTER);
  rect(0, 0, 100, 100);
  pop();
}
```

### 2. 数学函数可视化

**输入：** "展示正弦波动画"

**生成代码：**
```javascript
let angle = 0;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(20);
  
  stroke(100, 150, 255);
  strokeWeight(2);
  noFill();
  
  beginShape();
  for (let x = 0; x < width; x += 5) {
    let y = height/2 + sin(angle + x * 0.02) * 100;
    vertex(x, y);
  }
  endShape();
  
  angle += 0.02;
}
```

## 🛠️ 开发指南

### 添加新功能

1. **前端组件**：在 `src/components/` 中创建新组件
2. **状态管理**：在 `src/stores/` 中添加新的store
3. **API接口**：在 `api/server.ts` 中添加新路由
4. **样式**：使用TailwindCSS实用类

### 代码规范

- 使用TypeScript进行类型检查
- 遵循Vue 3 Composition API规范
- 使用ESLint和Prettier格式化代码
- 组件文件使用PascalCase命名

### 调试技巧

- 前端：使用Vue DevTools
- 后端：查看控制台日志
- API：使用Postman或curl测试
- 动画：在iframe中打开开发者工具

## 📦 部署指南

### Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "server"]
```

### 传统部署

1. 构建项目：`npm run build`
2. 上传文件到服务器
3. 安装依赖：`npm ci --only=production`
4. 启动服务：`npm run server`
5. 配置反向代理（Nginx/Apache）

---

**SimpleMath** - 让数学变得生动有趣！ 🎨✨
