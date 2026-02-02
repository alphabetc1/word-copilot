<p align="center">
  <img src="assets/logo.png" alt="Word Copilot Logo" width="180">
</p>
<h1 align="center">Word Copilot</h1>

<p align="center">
  <strong>🤖 AI-Powered Intelligent Writing Assistant for Word</strong><br>
  Built with Office.js, seamlessly integrating LLM APIs to boost your writing productivity
</p>

<p align="center">
  <b>English</b> | <a href="./README.md">简体中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Word%202016%2B-blue" alt="Platform">
  <img src="https://img.shields.io/badge/language-TypeScript-3178c6" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-Apache%202.0-green" alt="License">
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **Track Changes** | Document edits use Word's Track Changes, allowing accept/reject |
| 📝 **Writing Presets** | Pre-configured templates for academic papers, clinical reports, proposals, etc. |
| 💬 **Smart Chat** | Multi-turn conversations with AI in Word's sidebar |
| ⚡ **Quick Commands** | Right-click menu for instant polish, translate, and annotate |
| 📊 **Structure Check** | AI analyzes document structure, heading hierarchy, citations |
| 💾 **Session Management** | Multiple independent conversations with local history |
| 🎤 **Voice Input** | Experimental speech-to-text input support |
| 🌐 **i18n** | Full English and Chinese language support |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.0 or higher
- Microsoft Word 2016+ (Windows/Mac) or Word Online
- An LLM API Key (OpenAI, Azure, Alibaba Cloud Qwen, etc.)

### Option 1: GitHub Pages (Easiest - No Local Setup)

Use the pre-built version hosted on GitHub Pages:

