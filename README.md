# Todo List - 三层架构 Demo

一个使用 Next.js + Google Apps Script + Google Sheets 构建的 Todo List 应用。

## 架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js       │────▶│ Google Apps     │────▶│  Google Sheets  │
│   (Vercel)      │◀────│ Script (API)    │◀────│  (Database)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     前端 UI              后端 REST API            数据存储
```

## 部署步骤

### Step 1: 创建 Google Sheets 数据库

1. 打开 [Google Sheets](https://sheets.google.com)
2. 创建新的空白试算表，命名为 `Todo Database`
3. 在第一行添加标题列：
   - A1: `id`
   - B1: `title`
   - C1: `completed`
   - D1: `createdAt`
4. 复制 URL 中的 Sheet ID（在 `/d/` 和 `/edit` 之间的字符串）

### Step 2: 创建 Google Apps Script 后端

1. 打开 [Google Apps Script](https://script.google.com)
2. 点击「新项目」
3. 删除默认代码，贴入 `gas/Code.gs` 的内容
4. **重要**: 修改代码第 12 行的 `SHEET_ID` 为你的 Google Sheet ID
5. 点击「保存」(Ctrl+S)

### Step 3: 部署 Google Apps Script 为 Web App

1. 点击右上角「部署」→「新增部署」
2. 点击左侧的�的齿轮图标，选择「网页应用程式」
3. 设置：
   - 说明：`Todo API`
   - 执行身分：`我自己`
   - 谁可以存取：`所有人`（重要！）
4. 点击「部署」
5. 授权应用程式（第一次需要）
6. **复制 Web App URL**（格式：`https://script.google.com/macros/s/xxx/exec`）

### Step 4: 本地开发

```bash
# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env.local

# 编辑 .env.local，填入你的 Web App URL
# NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/xxx/exec

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000 查看应用。

### Step 5: 部署到 Vercel

1. 将代码推送到 GitHub
2. 打开 [Vercel](https://vercel.com)
3. 导入 GitHub repo
4. 添加环境变量：
   - `NEXT_PUBLIC_GAS_URL` = 你的 Web App URL
5. 点击「Deploy」

## 项目结构

```
├── app/
│   ├── globals.css      # 全局样式
│   ├── layout.tsx       # 布局
│   └── page.tsx         # 主页面
├── components/
│   ├── AddTodo.tsx      # 添加 Todo 表单
│   ├── TodoItem.tsx     # 单个 Todo 项
│   └── TodoList.tsx     # Todo 列表
├── gas/
│   └── Code.gs          # Google Apps Script 后端
├── lib/
│   └── api.ts           # API 调用函数
└── types/
    └── todo.ts          # TypeScript 类型
```

## API 端点

| 方法 | 动作 | 说明 |
|------|------|------|
| GET | - | 获取所有 todos |
| POST | add | 添加新 todo |
| POST | update | 更新 todo 完成状态 |
| POST | delete | 删除 todo |

## 技术栈

- **前端**: Next.js 14, React 18, Tailwind CSS
- **后端**: Google Apps Script
- **数据库**: Google Sheets
- **部署**: Vercel
