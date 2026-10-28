# 🎵 Lyricalens (歌词透镜)

<div align="center">

**Smart Lyric Synchronization, Cambridge IELTS Corpus & Local-First Language Immersion Suite**  
*智能音乐双语歌词精读 · 雅思真题学术语料泛听 · 本地优先离线沉浸式语言学习系统*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android%20Native-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-Local--First%20DB-FFA726)](https://dexie.org/)

[English](#english) | [中文说明](#中文说明)

</div>

---

<a name="中文说明"></a>
## 📖 核心特性 (Features)

* **🎵 智能歌词同步与逐词精读 (Smart Lyric Synchronization)**
  * 毫秒级精度 LRC 歌词滚动与高亮渲染，支持双语对照、音标标注与词性切分。
  * 歌词内任意词汇“点击即查、长按即收录”，无缝沉淀至个人生词本。
* **📚 剑桥雅思官方语料与泛听精析 (Cambridge IELTS Corpus)**
  * 内置剑桥官方学术听力与阅读语料库，考点高频词标色高亮与真题例句关联检索。
  * 听力回放、单句跟读、错题考点自动诊断与阶段复习评估。
* **📱 Android 原生伴侣端 (Native Android Companion)**
  * 基于 Capacitor 7 深度封装的工业级 Android 原生工程，支持物理返回键劫持、后台音频播放与离线包预载。
  * 手机端与桌面端体验一致，提供开箱即用的 `.apk` 编译构建链。
* **⚡ 本地优先与离线架构 (Local-First Architecture)**
  * 深度集成 **Dexie.js (IndexedDB)**，核心数据本地常驻，零延迟瞬时渲染与离线运行。
  * 支持墓碑删除机制（Tombstone Deletion）与可选的双向云端多租户同步。
* **🔐 音乐生态接入与离线漫游 (Music Platform Sync)**
  * 支持网易云音乐扫码/验证码授权绑定，安全抓取个人歌单与喜爱歌曲进入本地高可用缓存。
* **👁️ AR 空间生词标记 (AR Vocabulary Tagging)**
  * 摄像头实时取景与空间三维标签联动，搭配遗忘曲线 Mastery Ring 掌握度环与 Zen Shutter 手势交互。

---

## 🏛️ 系统架构 (Architecture)

```
[客户端 (React 19 + TypeScript + Dexie.js Local-First)]
   │
   ├── (1) 0ms 本地乐观更新 ───> Dexie.js (IndexedDB) 离线持久化
   ├── (2) 音频与 LRC 解析引擎 ─> 精确时间戳对齐 + 动态双语标注
   ├── (3) 雅思学术语料库 ──────> 剑桥真题词汇索引 + 考频动态关联
   └── (4) Capacitor 桥接层 ───> 原生 Android 运行时 (MainActivity.java)
             │
[服务端 (Express + Prisma + SQLite WAL)]
   ├── 代理与网关: 网易云音乐 API 代理缓存 + 安全跨域透传
   ├── 高并发数据库: SQLite WAL 模式，busy_timeout=5000ms
   └── AI 流式接入: 兼容 Google Gemini / DeepSeek 词义流式推演
```

---

## 🚀 极速启动指南 (Quick Start)

### 1. 环境准备 (Prerequisites)
* Node.js >= 18.0.0
* pnpm (推荐) 或 npm

### 2. 本地开发 (Local Development)
```bash
# 1. 克隆代码仓库
git clone https://github.com/Gek1t/Lyricalens.git
cd Lyricalens

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local

# 4. 启动前端热重载开发服务器
npm run dev
```

### 3. 全栈一体化运行 (Fullstack Server)
```bash
# 启动 Express 服务端（托管前端并代理后端接口，默认端口 3000）
npm run build
node server.ts
# 或直接双击运行 launch.bat
```

### 4. 编译 Android 原生 APK (Android Build)
```bash
# 同步前端构建资产至 Android 工程
npm run build
npx cap sync android

# 进入 Android 目录并打包 Debug APK
cd android
./gradlew assembleDebug
# 输出路径: android/app/build/outputs/apk/debug/app-debug.apk
```

---

<a name="english"></a>
## 🌐 English Overview

**Lyricalens** is an open-source, local-first immersion language learning workstation and music companion. It seamlessly transforms everyday music listening and academic listening practice into interactive, context-aware vocabulary acquisition.

### Key Highlights
* **Zero Latency**: Powered by Dexie.js for instant UI updates and complete offline functionality.
* **Academic Corpus**: Integrated Cambridge IELTS exam corpus with automated vocabulary difficulty tagging.
* **Cross-Platform**: Modern web application built with React 19 + Vite, accompanied by an Android native app powered by Capacitor.
* **Extensible AI**: Ready for Gemini 2.0 / DeepSeek API integration for contextual sentence explanations and collocation mining.

---

## 🛡️ 免责声明 (Disclaimer)

1. **非商业用途声明**：本项目（Lyricalens）为开源学术与个人学习研究项目，严禁用于任何商业牟利行为。
2. **版权归属声明**：本软件涉及的第三方音乐平台接口、歌曲音频、专辑封面及歌词文本等数字资产，其知识产权与版权均归属原音乐平台（如网易云音乐）及相关权利人所有。
3. **接口合规声明**：本项目的第三方登录与歌词解析功能仅供个人合规获取公开歌词及私人歌单离线学习使用，用户须自行遵守相关平台的用户协议。

---

## 📄 开源许可证 (License)

本项目基于 [MIT License](LICENSE) 开源发布。欢迎提 Issue、PR 与 Star 支持！
