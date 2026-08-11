# 🌟 ContextEng — 智能情境英语学习系统 (Vision & Music IELTS Context App)

> **"Thinking about the things around you in English helps you a lot."**  
> 一款融合 **AR 相机实物识别**、**英文歌曲/歌词沉浸教学**、**“不背单词”级高质感词卡** 与 **雅思真题 (听/读/写) 语境匹配** 的全场景英语学习应用。

---

## 🎯 核心功能愿景 (Core Features)

### 1. 📷 AR 相机实物识别 (Camera Real-Time AR Labeling)
* 打开摄像头识别周围物品（如 `desk`, `coffee cup`, `monstera plant`）。
* 在画面物品上方悬浮呈现 **Glassmorphism (玻璃拟态)** 极美英文标签（包含单词、音标、中文释义、难度分级）。
* 点击标签直接唤起单词详情并一键 ⭐ 收藏。

### 2. 🎵 音乐歌词沉浸教学 (Music & Lyric Learning Engine)
* 支持英文歌曲播放与 **LRC 逐字/逐句平滑高亮跟随**。
* 歌词交互查词：点击歌词中任意单词立即跳转词条卡片。
* 自动记录歌曲原声例句，在歌声中理解词汇情境。

### 3. 📚 多维词汇分类与时间轴本 (Multi-Dimensional Word Notebook)
* **时间维度**：根据添加/收藏时间，自动分类为 `Today`（今天）、`Yesterday`（昨天）、`Earlier`（更早）。
* **类别维度**：自动语义打标，如 `Animal`（动物）、`Plant`（植物）、`Technology`（科技）、`Daily Life`（日常生活）、`Emotions`（情感）。
* **状态持久化**：支持星号 ⭐ 收藏、已掌握打卡、离线缓存。

### 4. 🎴 "不背单词" 风格沉浸式详情卡片 (Word Detail Card)
* 极具仪式感与美感的设计：超大单词排版、美/英双音标、真人清晰发音。
* 双语权威释义、经典歌曲例句、词根词缀衍生与考频标签。

### 5. 🎯 雅思真题 (听/读/写) 语境匹配引擎 (IELTS Context Engine - Key Feature)
* 提取用户在相机、歌曲或词汇本中收录的单词集。
* **听力 (Listening)**：匹配包含目标词的雅思 Section 1/3 真实对话场景。
* **阅读 (Reading)**：匹配包含目标词的 Academic 学术阅读段落。
* **写作 (Writing)**：匹配包含目标词的 Task 2 高分表达与替换句型。

---

## 🛣️ 4 阶段演进路线图 (Phased Roadmap)

| 阶段 | 模块名称 | 核心交付物 | 状态 |
| :--- | :--- | :--- | :--- |
| **Phase 1** | 核心基建与词卡本 | 暗黑玻璃拟态 UI 框架 + "不背单词" 详情卡片 + 时间轴/分类词汇本 | 🚧 规划对齐中 |
| **Phase 2** | 音乐歌词沉浸教学 | Web Audio 播放器 + LRC 逐字高亮 + 歌词查词 | ⏳ 待启动 |
| **Phase 3** | 雅思真题语境匹配 | 听力对话 / 阅读段落 / 写作高分句型智能匹配引擎 | ⏳ 待启动 |
| **Phase 4** | AR 相机实物识别 | WebRTC 视频流 + 物体检测 + 悬浮 AR 标签锚定 | ⏳ 待启动 |

---

## 🛠️ 技术选型 (Tech Stack)

* **Core Framework**: React 18 + Vite
* **Styling & Theme**: Vanilla CSS (Modern Design Tokens, Glassmorphism, CSS 3D Overlay)
* **State & Storage**: IndexedDB (Dexie.js) + React State
* **Audio & Lyrics**: Native Web Audio API + Custom LRC Parser
* **Camera & AI**: WebRTC + Edge Detection / Vision VLM API

---

## 📁 目录结构预设 (Directory Layout)

```
d:\Git\
├── README.md                   # 本项目级说明文档
├── package.json                # 项目依赖配置
├── vite.config.js              # Vite 构建配置
├── index.html                  # HTML 入口
└── src/
    ├── styles/                 # 核心 Design System & CSS 变量
    ├── data/                   # 词库、歌词、雅思真题语料
    ├── services/               # 存储服务、LRC解析器、语音服务
    └── components/             # 组件库 (Navbar, WordCard, MusicPlayer, IELTS, ARCamera)
```

---
*Created & Maintained with Git version control.*
