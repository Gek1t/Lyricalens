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
* **当前阶段**：**Google AI Studio 前端应用构建与视觉精调阶段 (AI Studio App Refinement Phase)**
  * **Google AI Studio 活跃应用**：`https://ai.studio/apps/c937cbf7-a052-4d2c-b396-10950080d263`
  * **中央播放器已定稿规范**：
    1. **顶部 Header**：单行居中大写副标题 `NOW PLAYING`，消除多余歌名重复。
    2. **标题区**：位于封面正上方，第一行浅灰细体大写 `ETHEREAL SOUNDS`，第二行经典衬线 `JASMINE BREEZE`。
    3. **3 层画廊装裱物理质感 (Skeuomorphic Art Matting)**：外层竖版白色照片卡片 + 内层自适应专辑主色的柔和哑光衬底 + 核心 1:1 正方形专辑封面，并附带真实柔和的立体悬浮弥散阴影（切歌时内衬与光晕自适应过渡）。
    4. **金句与控制栏**：居中斜体金句 *“Fragrant whispers in the ephemeral air”*（生词下划线）+ 极简进度条与播放按钮 + 底部 `· - ·` 空间指示器。
    5. **全屏歌词翻转与手势抓词引擎 (Full Lyrics & Gesture Engine)**：
       * 单击中央画框无缝翻转/切换进入全屏歌词空间；
       * 单击单词呼出底部抽屉词卡；长按触发【状态一】冻结歌词滚动+触觉振动+左右滑动扩选词组；
       * 手势判定：上滑丢弃/取消；中间松手后选词灵动“逃逸”至左上角徽标并进入详情页；
       * 联动词组支持子单词下钻；⭐ 收藏遵循“所见即所收+母子关联外键”；支持抽屉下滑/遮罩点击/关闭键/Hero飞回四重返回。

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
  * **顶底固有框架**：最顶部（导航）和最底部（播放控件）为绝对固有 UI，不可破坏，形成“画框”边界。
  * **全局资产中枢 (左上角菜单)**：采用“空间下沉”全屏拉入动画，以及基于封面提取色的“轻透流体”虚化背景。具体内部排版与功能架构 **待定 (TBD)**。
  * **视觉中心与律动背景**：正中央摒弃静态插画，替换为当前播放的**专辑封面**。背景废弃死板单色，必须能根据当前专辑封面自动提取主色调，并伴随音乐律动产生柔和渐变、“呼吸”动效。
  * **沉浸式 KTV 歌词**：下方区域为沉浸式动态歌词，随播放进度实时高亮、滚动与渐变。
  * **技术实现分工 (Stitch + 代码接管)**：Stitch 负责搭建极简静态排版、“画框”框架、绝对定位的顶底元素与留白比例；呼吸背景与 KTV 滚动歌词具有强动态、音频绑定属性，将在生成前端代码（React/Vite）后，通过真实的 CSS 动画与 JS 逻辑（如 ColorThief + requestAnimationFrame）接入实现。