1. **Download manifest file**: [Click here to download word-copilot.xml](https://alphabetc1.github.io/word-copilot/word-copilot.xml) (right-click → Save As)
2. Install into Word (choose one):
   - **A. Upload (recommended)**: Word → **Insert → Add-ins → My Add-ins → Upload My Add-in** → select `word-copilot.xml`
   - **B. Sideload (when Upload is disabled by policy)**
     - **macOS**: copy to:
       - Folder: `~/Library/Containers/com.microsoft.Word/Data/Documents/wef/`
       - File: `word-copilot.xml`

```bash
npm run sideload:mac -- word-copilot.xml
```

     - **Windows** (Shared Folder Catalog): the script copies to:
       - `%USERPROFILE%\\Documents\\OfficeAddinManifests\\word-copilot.xml`
       - then follow Trust Center → Trusted Add-in Catalogs → SHARED FOLDER steps printed by the script

```bash
npm run sideload:windows -- word-copilot.xml
```

4. Configure your API key in the add-in settings

> **If you forked this repo**, use your own GitHub Pages URL: `https://<your-username>.github.io/word-copilot/word-copilot.xml`

### Option 2: Local Install (Mac)

```bash
# Check Node.js installation
node -v && npm -v

# 1️⃣ Clone and install dependencies
git clone https://github.com/your-repo/word-copilot.git
cd word-copilot
npm install

# 2️⃣ Sideload to Word (default uses production manifest: word-copilot.xml)
npm run sideload:mac

# 3️⃣ Restart Word completely (Cmd+Q), then reopen
# 4️⃣ Ribbon: look for the "Word Copilot" tab
```

### Option 3: Local Install (Windows)

```bash
# 1️⃣ Clone and install dependencies
git clone https://github.com/your-repo/word-copilot.git
cd word-copilot
npm install

# 2️⃣ Sideload to Word (default uses production manifest: word-copilot.xml)
npm run sideload:windows
```

### Local Debugging (Optional)

Most of the time you only need `word-copilot.xml` (hosted on GitHub Pages). If you want to debug local code, use `word-copilot-local.xml`:

```bash
npm run dev:certs
npm run sideload:mac -- word-copilot-local.xml
# Windows:
# npm run sideload:windows -- word-copilot-local.xml
npm run dev
```

### Option 4: Word Online

```bash
npm install && npm run dev
# In Word Online: Insert → Add-ins → Upload My Add-in → Select word-copilot-local.xml (local) or word-copilot.xml (hosted)
```

## ⚙️ API Configuration

Configure your LLM API on first use:

1. Open the Word Copilot sidebar
2. Click the **"Settings"** tab
3. Fill in the following:

| Field | Description | Example |
|-------|-------------|---------|
| **Base URL** | API service URL | `https://api.openai.com` |
| **API Key** | Your secret key | `sk-xxxx...` |
| **Model** | Select or enter custom | `gpt-4o` / `qwen-plus` |

4. Click **"Save Settings"** - connection will be tested automatically

### Supported API Services

- ✅ OpenAI (Official)
- ✅ Azure OpenAI
- ✅ Alibaba Cloud Qwen (DashScope)
- ✅ Any OpenAI-compatible API

## 📖 Usage Guide

### Method 1: Sidebar Chat

The most flexible option for complex multi-turn conversations:

1. **Select text**: Highlight content in your document
2. **Enter instruction**: Type your request in the sidebar
3. **AI processes**: AI analyzes and modifies the document

**Example prompts**:
- `Polish this paragraph for academic writing`
- `Translate to Chinese, keeping technical terms`
- `Check grammar errors in this section`
- `Summarize this in under 100 words`
- `Add explanatory notes to this argument`

### Method 2: Right-Click Menu

Select text and right-click, choose the **Copilot** menu:

| Command | Function |
|---------|----------|
| 🎨 **Polish Selection** | Improve writing style and flow |
| 🌐 **Translate Selection** | Translate between languages |
| 💡 **Add Comments** | AI adds improvement suggestions |
| 📊 **Structure Check** | Analyze document structure |

### Method 3: Plan Mode (Long Document Writing)

For complex documents like proposals or reports:

1. Click **"Plan"** tab in sidebar
2. Answer clarifying questions (project name, objectives, etc.)
3. Review and edit the generated outline
4. Generate content section by section
5. Modify prompts and regenerate as needed

### Method 4: Structure Check

Professional feature for academic writing:

- 📑 Heading hierarchy compliance (H1 → H2 → H3)
- 📋 Required sections present (Abstract, Introduction, Conclusion)
- 📝 Paragraph length and logical flow
- 📚 Citation completeness

## 🎯 Writing Presets

Select different scenarios in Settings for automatic rule application:

| Scenario | Use Case | Features |
|----------|----------|----------|
| **Academic Paper (SCI)** | Journal submissions, theses | IMRAD structure, passive voice |
| **Clinical Research** | Case reports, trials | CONSORT/STROBE standards |
| **Project Proposal** | Grant applications | Innovation, feasibility focus |
| **Official Notice** | Government documents | Formal style, standard format |
| **Custom** | Flexible configuration | Define your own rules |

## 🛠️ Development Commands

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run lint          # Check code style
npm run lint:fix      # Auto-fix code issues
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run validate      # Validate word-copilot-local.xml
npm run validate:prod # Validate word-copilot.xml
```

## 📁 Project Structure

```
word-copilot/
├── 📄 word-copilot.xml          # Production manifest (GitHub Pages / default)
├── 📄 word-copilot-local.xml    # Local debugging manifest (localhost:3000)
├── 📄 package.json              # Dependencies and scripts
├── 📄 jest.config.js            # Test configuration
├── 📁 .github/workflows/        # GitHub Actions CI/CD
├── 📁 src/
│   ├── 📁 taskpane/             # Sidebar UI
│   │   ├── App.tsx              # Main app component
│   │   ├── styles.css           # Styles
│   │   └── components/
│   │       ├── ChatPanel.tsx    # Chat panel
│   │       ├── PlanPanel.tsx    # Plan mode panel
│   │       ├── SettingsPanel.tsx # Settings panel
│   │       ├── SessionList.tsx  # Session list
│   │       └── MessageItem.tsx  # Message component
│   ├── 📁 commands/             # Right-click commands
│   ├── 📁 helpers/              # Core modules
│   │   ├── llmClient.ts         # LLM API client
│   │   ├── wordBridge.ts        # Word document operations
│   │   ├── sessionManager.ts    # Session management
│   │   ├── i18n.ts              # Internationalization
│   │   ├── voiceInput.ts        # Voice input (experimental)
│   │   └── ...
│   ├── 📁 types/                # TypeScript definitions
│   └── 📁 __tests__/            # Unit tests
└── 📁 assets/                   # Icons and resources
```

## ❓ FAQ

<details>
<summary><b>"My Add-ins" menu is grayed out on Mac?</b></summary>

1. Make sure you ran `npm run dev:certs` to install certificates
2. Make sure you ran `npm run sideload:mac`
3. Completely quit Word (Cmd+Q), then reopen
4. Development server must be running (`npm run dev`)
</details>

<details>
<summary><b>API connection failed?</b></summary>

1. Check Base URL format (no trailing `/`)
2. Verify API Key is valid
3. Check network access to API service
4. Check browser console for error messages
</details>

<details>
<summary><b>How to switch API providers?</b></summary>

Change Base URL in settings:
- OpenAI: `https://api.openai.com`
- Azure: `https://your-resource.openai.azure.com`
- Alibaba: `https://dashscope.aliyuncs.com/compatible-mode/v1`
</details>

<details>
<summary><b>Voice input not working?</b></summary>

Voice input is an experimental feature. Requirements:
- Modern browser with Web Speech API support
- Microphone permissions granted
- May not work in all Office environments
</details>

## 🤝 Contributing

Issues and Pull Requests are welcome!

Before submitting code:
1. Run `npm run lint:fix` to fix code style
2. Run `npm run test` to pass all tests
3. Follow commit message conventions

## 📄 License

This project is licensed under [Apache License 2.0](./LICENSE).

---

<p align="center">
  If this project helps you, please give it a ⭐ Star!
</p>
