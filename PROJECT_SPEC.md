# ContextEng — 详细项目需求规格说明书 (Project Specification)

> 本文档为 ContextEng 系统的**单源真相 (Single Source of Truth)** 规格说明书。记录产品大方向、自动组卷通知机制、歌单歌词同步、全端响应式设计与四阶段演进路线。

---

## 1. 核心业务愿景与产品哲学

本应用旨在打造一个**以真实情境驱动、AI 自动化组卷为核心**的深度英语学习系统：

1. **静默沉浸收录 (Silent Seamless Collection)**：在相机实物 AR 扫描或歌曲播放中，用户点击 ⭐ 按钮后，系统**完全静默自动入库并自动归类打标**，绝不打断用户的连续学习流。
2. **智能阈值与定时通知 (Automatic Smart Notification)**：当用户收录的词汇满足特定条件时，系统自动触发通知，提示“您的专属雅思真题试卷已生成！”。
3. **雅思全套真题匹配与组卷 (IELTS Full Test Generation - Key Feature)**：
   * **完整套题模式 (Full Test Mode - 推荐)**：将用户近期收录的一组单词，合成/匹配为一整篇标准的**雅思阅读文章 (Full Reading Passage)** 或 **听力 Section 3 对话**，并附带真正的雅思考题（如 True/False/Not Given、填空题、Matching 匹配题）。
   * **专项分块模式 (Section Mode)**：按听力短对话、阅读短段落、写作 Task 2 高分句型分块呈现。
   * 用户可自由选择以哪种模式练习。
4. **歌单与歌词同步 (Playlist & Lyrics Sync)**：支持导入/同步个人歌单，自动匹配 `.lrc` 毫秒级逐字歌词，实现歌词平滑高亮与交互查词。
5. **全端响应式支持 (Full-Platform Parity)**：手机端 (Mobile PWA App) 侧重相机扫描与随身听歌；PC 端 (Desktop Workbench) 侧重雅思长文章阅读与大屏写作练题。

---

## 2. 详细功能机制规格

### 2.1 单词积累阈值与通知机制 (Threshold & Notification Engine)
* **自定义触发规则**：
  * **按词汇数量**：用户自定义（如每满 10 个/20 个新词）。
  * **按时间周期**：用户自定义（如每日 20:00 定时生成）。
  * **双触发模式**：允许同时开启数量与时间阈值，满足任意条件即自动发送系统通知并生成真题试卷。

### 2.2 雅思全套真题匹配与呈现 (IELTS Generation & Quiz Spec)
* **阅读全套模式 (Full Reading Passage)**：
  * 自动包含用户收录的目标词汇。
  * 包含完整学术文章 + 雅思标准题型（T/F/NG 判定、段落标题匹配、Summary 填空）。
* **听力全套模式 (Full Listening Section)**：
  * 自动包含目标词汇的完整 Section 对话/独白录音与文本 + 听力填空/选择题。
* **写作专项模式 (Writing Task 2)**：
  * 针对目标词汇生成 Task 2 高分论据与替换句型卡片。

### 2.3 静默沉浸收录与 AI 分类 (Silent Collection & Auto-Tagging)
* **无缝交互**：用户在相机 AR 视图或歌词视图中点击 ⭐，无任何阻碍弹窗，0.1 秒内完成收录。
* **多维分类**：
  * 时间维度：`Today` / `Yesterday` / `Earlier`。
  * 场景与 AI 标签：`Animal`, `Plant`, `Technology`, `Daily Life`, `IELTS Band 7.0+` 等。

---

## 3. 分期演进路线 (Phased Execution)

* **Phase 1 (地基与核心架构)**：数据模型 + 本地存储 + 自动通知/阈值设置框架 + 全端 UI 壳。
* **Phase 2 (歌词同步与静默收录)**：歌单/LRC 歌词同步引擎 + 歌词逐字高亮 + 一键 ⭐ 静默收录。
* **Phase 3 (雅思自动组卷与通知引擎)**：单词积累阈值监听 + 雅思全套阅读/听力/写作试卷生成与练习。
* **Phase 4 (AR 相机与视觉标签)**：WebRTC 相机物块检测 + 悬浮 AR 标签锚定。
