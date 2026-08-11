# ContextEng — 全局上下文与会话交接档案 (Session Handoff & Memory File)

> 💡 **给新 Agent / 新 Session 的读取指南**：  
> 本文件为项目防降智、跨会话恢复上下文的**最高优先级档案**。当在新对话中接手本项目时，请**先阅读本文件**，以立刻掌握项目的当前阶段、AI 协作铁律、已确立的全部核心意图、Git 历史与下一步规划。

---

## 🚨 0. 核心 AI 协作行为铁律 (Mandatory Collaboration Rules)

> 任何 Agent 在本项中执行任务时，必须 100% 恪守以下三条铁律，绝不违背：

1. **绝对禁止抢跑 (Strictly No Premature Jumping)**：
   * 必须严格配合用户的节奏。用户没有明确指令开展下一步前，严禁擅自跳步或预设下一步微观细节。
2. **多用 Plan 模式主动向用户询问与确认 (Mandatory Plan-Mode Consultation)**：
   * 在开展任何新阶段或修改前，必须先制定 Plan，主动向用户询问细节并充分确认意图。
3. **技术问题“先通俗说明，再由用户拍板” (Plain Explanation Before Consultation)**：
   * 凡涉及技术选型或架构方案，AI **必须先用通俗易懂的语言把原理、优缺点解释清楚**，然后再交由用户审查与拍板。
   * **绝对禁止擅自替用户做技术决定**。

---

## 📌 1. 项目基本信息 (Basic Identity)
* **项目名称**：ContextEng (情境英文)
* **本地根目录**：`d:\Git\`
* **代码仓库状态**：已初始化 Git 仓库，拥有规范的 `.gitignore` 与原子化 Commit 记录。
* **当前阶段**：**地基阶段 (Groundwork Phase)** — 大方向与技术选型已完全拍板，等待用户指示下一步。

---

## 🛠️ 2. 用户亲自拍板确立的技术选型 (Approved Tech Stack)

| 层级 | 拍板技术方案 | 工业成熟度与理由 |
| :--- | :--- | :--- |
| **前端框架 & 构建** | **React 18 / 19 + Vite** | npm 周下载量 1.6 亿+，82.3K Stars，全球标准建站基建。 |
| **离线数据库** | **IndexedDB (Dexie.js)** | npm 周下载量 150 万+，14.5K Stars，10 年成熟工业标准，高速离线存词库与真题。 |
| **样式与设计系统** | **Vanilla CSS (CSS 变量)** | 0 依赖，100% 自由度微调 Glassmorphism 玻璃拟态与 3D 浮动动画。 |

---

## 🎯 3. 已确立的用户真实意图 (Decided User Intents)

| 核心模块 | 已拍板确立的细节规则 |
| :--- | :--- |
| **⭐ 单词收录体验** | **完全静默沉浸入库**：在相机 AR 或歌词中点击 ⭐，0.1s 内完成收录，无阻碍弹窗；后台自动打上时间 (`Today`/`Yesterday`) 和 AI 分类标签。 |
| **🔔 阈值与自动通知** | **自由自定义触发**：用户可自定义单词积累数量（如满 15 词）或时间周期（如每天 20:00），也可同时开启双模式；满足条件时自动发送通知：“您的专属雅思真题试卷已生成！”。 |
| **📝 雅思真题生成** | **完整套题模式 (首选)**：根据收集的单词，自动合成/匹配一整篇**标准雅思阅读文章 (Passage)** 或 **听力 Section 3 对话**，并附带真正雅思考题 (T/F/NG 判定、Summary 填空、Matching 匹配)。支持专项分块模式切分。 |
| **💬 例句优先级链** | $\text{例句优先级} = \text{用户歌单歌曲原词例句} \xrightarrow{\text{未命中}} \text{相机/生活原场景例句} \xrightarrow{\text{未命中}} \text{雅思真题学术例句}$。优先高亮歌单歌词原句！ |
| **📷 AR 相机识别** | **全景并发标注**：视野内检测到的所有物体上方同时悬浮 Glassmorphism 极美标签，点击标签唤起详情。 |
| **🎵 歌单歌词同步** | **混合同步**：支持输入网易云/Spotify/本地歌单，自动通过 API 匹配 `.lrc` 毫秒级逐字高亮歌词；预置经典示范歌曲（如 *Shape of You*）。 |
| **📱💻 全端功能覆盖** | **100% 双端全功能 (Full Parity)**：手机端 PWA 主打便携扫物与听歌，但包含移动端雅思口袋刷题卡片；PC 端提供大屏深度阅读与写作工作台。 |

---

## 📜 4. Git 提交历史索引 (Git Commit Log)

```
13f53f8 docs: record user-approved tech stack in SESSION_HANDOFF.md
dceb247 docs: add SESSION_HANDOFF.md context memory file for cross-session tracking
51b5c51 docs: add panoramic AR label spec and lyric-first example priority chain
6b8331e docs: integrate automatic word-threshold notification and full-passage IELTS generation spec
09dae69 docs: add mobile PWA and PC desktop responsive layout spec
9d3d6c2 docs: update spec with Playlist & Lyric sync engine & schema
057f3a8 docs: add PROJECT_SPEC.md and DATA_SCHEMA.md foundational specifications
a1eba1d docs: add project-level README.md specification
2466a24 chore: initialize repository with clean .gitignore
```