* **三大平级空间全状态资产矩阵 (Stitch Multi-State Asset Catalog)**：
  1. `左滑`：**AR 视觉与词典空间 (AR Vision & Dictionary Space)**
     * **扫描模式 (Scanning)**：
       * `5efa2d714f5d42f6b7ad89b9a226e207`：AR 词典 - 扫描模式 (Light Mode)
       * `6458492213515097002`：AR 词典 - 扫描模式 (Dark Mode)
     * **词典详情展开态 (Word Detail Popups & Examples)**：
       * `3bd24a65fabf4c5491a111ad31b6d002`：Word Detail (Expanded Light)
       * `ee70971a60e2485aa2b94d7d79ceab6f`：Word Detail (Light Stable)
       * `20a95ee396a341248b9675ea239b0c88`：Word Detail (Expanded Light with Examples)
       * `02b8b9f6c15f46e49fc12a43fc4bebde`：Word Detail (Expanded Native with Examples)
       * `8211a5c687d54d179a5481474eb7c834`：Word Detail (Expanded Native)
       * `994e94e731bb4863ba433e6c90e31a6f`：Word Detail (Native Layout)
     * **3D 空间标签组件**：`15300032363802338182` (收藏版) / `10860970399617407934` (纯净版)
  2. `中央`：**每日一歌播放器中枢 (Music Player Space)**
     * **主播放器 (Now Playing)**：
       * `10935389092745907214`：Jasmine Breeze - Variant B (Gallery Light)
       * `4fbb71c8d8ae4e58a75de7cf5618d39c`：Jasmine Breeze - Gallery (Dark Mode)
       * `4933292752952756584` / `0c335fa432264357b7e252b8f398fa64`：Zen Player Immersive & Base
  3. `右滑`：**雅思精读与做题坞 (IELTS Space - 完整双主题与滑动状态矩阵)**
     * **亮色纸质风 (Warm Cream Paper)**：
       * `632e6d43acae44d08f119a06c93096fa`：IELTS Reading (长文精读 + 底部抽屉收起态)
       * `3934bd31d225479fa9b47c47a6f1039c`：IELTS Reading - Scrolled State v2 (长文向下滚动态)
       * `3f08649f92f54b7cb9f3a8fc9bedc62e`：IELTS Reading - Scrolled State v2 Deep (深度滚动态)
       * `42e9557f768347d2bbcbf2a621a14541`：IELTS Reading Quiz (做题抽屉全屏展开态)
       * `35c7119225a64bdd959b3e925afa9343`：IELTS Assessment Summary (成绩结算与生词回顾)
     * **暗夜画廊风 (Dark Mode Glass)**：
       * `f3de87dd353c43dbb4a8bffb909ea1b6`：IELTS Reading - Dark Mode (长文精读)
       * `ddec56237003439a8b1f122bf6814c28`：IELTS Reading - Scrolled State Dark v2 (滚动态)
       * `6832fe2ac85c4f1099c372af55c99dfd`：IELTS Reading - Scrolled State Dark v3 (深度滚动态)
       * `590b9ca8d3ae46a9bfb1111b506408b8`：IELTS Reading Quiz - Deep Dark Mode (做题抽屉展开)
       * `f7561f50668a4c3aa39898064586d826`：IELTS Assessment - Dark Mode (暗色高光结算卡)
     * **一致性与技术分工**：全屏统一顶部导航；Stitch 固化所有静态多状态切图，交互动画与音频联动由前端代码接管。
     * **Google AI Studio 生成提示词**：已完成 Master System Prompt 编制并存盘于 `AI_STUDIO_MASTER_PROMPT.md`，内含 16 张黄金资产映射、Zustand+Dexie 状态流、rAF 逐字高光引擎与 Gemini 组卷架构。

---

## ⚡ 2.6 核心交互与验收规范 (Interaction & Validation Workflow)
* **动态环境光晕 (Dynamic Background Glow)**：核心交互底线。用户横向滑动切歌时，背景/光晕颜色必须能**根据当前歌曲专辑封面在客户端 (Client-side) 自动提取并无缝渐变**。
* **真实数据源驱动**：所有 Demo 和开发绝对禁止使用 Mock 假数据糊弄，必须基于真实的网易云音乐接口 (如歌单 `id=545843480`) 进行。
* **词汇高亮交互**：歌词中的核心词汇（如 "ephemeral"）必须有视觉高亮，并作为触发 AR 识别或唤起词典模块的核心交互入口。
* **【绝对限制】UI 验收演示途径**：已彻底**废弃**使用内置窗口沙盒或本地已有工具 (如 React/Vite 开发服务器) 进行 UI 演示的方案。后续所有的高保真演示与验收，**仅允许**通过以下两种官方渠道：
  1. **Stitch**: 纯 UI 与设计稿推敲。
  2. **Google AI Studio**: 交互代码验证与高保真运行体验。

---

## 🎯 2.7 下一会话接力行动清单 (Next Session Hand-off Action Items)
1. **Google AI Studio 完整功能与空间验收**：
   * 在 AI Studio Preview 中横滑验证 **左侧 AR 空间 (实景+3D标签)** 与 **右侧雅思空间 (长文+30%悬浮做题抽屉)**；
   * 验证点击生词（如 `ephemeral`）唤起带有双语境例句的毛玻璃词卡；
2. **代码回流至本地代码库 (`d:\Git`)**：
   * 从 Google AI Studio 点击 `Export code` / `Code` 复制导出完整代码；
   * 在本地初始化 `React 18 + Vite + Dexie.js + TypeScript` 工业级工程；
3. **接入真实业务数据源与硬件**：
   * 接入网易云真实歌单 API (`id=545843480`) 驱动真实音画与 LRC 同步；
   * 接入真实 WebRTC 相机与 Gemini API 个性化真题组卷。

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
