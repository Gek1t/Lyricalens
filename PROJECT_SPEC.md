# ContextEng — 详细项目需求规格说明书 (Project Specification)

> 本文档为 ContextEng 系统的**单源真相 (Single Source of Truth)** 规格说明书。包含系统的功能边界、AI 智能分类规则、多主题外观设计规范以及四阶段演进路线。

---

## 1. 核心业务愿景与理念

本应用旨在提供**全情景沉浸式英文学习体验**，解决传统背单词“脱离语境、枯燥易忘”的痛点：
1. **真实环境感知 (AR Camera)**：“Thinking about the things around you in English.” 随时随地捕捉周围实物，将其转化为英文单词学习入口。
2. **音乐律动教学 (Song Lyrics)**：“Using songs to learn vocabulary.” 借由歌曲的高频重复与旋律情感，在歌词高亮与原声例句中理解单词。
3. **“不背单词” 极致卡片 (Word Card)**：极具美感与仪式感的单词详情页，提供丰富释义、音标发音与考频信息。
4. **AI 动态智能分类 (AI Auto-Categorization)**：打破单一分类局限，除时间轴 (Today/Yesterday) 外，结合 AI 实现单词自动多维语义归类 (如 `Animal`, `Plant`, `Philosophy`, `IELTS Academic` 等)。
5. **雅思真题语境重组 (IELTS Context Engine - Key Feature)**：基于用户已收藏的词汇集，自动检索或智能合成雅思听力对话 (Section 1/3)、阅读学术段落 (Passage) 与写作 (Task 2) 高分替换句型。

---

## 2. 模块级功能规格定义

### 2.1 "不背单词" 沉浸式详情卡片 (Word Detail Card)
* **核心元素**：
  * **单词大字与发音**：超大高辨识度 Typography + 英音/美音双音标 + 点击触发真人/合成音频发音。
  * **权威释义与词性**：支持多词性展示 (n./v./adj./adv.)。
  * **原声/情境例句**：自动关联该单词来源的歌曲歌词例句、AR 捕获场景例句或雅思真题例句。
  * **雅思考频与考点标记**：标注该词在雅思 (IELTS) 考试中的出现频率与核心考点。
  * **⭐ 一键收藏与 AI 智能打标**：点击星号实时收藏，系统在后台自动打上时间戳 (Today/Yesterday) 并触发 AI 语义多分类。

### 2.2 多维词汇分类与时间轴本 (Word Notebook & AI Categorization)
* **时间轴维度 (Time Dimension)**：
  * `Today`：今日新增/打卡收录的词汇。
  * `Yesterday`：昨日收录词汇。
  * `Earlier`：更早收录的历史词库。
* **AI 动态分类维度 (AI Multi-Tag System)**：
  * 基础场景分类：`Animal` (动物), `Plant` (植物), `Technology` (科技), `Daily Life` (生活), `Food` (饮食), `Emotions` (情感)。
  * AI 智能语义分类：系统允许用户自定义标签，或利用 AI 根据词义自动标签化（如自动归类为 `Botany` 或 `Academic IELTS`）。
* **多主题支持 (Multi-Theme System)**：
  * 架构上支持主题切换（如 **Dark Glassmorphism 深色玻璃拟态**、**Light Clean 极简明亮**、**Paper Warm 复古纸质**），不绑定单一静态样式。

### 2.3 音乐歌词沉浸教学模块 (Music Lyric Engine)
* 支持原生 Audio 控制（播放、暂停、进度调节、音量）。
* 解析 `.lrc` 格式歌词，实现**逐字/逐句平滑跟随高亮**。
* **歌词交互查词**：点击歌词中的任意单词，立即弹窗展示“不背单词”详情页，并支持一键 ⭐ 收藏。

### 2.4 雅思真题语境匹配引擎 (IELTS Context Engine)
* 输入：用户收录的星标词汇集合。
* 输出：
  * **听力 (Listening)**：包含目标词的二人对话片段 (Section 1 租房/选课 或 Section 3 学术讨论)。
  * **阅读 (Reading)**：包含目标词的学术阅读段落 (Academic Passage)。
  * **写作 (Writing)**：包含目标词的 Task 2 高分议论文/图表分析句型。
* 高亮提示：在呈现的雅段落/句型中自动高亮用户收录的重点词汇。

### 2.5 AR 相机实物识别模块 (AR Camera Vision)
* 获取摄像头视频流，动态检测视野内的物品。
* 在物体位置上方锚定悬浮 AR 标签，呈现单词、音标与收藏入口。

---

## 3. 分期演进路线 (Phased Execution)

* **Phase 1**：项目基建 + 本地存储数据模型 + "不背单词" 沉浸卡片 + 多维/AI 词汇本框架。
* **Phase 2**：音乐播放器与 LRC 逐字高亮歌词查词联动。
* **Phase 3**：雅思听/读/写真题语境智能匹配引擎。
* **Phase 4**：AR 相机实物检测与悬浮 Glassmorphism 标签。
