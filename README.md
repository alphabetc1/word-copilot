# Word Copilot

基于 Office.js 的 Word 智能写作助手插件，集成大模型 API，支持文档润色、翻译、批注等功能。

## 功能特性

- **侧边栏对话**：在 Word 中与 AI 进行多轮对话，处理选中文本
- **右键菜单命令**：快速润色、翻译、添加批注建议
- **用户规则配置**：自定义写作风格、语气、长度、语言偏好
- **Function Calling**：通过工具调用机制直接操作 Word 文档


## 快速开始

### Mac

```bash
# 1. 安装依赖
npm install

# 2. 安装 HTTPS 证书（首次需要，会要求输入密码）
npm run dev:certs

# 3. Sideload 插件到 Word
npm run sideload:mac

# 4. 启动开发服务器
npm run dev

# 5. 完全退出 Word (Cmd+Q)，重新打开
# 6. 插入 → 加载项 → 我的加载项 → 选择 Word Copilot
```

### Windows

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 在 Word 中：插入 → 获取加载项 → 我的加载项 → 上传我的加载项
# 4. 选择项目中的 manifest.xml 文件
```

### Word Online

```bash
npm install && npm run dev
# 然后在 Word Online: 插入 → 加载项 → 上传我的加载项 → 选择 manifest.xml
```

### 配置 API

1. 打开插件侧边栏，切换到「设置」标签
2. 填写：
   - **Base URL**: 例如 `https://api.openai.com`
   - **API Key**: 你的 API 密钥
   - **模型名称**: 例如 `gpt-4o`
3. 点击「保存设置」

## 使用方法

### 侧边栏对话

1. 选中要处理的文本
2. 在侧边栏输入指令，例如：
   - "润色这段话"
   - "翻译成英文"
   - "让这段话更简洁"
3. AI 会自动执行相应操作

### 右键菜单

选中文本 → 右键 → Copilot 菜单：
- **润色选中内容**
- **翻译选中内容**
- **添加批注建议**


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


## 开发命令

```bash
npm run dev          # 启动开发服务器 (https://localhost:3000)
npm run build        # 构建生产版本
npm run lint         # 代码检查
npm run validate     # 验证 manifest.xml
```


## 兼容性

- Microsoft Word 2016+ (Windows/Mac)
- Microsoft Word Online
- 需要 Word API 1.1+

## License

Licensed under the [Apache License, Version 2.0](./LICENSE).
