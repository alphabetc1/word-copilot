<p align="center">
  <img src="assets/logo.png" alt="Word Copilot Logo" width="180">
</p>
<h1 align="center">Word Copilot</h1>

<p align="center">
  <strong>🤖 AI 驱动的 Word 智能写作助手</strong><br>
  基于 Office.js 构建，无缝集成大模型 API，让你的写作更高效
</p>

<p align="center">
  <a href="./README.en.md">English</a> | <b>简体中文</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Word%202016%2B-blue" alt="Platform">
  <img src="https://img.shields.io/badge/language-TypeScript-3178c6" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-Apache%202.0-green" alt="License">
</p>

---

## ✨ 功能亮点

| 功能 | 说明 |
|------|------|
| 🔄 **修订模式** | 文档修改使用 Word 修订功能，可选择接受/拒绝 |
| 📝 **多场景支持** | 预置学术论文、临床报告、项目申报、公文等写作规范 |
| 💬 **智能对话** | 在 Word 侧边栏与 AI 进行多轮对话，处理选中文本 |
| ⚡ **快捷命令** | 右键菜单一键润色、翻译、添加批注 |
| 📊 **结构检查** | AI 分析文档结构，检查标题层级、引用规范等 |
| 💾 **多会话管理** | 支持多个独立对话，历史记录本地保存 |

## 🚀 快速开始

### 前置要求

- Microsoft Word 2016+ (Windows/Mac) 或 Word Online
- 一个大模型 API Key（支持 OpenAI、Azure、阿里云通义等）

### 方式一：GitHub Pages（最简单 - 无需本地安装）

