# Lyricalens — 进度与状态记录文件 (Progress Log & History File)

> ⚠️ **文件定位说明 (File Role Notice)**：  
> 1. 本文件仅为 **【项目当前进度与状态记录文件 (Progress Log File)】**。  
> 2. **统领本项目的最高规格与大纲 MD** 为：
>    * 📖 [`PROJECT_OUTLINE.md`](file:///d:/Git/PROJECT_OUTLINE.md)（三段式最高参照大纲）
>    * 📖 [`PROJECT_SPEC.md`](file:///d:/Git/PROJECT_SPEC.md)（详细需求规格说明书）
> 3. 请勿将本进度文件误认为统领项目的规格书。

---

## 📌 1. 当前项目进度 (Current Status)
* **项目名称**：**Lyricalens** (by Yuzaiyuan)
* **根据地根目录**：`d:\Git\`
* **当前阶段**：**Google AI Studio 前端全场景构建与视觉精调阶段 (AI Studio App Refinement Phase)**
  * **Google AI Studio 活跃应用**：`https://ai.studio/apps/c937cbf7-a052-4d2c-b396-10950080d263`
  * **已闭环定稿的 4 大核心模块**：
    1. **中央每日一歌播放器 (Now Playing)**：
       * 3 层画廊装裱物理质感（外层竖版白卡 + 内层自适应主色衬底 + 1:1 封面 + 立体弥散光晕随切歌平滑过渡）；
       * 底部卡片右侧整合雅思词汇雷达 (`✦ 3 IELTS WORDS`) / 刊号 (`VOL. 084`) / 3D 翻转提示；
       * 单击画卡 3D 翻转进入全屏歌词流，全局 Y 轴上下滑动无缝切歌。
    2. **全屏歌词空间与单点/长按手势分工 (Lyrics Space & Gesture Machine)**：
       * **单点单词 (Single Tap)**：呼出【底部 35% 轻量半屏微词卡 (Peek 速览态)】（音标发音 + 1 行简明释义），听歌不中断；向下拉 0.1s 秒退，向上拉 `^` 平滑展开为全屏详情页；
       * **长按单词 (Long Press)**：触发 Dwell-Lock 抓词引擎（冻结歌词滚动 + 触觉微振 + 连续流光高亮）；
       * **手势分发**：上滑取消，向下滑动 0.1s 静默收录入库，原地松手触发 **Hero 物理飞升动效** 直达全屏词汇/短语深度详情页。
    3. **雅思长文精读与做题坞 (IELTS Space Completed)**：
       * 70% 沉浸学术长文 + 30% 底部做题抽屉（收起/展开双态切换）；
       * **自适应倒计时系统**：纯净时间胶囊 `[ 🕐 17:42 · PASSAGE 2 ]`，二段式加时浮层（`[+1′][+5′][+10′][+15′]` 常用档 + 自定义步进微调），原位粒子漂浮动效 (`+05:00` float up & scale pulse)；
       * **超时双轨结算弹窗**：倒计时归零时半屏 Glassmorphism 弹出 `提交查看成绩` / 内嵌历史默认的 `加时继续`（一击即达）；
       * **模考诚实性指标**：成绩结算卡如实记录 `实际用时 / 标准用时 (延长 ×N)`。
    4. **生词本中枢与 4 阶同心星核掌握度 (Vocabulary Vault & 4-Stage Mastery)**：
       * 废除黄色星星 ⭐，升级为 4 阶同心星核掌握度圆环：
         - `○ Level 0 (未收录 / 浏览态)`：极细浅灰空心单环；
         - `⊛ Level 1 (已加入生词集 / 收藏态)`：空心环内嵌极细微 4 角星核 `✦`（长按/下滑收录入库）；
         - `⊙ Level 2 (熟悉中 / 学习态)`：暖金外环 + 中实心圆核；
         - `◉ Level 3 (已掌握 / 通关态)`：墨绿外环 + 饱满实心圆盘；
       * **全屏词汇详情页精修**：彻底移除底部 `PRONOUNCE`/`COPY` 冗余栏，恢复通透留白；单源语境智能降级（命中歌单展示真实 1 句歌词；未命中彻底隐藏歌词卡片，展示雅思真题学术长难句与自适应核心搭配胶囊）。
       * 批量操作支持：🎯 一键专属雅思试卷生成、批量标记掌握、批量打标、批量删除。

---

## 🛠️ 2. 用户拍板的技术选型 (Approved Tech Stack)

| 层级 | 拍板技术方案 |
| :--- | :--- |
| **前端框架 & 构建** | **React 18 / 19 + Vite** |
| **离线数据库** | **IndexedDB (Dexie.js)** |
| **样式与设计系统** | **Vanilla CSS (CSS 变量)** |

---

## 🎨 2.5 用户拍板的 UI/UX 设计方案 (Approved UI/UX Design)
* **核心架构**：沉浸式三重空间 (Immersive Tri-Space)。完全摒弃底部传统 Tab 按钮，采用类似抖音/Snapchat 的**左右横滑无缝切换**（ViewPager 模式），底部仅保留极简圆点指示器。
* **视觉对标**：“不背单词”极致留白、大字号衬线体、全屏无边框壁纸、暗黑玻璃态 (Dark Mode + Glassmorphism)。
* **每日一歌 (Daily Song - 动态静奢画廊风)**：作为首页中枢，全面升级为结合动态数据的沉浸式体验。
* **三大平级空间全状态资产矩阵 (Stitch Multi-State Asset Catalog)**：
  1. `左滑`：**AR 视觉与词典空间 (AR Vision & Dictionary Space)**
  2. `中央`：**每日一歌播放器中枢 (Music Player Space)**
  3. `右滑`：**雅思精读与做题坞 (IELTS Space - 完整双主题与滑动状态矩阵)**

---

## ⚡ 2.6 核心交互与验收规范 (Interaction & Validation Workflow)
* **动态环境光晕 (Dynamic Background Glow)**：核心交互底线。用户横向滑动切歌时，背景/光晕颜色必须能**根据当前歌曲专辑封面在客户端 (Client-side) 自动提取并无缝渐变**。
* **真实数据源驱动**：所有 Demo 和开发绝对禁止使用 Mock 假数据糊弄，必须基于真实的网易云音乐接口 (如歌单 `id=545843480`) 进行。
* **词汇高亮交互**：歌词中的核心词汇（如 "ephemeral"）必须有视觉高亮，并作为触发 AR 识别或唤起词典模块的核心交互入口。
* **【绝对限制】UI 验收演示途径**：仅允许通过 **Stitch**（纯 UI）与 **Google AI Studio**（交互代码与高保真运行体验）。

---

## 🎯 2.7 下一会话接力行动清单 (Next Session Hand-off Action Items)
1. **当前待构建空间 (Immediate Next Action)**：
   * **左滑 AR 空间重构落地**：
     - 解耦「相机未开启引导态」与「实时 AR 取景识别态」（彻底解决文字弹窗与标签穿模冲突）；
     - VisionOS 级高透毛玻璃空间标签（带半透明激光引线、呼吸锚点与 4 阶圆环）；
     - 底部居中拟物双环快门中枢 (Zen Shutter)。
   * **中央资产中枢**：左上角“空间下沉”轻透流体菜单排版与功能接驳。
   * **ViewPager 三平级空间横向手势总装联调**。
2. **全前端闭环后的后续行动**：
   * 所有前端空间与 ViewPager 左右滑动联调完毕后，代码一键回流至本地 `d:\Git` 初始化 React + Vite + Dexie 生产工程，接入真实网易云与 Gemini API。

---

## 📜 3. Git 提交历史日志 (Git Commit Log)

```
27f7f41 docs: finalize official app name as Lyricalex (by Yuzaiyuan)
99b779e docs: finalize official app name as Vibelex (by Yuzaiyuan)
04c0288 docs: set official app name to LyricLens (by Yuzaiyuan)
6b19bab docs: clarify SESSION_HANDOFF.md as progress log and PROJECT_SPEC/OUTLINE as master spec
89d44f0 docs: reorganize outline and spec into exact 3-tier structure
e7a56f0 docs: add PROJECT_OUTLINE.md as the master reference outline
82943d2 docs: strictly enforce AI collaboration rules
13f53f8 docs: record user-approved tech stack in SESSION_HANDOFF.md
dceb247 docs: add SESSION_HANDOFF.md context memory file for cross-session tracking
51b5c51 docs: add panoramic AR label spec and lyric-first example priority chain
6b8331e docs: integrate automatic word-threshold notification and full-passage IELTS generation spec
543e13b docs: enforce 100% IELTS feature parity on mobile app and PC desktop
09dae69 docs: add mobile PWA and PC desktop responsive layout spec
9d3d6c2 docs: update spec with Playlist & Lyric sync engine & schema
057f3a8 docs: add PROJECT_SPEC.md and DATA_SCHEMA.md foundational specifications
a1eba1d docs: add project-level README.md specification
2466a24 chore: initialize repository with clean .gitignore
```
