# DSH Let Them Cook (DSH 开整天团)

<p align="center">
  <b>English</b> | <a href="./Docs/README.md">简体中文</a>
</p>

<p align="center">
  <b>Toss in the work, let them cook.</b><br/>
  <i>把活儿丢进群，放手让他们开整！</i><br/>
  A workspace-scoped multi-Agent autonomous orchestration & delivery plugin built natively for <b>DeepSeek Harness (DSH)</b>.
</p>

---

## 🌟 Overview

`@dsh-external/dsh-group-chat` is a Cordis-powered extension designed for DeepSeek Harness (DSH). It preserves the official DSH chat tab while introducing a dedicated, collaborative **Agent Chat** workspace. 

In this space, users describe complex project goals in natural language. The system drafts a bespoke fleet of specialized AI roles and a tailored multi-stage workflow. Once approved by the user, the **Master Agent (`commander`)** orchestrates specialized **SubAgents** through research, backend engineering, frontend polish, adversarial QA testing, and technical documentation until the project loop is closed.

---

## ✨ Key Highlights

### 1. 🛡️ Native DSH UI Seams (Zero Hijacking)
- **Central Workspace Tab (`conversation.view`)**: Safely registered with a stable `prepare()` adapter; official chat behavior and conversation tree remain 100% intact.
- **Companion HUD Cockpit (`shell.overlay`)**: Resizable, dockable, or floating task dashboard displaying real-time execution states, stage gates, consensus scratchpad, and token ledgers without squeezing DSH AppFrame grids.

### 2. 🧰 Native-Feel Tool Call Rows & Progressive Disclosure
- **Native Tool Row Adapter**: Replaces unformatted dumps with official-grade disclosure rows for `read`, `edit`, `write`, `grep`, `glob`, `bash`, and web search.
- **Target Path Extraction**: Automatically extracts and displays target files (e.g. `src/index.ts`), search regex patterns, or bash commands as clickable, monospace badges.
- **Live State & Micro-interactions**: Real-time pulse animation during execution, microsecond duration tags upon completion, and two-stage **Input (Args)** / **Output (Result)** collapsible drawers.

### 3. 🌐 100% Full-Stack Bilingual Support (`zh-CN` / `en-US`)
- **Dynamic Localization**: Automatically detects browser locale with manual one-click switching in the HUD header (`中 / EN`).
- **Bilingual Roster & Mentions**: All personas (e.g., `Steve Jobs` / `史蒂夫·乔布斯`, `Jensen Huang` / `黄仁勋`, `Meme Director` / `离谱总导演`) support bilingual display, localized system prompts, and cross-language `@mentions` (both `@jobs` and `@乔布斯` resolve accurately).
- **Localized Reports & Summaries**: Markdown export tools and meeting digests respect active locale without hardcoded fallback leaks.

### 4. 🎭 Built-in Persona Themes
- **Tech Legends (`legends`)**: Steve Jobs (Commander), Elon Musk (Researcher), Jensen Huang (Backend), Lei Jun (Frontend), Bill Gates (QA), Allen Zhang (Writer).
- **Meme Squad (`meme_comedy`)**: Playful, human-readable, and delivery-focused persona fleet.
- **Modern Elite (`modern`)**: High-rigor engineering and architecture specialists.
- **Three Kingdoms (`three_kingdoms`)**: Zhuge Liang, Sima Hui, Guan Yu, Zhou Yu, Wei Yan, Chen Lin.
- **Genshin / Teyvat (`genshin`)**: Jean, Lisa, Zhongli, Nilou, Hu Tao, Paimon.

---

## 🏗️ Architecture at a Glance

```text
DeepSeek Harness Web GUI (http://127.0.0.1:3080)
 ├── Official "Dialog" View (Untouched)
 └── Group Chat Workspace Extension
      ├── Central View: Agent Chat (src/client/GroupChatPanel.tsx)
      │    ├── Master-led Conversation Stream & Live Tool Rows
      │    ├── Auto-Collapsible Long Messages (Native Gradient Mask)
      │    └── Bottom Sticky Composer with Searchable @Mention Picker
      └── Right Overlay: Group Chat HUD (src/client/GroupChatSideDock.tsx)
           ├── Execution Director & Loop Quality Monitor
           ├── Captain Plan (Task Protocol & Verification Gates)
           ├── Roster Management & One-line Persona / Workflow Generator
           └── Shared Consensus Scratchpad & Real-time Token Ledger
```

---

## 🚀 Quick Start

### 1. Build and Bundle
```bash
# Type check TypeScript definitions
npm run typecheck

# Build host (tsc) and client bundle (tsdown)
npm run build:all
```

### 2. Live Injection & Hot Reload
If using `dsh-super-injector`:
```bash
# Inject or update the package into DSH web profile
dev_install_package --dir "/path/to/DSH-Let-Them-Cook"

# Perform zero-downtime hot reload
dev_reload_package --packageName "dsh-group-chat"
```

### 3. Verify in Browser
Open `http://127.0.0.1:3080/` and refresh the page (`F5` or `Cmd + R`):
1. The **Agent 群聊 (Agent Chat)** tab appears in the conversation tabs.
2. Click the tab to start a new mission: drop one sentence explaining your goal.
3. The Master Agent will propose a team roster and workflow draft for your confirmation.

---

## 🧪 Test Matrix & Quality Verification

```bash
# Run the complete regression test matrix
npm run test:matrix

# Run targeted unit & integration suites
npm run test:bilingual-role-coverage   # Verify 100% bilingual role & mention coverage
npm run test:native-tool-row-adapter   # Verify native tool disclosure and execution rows
npm run test:collapsible-message-body  # Verify message progressive disclosure
npm run test:tech-legends-theme        # Verify Tech Legends persona bindings
```

---

## 📂 Project Structure

```text
DSH-Let-Them-Cook/
├── README.md                      # English documentation (with Chinese switcher)
├── AGENTS.md                      # Cross-agent collaboration contracts & coding rules
├── Docs/                          # Comprehensive technical design & phase docs
│   ├── README.md                  # Detailed Chinese documentation index
│   ├── technical-architecture.md  # Deep dive into Cordis hooks and runtime engine
│   ├── dispatch-engine.md         # Master Agent & SubAgent dispatch arbiter
│   └── ...                        # Historical P-series test reports & specs
├── src/
│   ├── index.ts                   # Host entry & Cordis service definitions
│   ├── types.ts                   # Core TypeScript contracts & data schemas
│   ├── engine/                    # Dispatcher, arbiter, projection & theme catalogs
│   ├── tools/                     # Agent-callable coordination & workflow tools
│   └── client/                    # React UI components, styles & i18n helpers
├── package.json
└── tsdown.config.ts
```

---

## 📄 License

Distributed under the [MIT License](LICENSE).
