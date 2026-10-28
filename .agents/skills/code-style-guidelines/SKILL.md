---
name: code-style-guidelines
description: Mandatory code style, TypeScript conventions, Vanilla CSS guidelines, Dexie.js database patterns, and React component structure for the ContextEng project across all AI chat sessions.
---

# ContextEng — Code Style & Formatting Guidelines

> ⚠️ **跨 Session AI 协同铁律**：所有新开对话窗口在生成、修改本项目代码时，必须 100% 遵守本规范。

---

## 1. 📁 目录与文件组织规范 (Directory Layout)

```text
src/
├── components/     # React 视图组件（按功能模块划分，PascalCase 命名）
├── db/             # Dexie.js 本地数据库定义 (db.ts, schema.ts, hooks.ts)
├── styles/         # Vanilla CSS 变量与基础样式 (tokens.css, glass.css, reset.css)
├── types/          # 全局 TypeScript 接口单源真相 (schema.ts)
├── services/       # 外部 API / AI Adapter / 音频 LRC / AR 相机解耦服务
├── utils/          # 纯函数工具类 (格式化、时间戳、二进制计算)
└── App.tsx         # 双端响应式主入口
```

---

## 2. 📘 TypeScript & Prettier 编码规范 (Code Formatting)

* **缩进与引号**：
  * 使用 **2 空格缩进**。
  * TS/JS 代码内部统一使用 **单引号 `'...'`**；JSX 属性统一使用 **双引号 `"..."`**。
  * 语句末尾保留 **分号 `;`**。
* **严格类型约束 (No `any`)**：
  * 严禁使用 `any` 类型。必须在 `src/types/schema.ts` 中定义明确接口。
  * 异步状态统一使用联合类型 (Discriminated Unions)：
    ```typescript
    type AsyncState<T> = 
      | { status: 'idle' }
      | { status: 'loading' }
      | { status: 'success'; data: T }
      | { status: 'error'; error: string };
    ```
* **函数签名**：
  * 导出的核心工具函数与数据库查询函数，必须标注**显式返回值类型**。

---

## 3. ⚛️ React & Dexie.js 组件设计规范 (React & State Patterns)

* **组件写法**：
  * 统一使用具名函数 (Named Function Component) 定义组件：
    ```typescript
    export function WordCard({ word, onBookmark }: WordCardProps) { ... }
    ```
* **Single Source of Truth (唯一真实数据源)**：
  * 避免在 React `useState` 中二次复制 IndexedDB 的数据。
  * 数据库状态统一通过 `dexie-react-hooks` 的 `useLiveQuery` 实时订阅：
    ```typescript
    import { useLiveQuery } from 'dexie-react-hooks';
    import { db } from '../db';

    export function WordList() {
      const words = useLiveQuery(() => db.words.orderBy('createdAt').reverse().toArray());
      if (!words) return <LoadingSpinner />;
      return <div>{words.map(w => <WordCard key={w.id} word={w} />)}</div>;
    }
    ```
* **副作用与资源清理**：
  * 所有的 `useEffect`（包括音频 `timeupdate` 监听、WebRTC 相机 Video 轨道、Resize 监听）**必须包含 Cleanup 撤销清理函数**，防止内存泄漏。

---

## 4. 🎨 Vanilla CSS & Glassmorphism 样式规范 (Styling Spec)

* **纯 Vanilla CSS + CSS 变量**：
  * 禁止硬编码颜色和 Shadow。所有数值必须引用 `src/styles/tokens.css` 中定义全局变量。
* **命名规范 (BEM 风格与 kebab-case)**：
  * 类名统一使用小写中划线 `kebab-case`（如 `.word-card`, `.word-card__header`, `.word-card--active`）。
* **Glassmorphism 玻璃拟态统一 Standard**：
  ```css
  .glass-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
    border-radius: var(--radius-lg);
  }
  ```

---

## 5. 🛡️ 异常处理与防御性编程 (Error Handling)

* 所有的 Dexie 事务与 API 调用必须包裹在 `try / catch` 块中。
* 渲染空状态（如尚未录入任何单词、未上传歌词）时，必须呈现干净美观的空状态 UI（Empty State），严禁出现 `undefined` 或 `null` 崩溃白屏。
