<p align="center">
  <img src="assets/logo.png" alt="Word Copilot Logo" width="180">
</p>
<h1 align="center">Word Copilot</h1>

<p align="center">
  <strong>Use AI directly inside Microsoft Word and keep every revision reviewable</strong><br>
  Built with Office.js for academic papers, clinical writing, grant proposals, and other long-form documents
</p>

<p align="center">
  <a href="https://alphabetc1.github.io/word-copilot/en.html">Landing Page</a> ·
  <a href="https://alphabetc1.github.io/word-copilot/word-copilot.xml">Download Manifest</a> ·
  <a href="./CHANGELOG.md">Changelog</a> ·
  <b>English</b> · <a href="./README.md">简体中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Word%202016%2B-blue" alt="Platform">
  <img src="https://img.shields.io/badge/language-TypeScript-3178c6" alt="TypeScript">
  <img src="https://img.shields.io/badge/license-Apache%202.0-green" alt="License">
</p>

---

## Why This Repo Converts Better

- **It works inside Word**: no more copying text between your document and a separate AI chat app.
- **Edits stay reviewable**: Track Changes lets teams accept or reject AI revisions in a familiar workflow.
- **It supports long documents**: plan mode and structure checks are stronger than plain chat-based editing.
- **Trial friction is low**: users bring their own API key instead of creating another SaaS account.

## Understand It In 30 Seconds

1. Download [word-copilot.xml](https://alphabetc1.github.io/word-copilot/word-copilot.xml)
2. In Word, open **Insert → Add-ins → My Add-ins → Upload My Add-in**
3. Enter `Base URL`, `API Key`, and `Model`
4. Start with the sidebar or the right-click menu on selected text

## Best First Audiences

| Audience | Main Job | Why They Install |
|----------|----------|------------------|
| Academic writing | polish, translate, structure review, supervisor feedback | They need reviewable revisions without leaving Word |
| Clinical and medical docs | precise wording, comments, section completeness | They value rigor and formal review workflows |
| Grant proposals and office docs | long-form planning, consistent tone, iterative drafts | They want faster revision cycles in the same document |

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **Track Changes** | Document edits use Word's Track Changes, allowing accept/reject |
| 📝 **Writing Presets** | Pre-configured templates for academic papers, clinical reports, proposals, etc. |
| 💬 **Smart Chat** | Multi-turn conversations with AI in Word's sidebar |
| ⚡ **Quick Commands** | Right-click menu for instant polish, translate, and annotate |
| 📊 **Structure Check** | AI analyzes document structure, heading hierarchy, citations |
| 💾 **Session Management** | Multiple independent conversations with local history |
| 🌐 **i18n** | Full English and Chinese language support |

## 🎬 Demo Assets To Prioritize

If you plan to promote the project, record these three short clips first:

1. **Select text → right-click polish → Track Changes appears in Word**
2. **Plan mode → answer a few questions → generate an outline**
3. **Structure check → highlight missing sections and hierarchy issues**

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
   - **B. One-click sideload scripts (when Upload is disabled by policy)**
     - **macOS**
       - Download: [install-sideload-mac.sh](scripts/install-sideload-mac.sh)
       - Run: `bash ./scripts/install-sideload-mac.sh`
       - The script first uses a local `word-copilot.xml` from the repo/current directory; if none is found, it downloads one and copies it to `~/Library/Containers/com.microsoft.Word/Data/Documents/wef/`
     - **Windows**
       - Download: [install-sideload-windows.cmd](scripts/install-sideload-windows.cmd) / [install-sideload-windows.ps1](scripts/install-sideload-windows.ps1)
       - Run: `.\scripts\install-sideload-windows.cmd`
       - The script first uses a local `word-copilot.xml` from the repo/current directory; if none is found, it downloads one, copies it to `%USERPROFILE%\Documents\OfficeAddinManifests\`, shares the folder, and registers a Trusted Catalog
       - **Note**: due to Microsoft's shared-folder flow, the first load on Windows still requires `Insert -> Add-ins -> My Add-ins -> SHARED FOLDER -> Word Copilot -> Add`
     - **Manual fallback paths**
       - macOS: `~/Library/Containers/com.microsoft.Word/Data/Documents/wef/`
       - Windows: `%USERPROFILE%\Documents\OfficeAddinManifests\word-copilot.xml`

3. Configure your API key in the add-in settings

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

If you only want the GitHub Pages hosted manifest, you can also run the installer scripts directly:

```bash
curl -fsSL https://alphabetc1.github.io/word-copilot/scripts/install-sideload-mac.sh | bash
```

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Join-Path $env:TEMP 'word-copilot-install.ps1'; Invoke-WebRequest 'https://alphabetc1.github.io/word-copilot/scripts/install-sideload-windows.ps1' -UseBasicParsing -OutFile $p; & $p"
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
