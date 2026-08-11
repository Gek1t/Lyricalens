# 📑 ContextEng — 原始需求与演进总大纲 (Master Project Outline)

> 本文档按您原始 Prompt 的经典 **“三段式结构”**（3个分块基础功能 ➔ 1个通用贯穿功能 ➔ 1个核心灵魂功能）进行了严格整理，作为项目的最高参照大纲。

---

## 🎯 一、 原始 Prompt 结构与最新演进总览 (3-Tier Structure)

### 📌 第一部分：3 个分块基础功能 (Divisional Functions)

#### 1. 📷 相机实物 AR 标签 (Camera AR Labeling)
* **原始需求**：打开摄像头识别周围物品，并在物品上方呈现美观的英文标签。
* **最新确立演进**：
  * **全景 Glassmorphism AR 标签**：视野内检测到的所有物体上方同时悬浮高透光玻璃拟态标签，呈现单词、音标、释义与收藏入口。
  * **全端适配**：移动端 (Mobile PWA) 充分发挥摄像头的便携性。

#### 2. 🎵 音乐与歌词联想教学 (Music & Lyric Connection)
* **原始需求**：连接音乐软件与 App，通过歌词进行词汇教学。
* **最新确立演进**：
  * **歌单与歌词同步引擎**：支持同步网易云/Spotify/本地歌单，自动匹配 `.lrc` 毫秒级逐字高亮歌词。
  * **示范曲目**：预置经典英文金曲（如 *Shape of You*）附带完整逐字 LRC 歌词。

#### 3. 📚 时间与类别词汇集合 (Word Set Classified by Time & Category)
* **原始需求**：包含一个单词集合，可按时间（如 Today, Yesterday）或类别（如 Animal, Plant）分类。
* **最新确立演进**：
  * **时间轴维度**：`Today`（今天）、`Yesterday`（昨天）、`Earlier`（更早）。
  * **多维场景与 AI 打标**：预置 `Animal`, `Plant`, `Technology`, `Daily Life` 场景，支持预留 AI 接口进行深度语义打标。

---

### 📌 第二部分：1 个通用贯穿功能 (General Function)

#### 4. 🎴 单词点击 ➔ “不背单词”参考沉浸卡片 ➔ ⭐ 静默收录归类
* **原始需求**：在上述任意界面点击单词，跳转至“不背单词”参考风格的详情页；点击 ⭐ 星号按钮将其添加至词汇集，系统自动按时间与类别分类。
* **最新确立演进**：
  * **0.1 秒静默沉浸入库**：点击 ⭐ 仅需 0.1s 静默完成收录与自动打标，无阻碍弹窗，绝对不打断学习流。
  * **例句动态优先级链**：
    $$\text{例句优先级} = \text{用户歌单歌曲原词例句} \xrightarrow{\text{未命中}} \text{相机/生活原场景例句} \xrightarrow{\text{未命中}} \text{雅思真题学术例句}$$
    优先高亮用户歌单歌词里的原句！

---

### 📌 第三部分：1 个核心灵魂功能 (Key Feature)

#### 5. 🎯 雅思真题 (听/读/写) 自动匹配与组卷通知 (IELTS Auto Full Test & Notification)
* **原始需求**：基于已收录的单词，自动在雅思真题（听力、阅读、写作）中匹配文本，不要求单篇文章包含所有词，而是分布在听力/写作/阅读各部分。
* **最新确立演进**：
  * **自动阈值通知**：用户自定义积累数量（如满 15 词）或时间周期（如每日 20:00）触发系统通知：“*您的专属雅思真题试卷已生成！*”。
  * **完整套题模式 (用户首选)**：将收录的词汇合成/匹配为**一整篇标准的雅思阅读文章 (Full Passage)** 或 **听力 Section 3 对话**，并附带真正雅思考题 (T/F/NG 判定、Summary 填空、Matching 匹配)。支持专项分块模式切分。
  * **📱💻 双端 100% 全功能**：手机端呈现口袋刷题卡片，PC 端呈现大屏双栏对比阅读与写作工作台。

---

## 🚨 二、 AI 协作与工作流三铁律 (AI Collaboration Rules)

1. **绝对禁止抢跑 (Strictly No Premature Rushing)**：必须 100% 配合用户的节奏，用户未指令下一步前，严禁擅自跳步。
2. **多用 Plan 模式主动询问与确认 (Mandatory Plan Consultation)**：开展任何新阶段前，必须先制定 Plan 充分询问确认。
3. **技术问题“先通俗说明，再由用户拍板” (Plain Explanation Before Consultation)**：技术选型必须先用通俗语言把原理与优缺点解释清楚，完全由用户拍板。

---

## 🛠️ 三、 用户拍板的技术选型 (Approved Tech Stack)

* **前端核心框架**：`React 18 / 19 + Vite`（npm 周下载 1.6 亿+，82.3K Stars，工业级标准）
* **离线数据库**：`IndexedDB (Dexie.js)`（npm 周下载 150 万+，14.5K Stars，10年成熟标准）
* **样式与设计系统**：`Vanilla CSS (CSS 变量)`（0 依赖，100% 自由度打磨 Glassmorphism）

---

## 📅 四、 4 阶段演进路线图 (Phased Roadmap)

* **Phase 1**：地基与核心架构（数据模型 + 本地存储 + 自动通知/阈值设置框架 + 全端 UI 壳 + “不背单词”参考卡片）
* **Phase 2**：歌词同步与静默收录（歌单/LRC 歌词同步引擎 + 歌词逐字高亮 + 一键 ⭐ 静默收录）
* **Phase 3**：雅思自动组卷与通知引擎（单词积累阈值监听 + 雅思全套阅读/听力/写作试卷生成与练习）
* **Phase 4**：AR 相机与视觉标签（WebRTC 相机物块检测 + 全景 Glassmorphism 悬浮 AR 标签）

---

## 📂 五、 项目参考文档索引 (Documentation Index)

* 📖 [`PROJECT_OUTLINE.md`](file:///d:/Git/PROJECT_OUTLINE.md)：最高参照大纲（即本文档，严守三段式结构）
* 📖 [`PROJECT_SPEC.md`](file:///d:/Git/PROJECT_SPEC.md)：详细需求规格说明书
* 📖 [`DATA_SCHEMA.md`](file:///d:/Git/DATA_SCHEMA.md)：数据模型与 TypeScript 接口定义
* 📖 [`SESSION_HANDOFF.md`](file:///d:/Git/SESSION_HANDOFF.md)：防降智/跨 Session 上下文记忆档案
* 📖 [`README.md`](file:///d:/Git/README.md)：项目级 README 文档
