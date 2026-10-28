# 🏛️ Lyricalens 全栈架构演进与会话上下文移交档案 (Session Handoff & Memory)

> **归档位置**：`D:\Git\CONVERSATION_HISTORY_AND_CONTEXT.md`  
> **移交时间**：2026-10-26 19:03  
> **会话来源 ID**：`5a671390-1683-4e51-8081-7edce7956657`  
> **源工作区**：`d:\单词识别软件\app` 迁移至目标 Git 仓库：`D:\Git`

---

## 一、 会话核心背景与业务决策

1. **项目定位**：
   * **Lyricalens (智能情境英语学习系统)**，深度融合 **AR 实物视觉识别 (Lens)**、**网易云音乐双语歌词 KTV 伴学 (Lyric)**、**剑桥雅思全套真题动态组卷与评分 (IELTS)**、以及**多维词汇记忆罗盘与艾宾浩斯复习 (Notebook)**。
2. **本次重构核心目标**：
   * 前端已在 AI Studio 基于 React 19 + TypeScript + Vite + Tailwind CSS + Dexie.js (IndexedDB) 构建完毕；
   * 用户指令：**“把后端搭建好，然后实现一个前后端一体的 app；第一步研究技术路线与数据库选型，强制要求联网与极速时效性”**；
   * 选型决策：放弃纯 BaaS（Supabase）因海外高延迟、无法跑网易云 Node 逆向算法的缺陷，选定 **统一 Node.js / Express 单体全栈服务 + SQLite (WAL模式) + Prisma ORM + SSE 流式直吐 + 词典/音频多级缓存**。

---

## 二、 三轮自我博弈 (Self-Play) 闭环记录

系统在全自动托管模式（`/goal`）下，由 Maker 与两位独立盲审员进行了 3 轮物理实证对抗：

| 评审员 | 第一轮盲审反馈 (Round 1) | Maker 第二轮重构与修复 (Round 2) | 第三轮终审判定 (Round 3) |
| :--- | :--- | :--- | :--- |
| **Critic 1<br>(架构与安全)** | 🚨 **REJECT**：<br>1. 多租户主键冲突（用户共用 song ID 崩溃）；<br>2. 弱口令与硬编码 JWT Secret；<br>3. 全局单 Guest 账号数据串扰；<br>4. SSRF 漏洞（允许探测内网）；<br>5. SQLite 单写锁死与 BigInt 序列化黑洞。 | ✅ 修复：<br>1. `Song`, `CustomPassage`, `CustomListening` 升级为 `@@id([userId, id])` 复合主键；<br>2. 生产环境锁定 `JWT_SECRET`，算法锁定 `HS256`；<br>3. `POST /api/auth/guest` 签发隔离独立会话；<br>4. 增加 `isSafeExternalUrl` 阻断内网与元数据探测；<br>5. 启用 `PRAGMA journal_mode = WAL` 与 5000ms 繁忙超时；<br>6. 注入 `BigInt.prototype.toJSON` 0开销序列化。 | 🟢 **【FINAL PASS】**<br>实机物理穿透断言全部通过，准予交付。 |
| **Critic 2<br>(时效性与业务)** | 🚨 **REJECT**：<br>1. `cloudSync` 缺超时易假死锁死；<br>2. 串行 1000 次 Dexie 事务造成主线程卡顿；<br>3. 缺乏墓碑机制致已删单词无限复活；<br>4. SSE 缺 `req.on('close')` 幽灵流消耗 Token；<br>5. 查词缓存未写入落盘；<br>6. 网易云音源串行 23s 挂起。 | ✅ 修复：<br>1. 部署 `AbortSignal.timeout(3000/6000)`；<br>2. 收拢为单事务 `bulkPut`；<br>3. 新增 `pendingDeletedWords` 与服务端 `deleteMany`；<br>4. 接入 `AbortController` 与 12 秒保活心跳；<br>5. 补齐 `wordDictionaryCache.upsert` 与 5000 条 LRU 淘汰；<br>6. 音频流缓存施加 300 条容量硬顶与 20 分钟 TTL；<br>7. `cycleWordMastery` 与 `bulkDeleteWords` 补齐同步触发器。 | 🟢 **【FINAL PASS】**<br>时效性与业务逻辑 100% 物理闭环，无条件放行。 |

---

## 三、 仓库物理落盘清单 (`D:\Git`)

* **后端服务与路由**：
  * `server.ts`：Express 4.22 核心服务，集成网易云音乐、Gemini AI、静态 SPA 托管与缓存控制
  * `src/server/prisma.ts`：Prisma 单例、SQLite WAL 初始化与 BigInt 序列化
  * `src/server/auth.ts`：JWT 鉴权、requireAuth 中间件与 SSRF 守卫
  * `src/server/routes/words.ts`：词汇批处理增量同步 (`/batch-sync`)
  * `src/server/routes/authRoute.ts`：用户注册、登录与访客令牌
  * `src/server/routes/ieltsRoute.ts`：雅思考卷与多租户自定义材料持久化
  * `src/server/routes/aiStream.ts`：SSE 实时流式打字机直吐端点
* **数据库持久化**：
  * `prisma/schema.prisma`：工业级 Prisma 数据模型定义
  * `prisma/dev.db`：物理 SQLite 数据库（已激活 WAL 读写分离）
* **前端与离线同步**：
  * `src/db/cloudSync.ts`：前端云端同步管理器（含超时防护、原子事务与墓碑防复活）
  * `src/db/index.ts`：Dexie 本地 IndexedDB 封装（已深度绑定云端触发器）
  * `src/App.tsx`：挂载云同步监听器与强制联网断网拦截提示
* **可执行脚本**：
  * `launch.bat`：双击一键启动一体化服务 (`http://localhost:3000`)
  * `dev.bat`：开发热重载启动脚本
