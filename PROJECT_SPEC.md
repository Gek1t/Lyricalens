# ContextEng — 详细项目需求规格说明书 (Project Specification)

> 本文档为 ContextEng 系统的**单源真相 (Single Source of Truth)** 规格说明书。严格遵循“3个分块基础功能 ➔ 1个通用贯穿功能 ➔ 1个核心灵魂功能”三段式架构，记录全局规格、AI 协作铁律与四阶段演进路线。

---

## 1. 📌 第一部分：3 个分块基础功能 (Divisional Functions)

### 1.1 📷 相机实物 AR 标签 (Camera AR Labeling)
* **场景**：“Thinking about the things around you in English.”
* **功能规格**：
  * 获取 WebRTC 摄像头视频流，识别视野内物品。
  * **全景 Glassmorphism AR 标签**：视野内检测到的所有物体上方同时悬浮高透光 Glassmorphism 极美标签，呈现英文单词、音标与收藏入口。
  * 点击标签唤起详情。

### 1.2 🎵 音乐与歌词联想教学 (Music & Lyric Connection)
* **场景**：“Using songs to learn vocabulary.”
* **功能规格**：
  * **歌单与歌词同步引擎**：支持同步网易云/Spotify/本地歌单，自动匹配 `.lrc` 毫秒级逐字高亮歌词。
  * 预置经典示范曲目（如 *Shape of You* 附带完整逐字 LRC 歌词）。

### 1.3 📚 时间与类别词汇集合 (Word Set Classified by Time & Category)
* **场景**：“classified by time (today, yesterday) or categories (animal, plant)”
* **功能规格**：
  * **时间轴维度**：`Today`（今天）、`Yesterday`（昨天）、`Earlier`（更早）。
  * **多维场景与 AI 打标**：预置 `Animal`, `Plant`, `Technology`, `Daily Life` 场景，预留 AI 接口进行深度语义打标。

---

## 2. 📌 第二部分：1 个通用贯穿功能 (General Function)

### 2.1 🎴 单词点击 ➔ “不背单词”参考沉浸卡片 ➔ ⭐ 静默收录归类
* **场景**：在上述任意界面点击单词 ➔ 跳转“不背单词”参考风格详情页 ➔ 点击 ⭐ 添加至词汇集并自动归类。
* **功能规格**：
  * **0.1 秒静默沉浸入库**：点击 ⭐ 仅需 0.1s 静默完成收录与自动打标，无阻碍弹窗，绝对不打断学习流。
  * **例句动态优先级链**：
    $$\text{例句优先级} = \text{用户歌单歌曲原词例句} \xrightarrow{\text{未命中}} \text{相机/生活原场景例句} \xrightarrow{\text{未命中}} \text{雅思真题学术例句}$$
    优先高亮用户歌单歌词里的原句！

---

## 3. 📌 第三部分：1 个核心灵魂功能 (Key Feature)

### 3.1 🎯 雅思真题 (听/读/写) 自动匹配与组卷通知 (IELTS Auto Full Test & Notification)
* **场景**：基于收录词汇，自动在雅思真题（听力、阅读、写作）中检索/匹配语料段落与自动组卷通知。
* **功能规格**：
  * **自动阈值通知**：用户自定义积累数量（如满 15 词）或时间周期（如每日 20:00）触发系统通知：“*您的专属雅思真题试卷已生成！*”。
  * **完整套题模式 (用户首选)**：将收录的词汇合成/匹配为**一整篇标准的雅思阅读文章 (Full Passage)** 或 **听力 Section 3 对话**，并附带真正雅思考题 (T/F/NG 判定、Summary 填空、Matching 匹配)。支持专项分块模式切分。
  * **📱💻 全端 100% 全功能**：手机端呈现口袋刷题卡片，PC 端呈现大屏双栏对比阅读与写作工作台。

---

## 4. 🚨 AI 协作与工作流三铁律 (AI Collaboration Rules)

1. **绝对禁止抢跑 (Strictly No Premature Rushing)**：必须 100% 配合用户的节奏，用户未指令下一步前，严禁擅自跳步。
2. **多用 Plan 模式主动询问与确认 (Mandatory Plan Consultation)**：开展任何新阶段前，必须先制定 Plan 充分询问确认。
3. **技术问题“先通俗说明，再由用户拍板” (Plain Explanation Before Consultation)**：技术选型必须先用通俗语言把原理与优缺点解释清楚，完全由用户拍板。

---

## 5. 🛠️ 用户拍板的技术选型 (Approved Tech Stack)

* **前端核心框架**：`React 18 / 19 + Vite`（npm 周下载 1.6 亿+，82.3K Stars，工业级标准）
* **离线数据库**：`IndexedDB (Dexie.js)`（npm 周下载 150 万+，14.5K Stars，10年成熟标准）
* **样式与设计系统**：`Vanilla CSS (CSS 变量)`（0 依赖，100% 自由度打磨 Glassmorphism）

---

## 6. 📅 4 阶段演进路线图 (Phased Roadmap)

* **Phase 1**：地基与核心架构（数据模型 + 本地存储 + 自动通知/阈值设置框架 + 全端 UI 壳 + “不背单词”参考卡片）
* **Phase 2**：歌词同步与静默收录（歌单/LRC 歌词同步引擎 + 歌词逐字高亮 + 一键 ⭐ 静默收录）
* **Phase 3**：雅思自动组卷与通知引擎（单词积累阈值监听 + 雅思全套阅读/听力/写作试卷生成与练习）
* **Phase 4**：AR 相机与视觉标签（WebRTC 相机物块检测 + 全景 Glassmorphism 悬浮 AR 标签）
