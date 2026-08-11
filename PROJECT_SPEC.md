# ContextEng — 详细项目需求规格说明书 (Project Specification)

> 本文档为 ContextEng 系统的**单源真相 (Single Source of Truth)** 规格说明书。包含系统的全端跨平台架构、歌单与歌词同步引擎、AI 智能分类规则、多主题外观设计规范以及四阶段演进路线。

---

## 1. 核心业务愿景与平台定位

本应用定位为 **全场景沉浸式英语学习系统 (Cross-Platform Contextual Learning System)**，针对手机端与 PC 端的强项场景进行差异化响应式设计：

```mermaid
graph TD
    User[用户全场景学习流程] --> Mobile[📱 移动端 (Mobile PWA App)]
    User --> PC[💻 PC 端 (Desktop Workbench)]

    Mobile --> M1[AR 相机实物扫描标签]
    Mobile --> M2[随身听歌 & 歌词查词打卡]

    PC --> P1[雅思 (听/读/写) 深度大屏练习]
    PC --> P2[词汇本全景分类与复习看板]

    Mobile <-->|数据状态无缝同步| PC
```

* **📱 移动端 (Mobile PWA App)**：主打“随时随地、物理感知”。在手机上作为 PWA App 全屏运行，充分发挥摄像头的便携性（AR 实物识别）与音频随身听（歌词查词）。
* **💻 PC 端 (Desktop Workbench)**：主打“深度学习、高效练题”。在 PC 大屏上作为响应式网页/桌面应用运行，提供雅思阅读段落并排对比、听力对话高亮、写作键盘敲击练习与全景词汇看板。

---

## 2. 模块级功能规格定义

### 2.1 📱/💻 响应式布局与全端 PWA 适配
* **Mobile 视图**：底栏 Tab 切换 (Camera / Music / Words / IELTS)，单栏卡片沉浸流。支持“添加到主屏幕”以全屏原生 App 形态运行。
* **Desktop 视图**：左侧侧边栏导航 + 主区域双栏/多栏大屏视图。左侧展开雅思真题阅读/听力文本，右侧固定“不背单词”详情卡片与关联词汇。

### 2.2 歌单与歌词同步教学引擎 (Playlist & Lyrics Sync Engine)
* 支持导入/同步歌单（如粘贴网易云/Spotify 歌单 ID，或导入本地 JSON/音频歌单）。
* 系统结合歌词 API (如 LRCLIB / 网易云歌词源) 自动同步带有毫秒级时间轴的 `.lrc` 歌词。
* 预置经典示范歌曲（如 *Shape of You* 附带完整逐字 LRC 歌词与歌词交互查词）。

### 2.3 "不背单词" 沉浸式详情卡片 (Word Detail Card)
* **核心元素**：
  * **单词大字与发音**：超大高辨识度 Typography + 英音/美音双音标 + 点击触发真人/合成音频发音。
  * **权威释义与词性**：支持多词性展示 (n./v./adj./adv.)。
  * **原声/情境例句**：自动关联该单词来源的歌曲歌词例句、AR 捕获场景例句或雅思真题例句。
  * **雅思考频与考点标记**：标注该词在雅思 (IELTS) 考试中的出现频率与核心考点。
  * **⭐ 一键收藏与 AI 智能打标**：点击星号实时收藏，系统在后台自动打上时间戳 (Today/Yesterday) 并触发 AI 语义多分类。

### 2.4 多维词汇分类与时间轴本 (Word Notebook & AI Categorization)
* **时间轴维度 (Time Dimension)**：`Today` / `Yesterday` / `Earlier`。
* **AI 动态分类维度 (AI Multi-Tag System)**：
  * 本地预置 20+ 基础场景：`Animal` (动物), `Plant` (植物), `Technology` (科技), `Daily Life` (生活), `Food` (饮食), `Emotions` (情感)。
  * 预留 AI API 接口实现深度语义与雅思分级自动打标。
* **多主题支持 (Multi-Theme System)**：支持动态主题切换（如 **Dark Glassmorphism**、**Light Clean**、**Paper Warm**）。

### 2.5 雅思真题语境匹配引擎 (IELTS Context Engine)
* **大屏工作台**：PC 端强化对雅思听/读/写真实考题的呈现，支持光标选词、段落对比与写作键入。
* **听力 (Listening)**：包含目标词的二人对话片段 (Section 1/3)。
* **阅读 (Reading)**：包含目标词的学术阅读段落 (Academic Passage)。
* **写作 (Writing)**：包含目标词的 Task 2 高分议论文/图表分析句型。

### 2.6 AR 相机实物识别模块 (AR Camera Vision)
* 获取摄像头视频流，动态检测视野内的物品。
* 在物体位置上方锚定悬浮 AR 标签，呈现单词、音标与收藏入口。

---

## 3. 分期演进路线 (Phased Execution)

* **Phase 1**：项目基建 + PC/Mobile 响应式基础 + "不背单词" 沉浸卡片 + 多维/AI 词汇本框架。
* **Phase 2**：歌单与歌词同步引擎 (Playlist & Lyric Sync) + LRC 逐字高亮查词。
* **Phase 3**：雅思听/读/写真题语境智能匹配引擎 (PC 端大屏强化)。
* **Phase 4**：AR 相机实物检测与悬浮 Glassmorphism 标签 (Mobile 端镜头强化)。
