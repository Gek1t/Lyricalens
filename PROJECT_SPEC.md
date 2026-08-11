# ContextEng — 详细项目需求规格说明书 (Project Specification)

> 本文档为 ContextEng 系统的**单源真相 (Single Source of Truth)** 规格说明书。包含系统的功能边界、歌单与歌词同步引擎、AI 智能分类规则、多主题外观设计规范以及四阶段演进路线。

---

## 1. 核心业务愿景与理念

本应用旨在提供**全情景沉浸式英文学习体验**，解决传统背单词“脱离语境、枯燥易忘”的痛点：
1. **真实环境感知 (AR Camera)**：“Thinking about the things around you in English.” 随时随地捕捉周围实物，将其转化为英文单词学习入口。
2. **歌单与歌词同步教学 (Playlist & Lyrics Sync)**：“Using songs to learn vocabulary.” 支持同步个人歌单 (如 Spotify/网易云/本地歌单)，自动匹配毫秒级 LRC 逐字歌词，在歌声与例句中理解单词。
3. **“不背单词” 极致卡片 (Word Card)**：极具美感与仪式感的单词详情页，提供超大单词排版、双音标发音、丰富释义、歌词例句与考频信息。
4. **AI 动态智能分类 (AI Auto-Categorization)**：除时间轴 (Today/Yesterday) 外，融合本地场景与 AI 动态语义多标签分类 (如 `Animal`, `Plant`, `Technology`, `Botany`, `IELTS Academic`)。
5. **雅思真题语境重组 (IELTS Context Engine - Key Feature)**：基于用户已收藏的词汇集，自动检索或智能合成雅思听力对话 (Section 1/3)、阅读学术段落 (Passage) 与写作 (Task 2) 高分替换句型。

---

## 2. 模块级功能规格定义

### 2.1 歌单与歌词同步教学引擎 (Playlist & Lyrics Sync Engine)
* **歌单同步 (Playlist Sync)**：
  * 支持导入/同步歌单（如粘贴网易云/Spotify 歌单 ID，或导入本地 JSON/音频歌单）。
  * 内置精选高质感英文学习歌单（预置经典示范歌曲，如 *Shape of You* 附带完整逐字 LRC 歌词）。
* **歌词自动抓取 (Lyrics Auto-Fetch)**：
  * 系统结合歌词 API (如 LRCLIB / 网易云歌词源) 自动同步带有毫秒级时间轴的 `.lrc` 歌词。
* **歌词交互与查词**：
  * 支持逐字/逐句平滑跟随高亮播放。
  * 点击歌词中的任意单词，立即弹窗唤起“不背单词”详情页，并支持一键 ⭐ 收藏。

### 2.2 "不背单词" 沉浸式详情卡片 (Word Detail Card)
* **核心元素**：
  * **单词大字与发音**：超大高辨识度 Typography + 英音/美音双音标 + 点击触发真人/合成音频发音。
  * **权威释义与词性**：支持多词性展示 (n./v./adj./adv.)。
  * **原声/情境例句**：自动关联该单词来源的歌曲歌词例句、AR 捕获场景例句或雅思真题例句。
  * **雅思考频与考点标记**：标注该词在雅思 (IELTS) 考试中的出现频率与核心考点。
  * **⭐ 一键收藏与 AI 智能打标**：点击星号实时收藏，系统在后台自动打上时间戳 (Today/Yesterday) 并触发 AI 语义多分类。

### 2.3 多维词汇分类与时间轴本 (Word Notebook & AI Categorization)
* **时间轴维度 (Time Dimension)**：
  * `Today`：今日新增/打卡收录的词汇。
  * `Yesterday`：昨日收录词汇。
  * `Earlier`：更早收录的历史词库。
* **AI 动态分类维度 (AI Multi-Tag System)**：
  * 本地预置 20+ 基础场景：`Animal` (动物), `Plant` (植物), `Technology` (科技), `Daily Life` (生活), `Food` (饮食), `Emotions` (情感)。
  * 预留 AI API 接口实现深度语义与雅思分级自动打标。
* **多主题支持 (Multi-Theme System)**：
  * 架构上支持动态主题切换（如 **Dark Glassmorphism 深色玻璃拟态**、**Light Clean 极简明亮**、**Paper Warm 复古纸质**）。

### 2.4 雅思真题语境匹配引擎 (IELTS Context Engine)
* 输入：用户收录的星标词汇集合。
* 输出：
  * **听力 (Listening)**：包含目标词的二人对话片段 (Section 1/3)。
  * **阅读 (Reading)**：包含目标词的学术阅读段落 (Academic Passage)。
  * **写作 (Writing)**：包含目标词的 Task 2 高分议论文/图表分析句型。
* 重点词汇在段落/句型中高亮呈现。

### 2.5 AR 相机实物识别模块 (AR Camera Vision)
* 获取摄像头视频流，动态检测视野内的物品。
* 在物体位置上方锚定悬浮 AR 标签，呈现单词、音标与收藏入口。

---

## 3. 分期演进路线 (Phased Execution)

* **Phase 1**：项目基建 + 本地存储数据模型 + "不背单词" 沉浸卡片 + 多维/AI 词汇本框架。
* **Phase 2**：歌单与歌词同步引擎 (Playlist & Lyric Sync) + LRC 逐字高亮查词。
* **Phase 3**：雅思听/读/写真题语境智能匹配引擎。
* **Phase 4**：AR 相机实物检测与悬浮 Glassmorphism 标签。