1. **下载 manifest 文件**：[点击这里下载 word-copilot.xml](https://alphabetc1.github.io/word-copilot/word-copilot.xml)（右键 → 另存为）
2. **安装到 Word（两种方式二选一）**
   - **A. 手动上传（推荐）**：Word → **插入 → 加载项 → 我的加载项 → 上传我的加载项** → 选择下载的 `word-copilot.xml`
   - **B. 手动sideload（当“上传我的加载项”不可用/被禁用时）**
     - **macOS（固定目录 sideload）**
       - 将下载好的`word-copilot.xml`拷贝到 **目标目录**：`~/Library/Containers/com.microsoft.Word/Data/Documents/wef/`

     - **Windows（Shared Folder Catalog sideload）**
       - 将下载好的`word-copilot.xml`拷贝到 **目标目录**：`%USERPROFILE%\Documents\OfficeAddinManifests\word-copilot.xml`
     - 共享文件夹（截图式步骤）：
       - 右键文件夹 → 属性 → 共享 → 共享 → 选择 `Everyone` → 权限选 **读取**
       - 记录共享路径：`\\你的电脑名\OfficeAddinManifests`
     - Trusted Catalog（截图式步骤）：
       - Word → 文件 → 选项 → 信任中心 → 信任中心设置
       - 受信任的加载项目录 → 添加 `\\你的电脑名\OfficeAddinManifests` → 勾选允许
3. 完全退出 Word (Cmd+Q) 并重新打开
4. 在 Word 中：插入 → 加载项 → 我的加载项，找到 **Word Copilot**
5. 在插件设置中配置你的 API Key，点击保存

### 方式二：本地安装（Mac）

```bash
# 如果没有 npm，需要下载并安装 node.js
# 打开浏览器，访问 https://nodejs.org/zh-cn/download/ 下载 installer
# 检查 node/npm
node -v
npm -v

# 1️⃣ 克隆项目并安装依赖
git clone https://github.com/your-repo/word-copilot.git
cd word-copilot
npm install

# 2️⃣ 安装开发证书
npm run dev:certs

# 3️⃣ 将插件加载到 Word
npm run sideload:mac

# 3️⃣ 重启 Word
# ⚠️ 必须完全退出 Word (Cmd+Q)，然后重新打开
#
# 4️⃣ 打开插件入口
# - Ribbon：切换到「Word Copilot」选项卡
# - 或：选中文本后右键 → 「Word Copilot」
```

### 方式三：本地安装（Windows）

```bash
# 1️⃣ 克隆项目并安装依赖
git clone https://github.com/your-repo/word-copilot.git
cd word-copilot
npm install

# 2️⃣ 将插件 sideload 到 Word
npm run sideload:windows
```

### 本地调试（可选）

大部分情况下你只需要 `word-copilot.xml`（GitHub Pages 托管）。只有当你要调试本地代码时，才需要使用 `word-copilot-local.xml`：

```bash
# 1) 首次需要：安装开发证书
npm run dev:certs

# 2) sideload 本地 manifest（会覆盖 wef/catalog 里的 word-copilot.xml）
npm run sideload:mac -- word-copilot-local.xml
# Windows:
# npm run sideload:windows -- word-copilot-local.xml

# 3) 启动本地开发服务器（每次调试都需要保持运行）
npm run dev
```

## ⚙️ 配置 API

首次使用需要配置你的大模型 API：

1. 打开 Word Copilot 侧边栏
2. 点击 **「设置」** 标签
3. 填写以下信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| **Base URL** | API 服务地址 | `https://api.openai.com` |
| **API Key** | 你的密钥 | `sk-xxxx...` |
| **模型名称** | 选择或自定义输入 | `gpt-4o` / `qwen-plus` |

4. 点击 **「保存设置」**，系统会自动测试连接

### 支持的 API 服务

- ✅ OpenAI（官方）
- ✅ Azure OpenAI
- ✅ 阿里云通义千问（DashScope）
- ✅ 其他兼容 OpenAI 格式的服务

## 📖 使用指南

### 方式一：侧边栏对话

最灵活的使用方式，支持复杂的多轮对话：

1. **选中文本**：在文档中选中你想要处理的内容
2. **输入指令**：在侧边栏输入你的需求
3. **AI 处理**：AI 会自动分析并操作文档

**常用指令示例**：
- `润色这段话，使其更加学术化`
- `翻译成英文，保持专业术语`
- `检查这段的语法错误`
- `把这段话压缩到 100 字以内`
- `为这个观点添加解释说明`

### 方式二：右键快捷菜单

选中文本后右键，选择 **Copilot** 菜单：

| 命令 | 功能 |
|------|------|
| 🎨 **润色选中内容** | 优化文字表达，使其更流畅专业 |
| 🌐 **翻译选中内容** | 中英互译，保持术语准确性 |
| 💡 **添加批注建议** | AI 分析内容并添加改进建议 |
| 📊 **结构检查** | 分析整篇文档的结构问题 |

### 方式三：计划模式（长文档写作）

适用于撰写复杂文档如项目申请书、报告：

1. 点击侧边栏的 **「计划」** 标签
2. 回答澄清问题（项目名称、目标等）
3. 查看并编辑生成的大纲
4. 逐段生成内容
5. 根据需要修改提示词并重新生成

### 方式四：结构检查

针对学术写作的专业功能，可检查：

- 📑 标题层级是否规范（H1 → H2 → H3）
- 📋 是否包含必要模块（摘要、引言、结论等）
- 📝 段落是否过长或逻辑跳跃
- 📚 引用标注是否完整

## 🎯 写作场景预设

在设置中可选择不同的写作场景，AI 会自动应用相应的规范：

| 场景 | 适用于 | 特点 |
|------|--------|------|
| **学术论文 (SCI)** | 期刊投稿、学位论文 | IMRAD 结构、学术术语、被动语态 |
| **临床研究报告** | 病例报告、临床试验 | CONSORT/STROBE 规范、ITT 分析 |
| **项目申报书** | 基金申请、课题申报 | 创新性、可行性、技术路线 |
| **行政通知/公文** | 政府公文、通知函 | 公文格式、规范用语 |
| **自定义** | 灵活配置 | 自由设置风格和偏好 |

## 🛠️ 开发命令

```bash
npm run dev           # 启动开发服务器
npm run build         # 构建生产版本
npm run lint          # 代码检查
npm run lint:fix      # 自动修复代码问题
npm run test          # 运行测试
npm run test:watch    # 监听模式运行测试
npm run test:coverage # 生成覆盖率报告
npm run validate      # 验证 word-copilot-local.xml
npm run validate:prod # 验证 word-copilot.xml
npm run sideload:mac  # (macOS) copy manifest to wef folder
npm run sideload:windows # (Windows) copy manifest to catalog folder + guide trust setup
```

## 📁 项目结构

```
word-copilot/
├── 📄 word-copilot.xml          # 生产环境清单（GitHub Pages / 默认使用）
├── 📄 word-copilot-local.xml    # 本地调试清单（localhost:3000）
├── 📄 package.json              # 项目依赖和脚本
├── 📄 jest.config.js            # 测试配置
├── 📁 .github/workflows/        # GitHub Actions CI/CD
├── 📁 src/
│   ├── 📁 taskpane/             # 侧边栏界面
│   │   ├── App.tsx              # 主应用组件
│   │   ├── styles.css           # 样式文件
│   │   └── components/
│   │       ├── ChatPanel.tsx    # 对话面板
│   │       ├── PlanPanel.tsx    # 计划模式面板
│   │       ├── SettingsPanel.tsx # 设置面板
│   │       ├── SessionList.tsx  # 会话列表
│   │       └── MessageItem.tsx  # 消息组件
│   ├── 📁 commands/             # 右键菜单命令
│   ├── 📁 helpers/              # 核心模块
│   │   ├── llmClient.ts         # 大模型 API 客户端
│   │   ├── wordBridge.ts        # Word 文档操作
│   │   ├── sessionManager.ts    # 会话管理
│   │   ├── i18n.ts              # 国际化
│   │   └── ...
│   ├── 📁 types/                # TypeScript 类型定义
│   └── 📁 __tests__/            # 单元测试
└── 📁 assets/                   # 图标和资源
```

## ❓ 常见问题

<details>
<summary><b>Mac 上"我的加载项"菜单是灰色的？</b></summary>

1. 确保已运行 `npm run dev:certs` 安装证书
2. 确保已运行 `npm run sideload:mac`
3. 完全退出 Word (Cmd+Q)，然后重新打开
4. 开发服务器必须保持运行 (`npm run dev`)
</details>

<details>
<summary><b>安装了 EndNote 后，Word Copilot 按钮“消失”了？</b></summary>

这通常不是卸载/冲突，而是 **Ribbon 空间不足被挤到别处**：

1. 在 Ribbon 顶部找一下是否有 **「Word Copilot」** 选项卡（本项目默认放在独立 Tab，避免被 Home 挤没）
2. 或者选中文本后右键，查看是否有 **「Word Copilot」** 菜单
3. 如果你使用的是旧版 manifest（把按钮放在 Home），请把 Word 窗口拉宽，或在 Ribbon 右侧的溢出/更多菜单里找一下

</details>

<details>
<summary><b>API 连接失败怎么办？</b></summary>

1. 检查 Base URL 是否正确（注意结尾不要有多余的 `/`）
2. 确认 API Key 是否有效
3. 检查网络是否能访问 API 服务
4. 查看浏览器控制台的错误信息
</details>

<details>
<summary><b>如何切换到其他 API 服务？</b></summary>

在设置中修改 Base URL 即可，例如：
- OpenAI: `https://api.openai.com`
- Azure: `https://your-resource.openai.azure.com`
- 阿里云: `https://dashscope.aliyuncs.com/compatible-mode/v1`
</details>

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

提交代码前请确保：
1. 运行 `npm run lint:fix` 修复代码风格
2. 运行 `npm run test` 通过所有测试
3. 提交信息符合规范

## 📄 License

本项目采用 [Apache License 2.0](./LICENSE) 开源协议。

---

<p align="center">
  如果这个项目对你有帮助，欢迎给个 ⭐ Star！
</p>
