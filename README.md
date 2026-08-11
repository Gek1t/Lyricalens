# 🎵📷 Vibelex — 智能情境英语学习系统 (by Yuzaiyuan)

> **"In the Vibe of Life and Songs, Master the IELTS."**  
> 一款由 Yuzaiyuan 构想的 Vibe 时代沉浸式英语学习应用，融合 **AR 相机实物识别 (Lens)**、**英文歌曲/歌词沉浸教学 (Lyric)**、**高质感词卡** 与 **雅思真题 (听/读/写) 语境自动组卷通知**。

---

## 🚨 AI 协作与工作流三铁律 (Collaboration Rules)

1. **绝对禁止抢跑 (Strictly No Premature Jumping)**：必须严格配合用户的节奏。用户没有明确指令开展下一步前，严禁擅自跳步。
2. **多用 Plan 模式主动向用户询问与确认 (Mandatory Plan Consultation)**：在开展任何新阶段或修改前，必须先制定 Plan，主动向用户询问细节并充分确认意图。
3. **技术问题“先通俗说明，再由用户拍板” (Plain Explanation Before Consultation)**：涉及技术选型，必须先用通俗易懂的语言把原理、优缺点解释清楚，再由用户审查拍板。

---

## 🎯 核心功能愿景 (Core Features)

### 1. 📷 AR 相机实物全景识别 (Camera Real-Time AR Lens)
* 打开摄像头识别周围物品（如 `desk`, `coffee cup`, `monstera plant`）。
* 在画面物品上方悬浮呈现 **Glassmorphism (玻璃拟态)** 极美英文标签。
* 点击标签直接唤起单词详情并一键 ⭐ 静默收录。

### 2. 🎵 歌单与歌词同步教学 (Music & Lyric Learning Engine)
* 支持同步个人歌单，集成 **LRC 逐字/逐句平滑高亮跟随**。
* 歌词交互查词：点击歌词中任意单词即刻查看卡片，优先高亮歌词原句例句。

### 3. 📚 多维词汇分类与时间轴本 (Multi-Dimensional Word Notebook)
* **时间维度**：`Today`（今天）、`Yesterday`（昨天）、`Earlier`（更早）。
* **类别维度**：自动语义打标，如 `Animal`、`Plant`、`Technology`、`Daily Life` 等。

### 4. 🔔 词汇积累阈值与自动组卷通知 (Smart Threshold & IELTS Notification)
* 用户自定义积累数量或时间周期，达成条件时自动发送通知：“*您的专属雅思真题试卷已生成！*”。
* **雅思全套真题模式 (Full Test Mode)**：将收录的单词合成/匹配为整篇**雅思阅读文章 (Full Passage)** 或 **听力 Section 3**，附带 T/F/NG 判定题、Summary 填空题与 Matching 匹配题。

### 5. 📱💻 全端 100% 双端覆盖 (Full Platform Parity)
* 手机端 Mobile PWA 主打便携扫物与听歌，包含移动端雅思口袋刷题卡片。
* PC 端 Desktop Workbench 提供大屏深度阅读与写作工作台。

---

## 🛠️ 用户拍板的技术选型 (Approved Tech Stack)

* **Core Framework**: React 18 + Vite (工业标准基建)
* **Storage & DB**: IndexedDB (Dexie.js) (大容量离线存储)
* **Styling & Theme**: Vanilla CSS (CSS 变量 + Glassmorphism 0 依赖精细打磨)

---
*Created & Maintained with Git version control.*
