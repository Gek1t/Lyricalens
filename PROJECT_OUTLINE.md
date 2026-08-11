# 📑 ContextEng — 原始需求与最新演进总大纲 (Master Project Outline)

> 本文档根据您的原始 Prompt 及我们共同碰撞出的最新成果进行了精细整理，作为项目的**最高参照大纲**。

---

## 🎯 1. 原始需求映射与最新演进对比 (Requirement Evolution)

| 原始需求点 (Original Prompt) | 经过深入头脑风暴后的最新确立方案 | 当前落地状态 |
| :--- | :--- | :--- |
| **1. 📷 相机实物 AR 标签**<br/>*"Thinking about the things around you in English... open camera, good-looking label"* | **全景 Glassmorphism AR 标签**：打开摄像头，视野内识别到的所有物体上方同时悬浮高透光 Glassmorphism 极美标签，展现英文单词、音标与收藏入口。 | 规范已写入 `PROJECT_SPEC.md`<br/>(将在 Phase 4 落地) |
| **2. 🎵 歌词联想教学**<br/>*"Using songs to learn vocabulary... connect music software and my app with lyrics"* | **歌单与歌词同步引擎**：支持同步网易云/Spotify/本地歌单，自动匹配 `.lrc` 毫秒级逐字高亮歌词。点击歌词任意单词看卡片，优先呈现歌词原句例句！ | 规范与 Schema 已写入<br/>(将在 Phase 2 落地) |
| **3. 📚 时间/分类词汇本**<br/>*"classified by time (today, yesterday) or categories (animal, plant)"* | **时间轴 + AI 多场景打标**：自动切分 `Today`/`Yesterday`/`Earlier` 时间轴；预置 `Animal`, `Plant`, `Technology`, `Daily Life` 等场景，支持 AI 动态语义打标。 | 规范与数据模型已定义<br/>(将在 Phase 1 落地) |
| **4. 🎴 “不背单词”参考沉浸卡片**<br/>*"tick one word -> detailed surface (like 不背单词) -> star icon to add"* | **静默沉浸入库 + 动态例句链**：点击 ⭐ 仅需 0.1s 静默入库，无打断弹窗；例句遵循：$\text{用户歌单歌词例句} \to \text{原场景例句} \to \text{雅思学术例句}$ 的优先级。 | 规范与数据模型已定义<br/>(将在 Phase 1 落地) |
| **5. 🎯 雅思真题自动组卷 (Key Feature)**<br/>*"automatically find text from IELTS papers based on words added (listening, reading, writing)"* | **自动阈值通知 + 完整套题模式**：用户自定义积累数量/时间阈值，达到条件后自动通知；自动生成包含收录词的**一整篇雅思阅读文章 (Full Passage)** 或 **听力 Section 3**，带真题考型！ | 规范已写入 `PROJECT_SPEC.md`<br/>(将在 Phase 3 落地) |
| **6. 📱💻 全端 100% 全功能**<br/>*(后续深入探讨确立)* | **双端全功能覆盖 (Full Parity)**：手机端 PWA 主打便携扫物与听歌，保留口袋雅思刷题卡片；PC 端大屏侧重雅思长文对比阅读与大屏写作。 | 规范已写入 `PROJECT_SPEC.md` |

---

## 🚨 2. AI 协作与工作流三铁律 (AI Rules)

1. **绝对禁止抢跑 (Strictly No Premature Rushing)**：必须 100% 配合用户的节奏，用户未指令下一步前，严禁擅自跳步。
2. **多用 Plan 模式主动向用户询问与确认 (Mandatory Plan Consultation)**：开展任何新阶段前，必须先制定 Plan 充分询问确认。
3. **技术问题“先通俗说明，再由用户拍板” (Plain Explanation Before Consultation)**：技术选型必须先用通俗语言把原理与优缺点解释清楚，绝不擅自做决定，完全由用户拍板。

---

## 🛠️ 3. 用户亲自拍板的技术选型 (Approved Tech Stack)

* **前端核心框架**：`React 18 / 19 + Vite`（npm 周下载量 1.6 亿+，82.3K Stars，全球标准基建）
* **离线数据库**：`IndexedDB (Dexie.js)`（npm 周下载量 150 万+，14.5K Stars，10 年成熟工业标准，高速离线存词库与真题）
* **样式与设计系统**：`Vanilla CSS (CSS 变量)`（0 依赖，100% 自由度微调 Glassmorphism 玻璃拟态与 3D 浮动动画）

---

## 📅 4. 4 阶段演进路线图 (Phased Roadmap)

* **Phase 1（地基与核心架构）**：数据模型 + 本地存储 + 自动通知/阈值设置框架 + 全端 UI 壳 + “不背单词”风格卡片。
* **Phase 2（歌词同步与静默收录）**：歌单/LRC 歌词同步引擎 + 歌词逐字高亮 + 一键 ⭐ 静默收录。
* **Phase 3（雅思自动组卷与通知引擎）**：单词积累阈值监听 + 雅思全套阅读/听力/写作试卷生成与练习。
* **Phase 4（AR 相机与视觉标签）**：WebRTC 相机物块检测 + 全景 Glassmorphism 悬浮 AR 标签。

---

## 📂 5. 项目参考文件索引 (Documentation Index)

* 📖 [`PROJECT_SPEC.md`](file:///d:/Git/PROJECT_SPEC.md)：详细需求规格说明书
* 📖 [`DATA_SCHEMA.md`](file:///d:/Git/DATA_SCHEMA.md)：数据模型与 TypeScript 接口定义
* 📖 [`SESSION_HANDOFF.md`](file:///d:/Git/SESSION_HANDOFF.md)：防降智/跨 Session 上下文记忆档案
* 📖 [`README.md`](file:///d:/Git/README.md)：项目级 README 文档
