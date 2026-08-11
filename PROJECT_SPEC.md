# ContextEng — 详细项目需求规格说明书 (Project Specification)

> 本文档为 ContextEng 系统的**单源真相 (Single Source of Truth)** 规格说明书。包含系统的全端全功能响应式架构、歌单与歌词同步引擎、AI 智能分类规则、多主题外观设计规范以及四阶段演进路线。

---

## 1. 核心业务愿景与平台定位

本应用定位为 **全场景全功能沉浸式英语学习系统 (Cross-Platform Full-Feature System)**。所有核心功能（包括雅思真题语境匹配）在手机端 App 与 PC 端网页中**均保持 100% 完全可用 (Full Feature Parity)**：

```mermaid
graph TD
    User[用户全场景学习流程] --> Mobile[📱 移动端 (Mobile PWA App)]
    User --> PC[💻 PC 端 (Desktop Workbench)]

    Mobile --> M1[AR 相机实物扫描标签]
    Mobile --> M2[随身听歌 & 歌词查词打卡]
    Mobile --> M3[📱 便捷移动端雅思刷题卡片]

    PC --> P1[AR 场景回顾与管理]
    PC --> P2[歌单管理与大屏歌词交互]
    PC --> P3[💻 PC 大屏雅思深度读写工作台]

    Mobile <-->|全功能无缝同步| PC
```

* **📱 移动端 (Mobile PWA App)**：支持随时随地的碎片化学习。除了 AR 实物识别与听歌查词外，**雅思真题模块在手机端提供口袋速刷卡片 (Mobile IELTS Flashcards)**，方便在公交、地铁或课间随时随地利用已收藏词汇刷雅思例句。
* **💻 PC 端 (Desktop Workbench)**：提供大屏深度学习体验。雅思模块扩展为双栏并排读写工作台，方便进行长篇学术段落阅读与键盘写作敲击。

---

## 2. 模块级功能规格定义

### 2.1 📱/💻 响应式布局与全端 PWA 适配
* **Mobile 视图**：底栏 Tab 导航 (`Camera` / `Music` / `Words` / `IELTS Context`)，单栏流畅卡片设计。支持 PWA 全屏无缝安装使用。
* **Desktop 视图**：左侧侧边栏导航 + 主区域大屏工作台。全功能无缝切换。

### 2.2 雅思真题语境匹配引擎 (IELTS Context Engine - 移动端+PC 全覆盖)
* **📱 移动端体验**：
  * **听力卡片 (Mobile Listening)**：手机端播放场景对话音频切片，卡片式呈现对话交互并高亮重点词。
  * **阅读片段 (Mobile Reading)**：精简短段落速刷卡片，支持手势滑动与高亮词点击查词。
  * **写作金句 (Mobile Writing)**：Task 2 高分替换表达卡片，方便快速背诵与打卡。
* **💻 PC 端体验**：
  * 大屏双栏对比，支持长篇学术段落对照、写作文本键入与深度语境分析。

### 2.3 歌单与歌词同步教学引擎 (Playlist & Lyrics Sync Engine)
* 支持导入/同步歌单（如粘贴网易云/Spotify 歌单 ID，或导入本地 JSON/音频歌单）。
* 系统结合歌词 API (如 LRCLIB / 网易云歌词源) 自动同步带有毫秒级时间轴的 `.lrc` 歌词。
* 预置经典示范歌曲（如 *Shape of You* 附带完整逐字 LRC 歌词与歌词交互查词）。

### 2.4 "不背单词" 沉浸式详情卡片 (Word Detail Card)
* **核心元素**：
  * **单词大字与发音**：超大高辨识度 Typography + 英音/美音双音标 + 点击触发真人/合成音频发音。
  * **权威释义与词性**：支持多词性展示 (n./v./adj./adv.)。
  * **原声/情境例句**：自动关联该单词来源的歌曲歌词例句、AR 捕获场景例句或雅思真题例句。
  * **雅思考频与考点标记**：标注该词在雅思 (IELTS) 考试中的出现频率与核心考点。
  * **⭐ 一键收藏与 AI 智能打标**：点击星号实时收藏，系统在后台自动打上时间戳 (Today/Yesterday) 并触发 AI 语义多分类。

### 2.5 多维词汇分类与时间轴本 (Word Notebook & AI Categorization)
* **时间轴维度 (Time Dimension)**：`Today` / `Yesterday` / `Earlier`。
* **AI 动态分类维度 (AI Multi-Tag System)**：
  * 本地预置 20+ 基础场景：`Animal` (动物), `Plant` (植物), `Technology` (科技), `Daily Life` (生活), `Food` (饮食), `Emotions` (情感)。
  * 预留 AI API 接口实现深度语义与雅思分级自动打标。
* **多主题支持 (Multi-Theme System)**：支持动态主题切换（如 **Dark Glassmorphism**、**Light Clean**、**Paper Warm**）。

### 2.6 AR 相机实物识别模块 (AR Camera Vision)
* 获取摄像头视频流，动态检测视野内的物品。
* 在物体位置上方锚定悬浮 AR 标签，呈现单词、音标与收藏入口。

---

## 3. 分期演进路线 (Phased Execution)

* **Phase 1**：项目基建 + 全端响应式框架 + "不背单词" 沉浸卡片 + 多维/AI 词汇本。
* **Phase 2**：歌单与歌词同步引擎 (Playlist & Lyric Sync) + LRC 逐字高亮查词。
* **Phase 3**：雅思听/读/写真题语境智能匹配引擎 (Mobile 刷题卡片 + PC 大屏工作台)。
* **Phase 4**：AR 相机实物检测与悬浮 Glassmorphism 标签。
