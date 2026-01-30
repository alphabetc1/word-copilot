# Word Copilot

基于 Office.js 的 Word 智能写作助手插件，集成大模型 API，支持文档润色、翻译、批注等功能。

## 功能特性

- **侧边栏对话**：在 Word 中与 AI 进行多轮对话，处理选中文本
- **右键菜单命令**：快速润色、翻译、添加批注建议
- **用户规则配置**：自定义写作风格、语气、长度、语言偏好
- **Function Calling**：通过工具调用机制直接操作 Word 文档

## 技术栈

- Office.js (Word JavaScript API)
- React 18 + TypeScript
- Fluent UI React Components
- Webpack 5

## 项目结构

```
/word-copilot
├── manifest.xml                    # Office Add-in 清单文件
├── package.json                    # 依赖配置
├── tsconfig.json                   # TypeScript 配置
├── webpack.config.js               # Webpack 打包配置
├── src/
│   ├── taskpane/                   # 侧边栏 UI
│   │   ├── index.html
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── styles.css
│   │   └── components/
│   │       ├── ChatPanel.tsx       # 聊天面板
│   │       ├── SettingsPanel.tsx   # 设置面板
│   │       └── MessageItem.tsx     # 消息组件
│   ├── commands/                   # 右键菜单命令
│   │   ├── commands.html
│   │   └── commands.ts
│   ├── helpers/                    # 核心模块
│   │   ├── llmClient.ts           # 大模型 API 客户端
│   │   ├── wordBridge.ts          # Word 文档操作封装
│   │   ├── contextManager.ts      # 对话上下文管理
│   │   ├── settings.ts            # 设置存取
│   │   ├── toolExecutor.ts        # 工具执行器
│   │   └── systemPrompt.ts        # 系统提示词
│   └── types/                      # 类型定义
│       ├── llm.ts
│       ├── tools.ts
│       └── settings.ts
└── assets/                         # 图标资源
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 准备图标

在 `assets/` 目录下添加以下图标文件：
- `icon-16.png` (16x16)
- `icon-32.png` (32x32)
- `icon-64.png` (64x64)
- `icon-80.png` (80x80)

### 3. 开发模式运行

```bash
npm run dev
```

这将在 `https://localhost:3000` 启动开发服务器。

### 4. 在 Word 中加载插件

#### Windows / Mac 桌面版
1. 打开 Word
2. 文件 → 选项 → 信任中心 → 信任中心设置 → 受信任的加载项目录
3. 添加 manifest.xml 所在目录的路径
4. 重启 Word
5. 插入 → 获取加载项 → 共享文件夹 → 选择 Word Copilot

#### Word Online
1. 上传 manifest.xml 到 OneDrive
2. 在 Word Online 中：插入 → 获取加载项 → 上传我的加载项
3. 选择 manifest.xml 文件

### 5. 配置 API

1. 打开插件侧边栏
2. 切换到「设置」标签
3. 填写：
   - **Base URL**: 例如 `https://api.openai.com`
   - **API Key**: 你的 API 密钥
   - **模型名称**: 例如 `gpt-4o`
4. 点击「保存设置」

## 使用方法

### 侧边栏对话

1. 在 Word 中选中要处理的文本
2. 打开 Word Copilot 侧边栏
3. 在输入框中输入指令，例如：
   - "润色这段话"
   - "翻译成英文"
   - "让这段话更简洁"
   - "这段话有什么问题？"
4. 点击发送，AI 会自动执行相应操作

### 右键菜单

1. 选中文本
2. 右键点击，选择「Copilot」菜单
3. 选择操作：
   - **润色选中内容**：改进表达
   - **翻译选中内容**：中英互译
   - **添加批注建议**：不修改原文，添加改进建议

### 用户规则

在设置中配置你的写作偏好：
- **风格**：学术 / 正式 / 商务 / 口语 / 创意
- **语气**：严谨 / 中性 / 亲切
- **长度**：尽量简短 / 正常 / 详细
- **语言**：优先中文 / 优先英文 / 跟随文档语言
- **其他规则**：自由文本，例如"避免第一人称"

## 工具定义

插件通过以下工具与 Word 文档交互：

| 工具名 | 功能 | 参数 |
|--------|------|------|
| `replace_selection` | 替换选中内容 | `content`, `comment?` |
| `insert_text` | 插入文本 | `position`, `content`, `comment?` |
| `delete_selection` | 删除选中内容 | `comment?` |
| `add_comment_to_selection` | 添加批注 | `comment` |

## 构建生产版本

```bash
npm run build
```

输出目录：`dist/`

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run build:dev    # 构建开发版本
npm run lint         # 运行 ESLint
npm run validate     # 验证 manifest.xml
```

## 兼容性

- Microsoft Word 2016+ (Windows/Mac)
- Microsoft Word Online
- 需要 Word API 1.1+

## 注意事项

1. 开发时需要 HTTPS，webpack-dev-server 会自动生成自签名证书
2. 首次在浏览器/Word 中加载时可能需要信任证书
3. API Key 存储在 localStorage，不要在公共设备上使用
4. 大文档可能需要较长处理时间，请耐心等待

## License

MIT
