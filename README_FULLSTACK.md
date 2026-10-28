# 🌟 Lyricalens 前后端一体化全栈应用架构文档

本项目已完成从纯前端客户端沙箱到**“工业级前后端一体化全栈架构”**的完整升级与工程落盘。

---

## 🚀 极速启动指南

### 1. 生产一体化模式（推荐，单端口零跨域）
直接双击运行：
```bat
d:\单词识别软件\app\launch.bat
```
或在终端执行：
```bash
cd d:\单词识别软件\app
node dist/server.cjs
```
* **访问入口**：打开浏览器访问 `http://localhost:3000`
* **PWA 安装**：在 Chrome / Edge 地址栏点击“安装”按钮，即可一键将应用安装到桌面作为独立原生窗口运行。

### 2. 开发热重载模式
```bash
cd d:\单词识别软件\app
corepack pnpm dev
```

---

## 🏛️ 系统架构与核心技术指标

```
[前端客户端 (React 19 + Vite PWA + Zustand)]
   │
   ├── (1) 0ms 乐观更新 ───────> 界面即时响应，操作无卡顿
   │
   ├── (2) 实时流式连接 (SSE) ─> /api/ai/stream/stream-generate (首字 ~200ms)
   │
   ├── (3) 增量双向同步 ───────> /api/words/batch-sync (单事务 bulkPut + 墓碑删除)
   │
   └── (4) 统一 Express 服务端 (端口 3000，托管静态 SPA + 代理网易云/AI)
             │
             ├── [SQLite (WAL 模式) + Prisma ORM] (busy_timeout=5000ms，多租户隔离)
             ├── [词典 Cache-Aside 高速缓存] (LRU 5000 条上限，TTL 30天)
             └── [音频流防爆缓存] (LRU 300 条容量硬顶，TTL 20分钟)
```

---

## 🛡️ 核心安全与时效性保障清单

1. **多租户复合主键隔离**：`Song`、`CustomPassage`、`CustomListening` 均采用 `@@id([userId, id])`，不同用户收藏相同歌曲或录入同名试题绝对互不冲突、无法跨租户越权篡改。
2. **SSRF 安全防护**：`/api/ai/test-connection` 强制执行 `isSafeExternalUrl` 校验，全面阻断 `127.0.0.1`、`169.254.169.254`（云元数据）与私有网段探测。
3. **SSE 幽灵流自动回收**：客户端断开瞬间自动触发 `AbortController.abort()` 阻断上游 Token 消耗，注入 12 秒 `: keep-alive` 保活帧防止中间代理切断连接。
4. **SQLite 工业级高并发配置**：服务启动即自动注入 `PRAGMA journal_mode = WAL;` 与 `PRAGMA busy_timeout = 5000;`，彻底杜绝并发写死锁崩溃。
5. **墓碑删除防复活**：前端记录 `pendingDeletedWords`，服务端执行物理 `deleteMany`，彻底杜绝已删单词在下次同步时复活。
