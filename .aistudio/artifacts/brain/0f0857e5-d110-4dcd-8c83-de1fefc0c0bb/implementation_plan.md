# AR 实景空间首次引导与底部快门按钮视觉重构方案

## 1. 现状问题与改进目标
- **首次引导弹窗突兀**：当前引导卡使用了高不透明度的米白底色（`bg-[#FAF8F5]/95`），悬浮在深色取景画面中显得生硬割裂，且排版像普通系统弹窗。
- **中间快门按钮像靶心**：底部中央按钮使用了实心浅白圆底叠加内部细线圈，既缺乏明确的“拍照”语义，又与左右两侧通透的磨砂玻璃圆形按钮风格脱节。

---

## 2. 核心设计改动

### A. 暗色磨砂玻璃取景器引导卡 (`src/components/ARSpace/ARCameraPanel.tsx`)
1. **通透光学 HUD 质感**：
   - 将引导容器改为深色磨砂玻璃材质（`bg-stone-950/65 backdrop-blur-2xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.55)]`），四角辅以纤细的光学取景角标装饰，自然融入相机画面。
2. **沉浸式单图样张预览**：
   - 样张区域内嵌在暗色玻璃框中，叠加柔和暗角渐变与精致的玻璃态浮动词卡预览点（`Laptop · /ˈlæptɒp/`、`Coffee Mug · /ˈkɒfi mʌɡ/`），直观传达“拍下物品自动浮现双语词卡”的交互效果。
3. **精炼操作区与消隐选项**：
   - 主按钮采用通透翠绿微光玻璃按钮（带微距相机/星芒图标）：“试一试这张桌面样张”。
   - 底部次级操作区采用轻量暗色胶囊分栏：`此次关掉`（仅当前会话隐藏）与 `以后都关掉`（写入 `localStorage` 永久隐藏），视觉干净克制。

### B. 磨砂玻璃外环 + 相机线框图标快门 (`src/components/ARSpace/ZenShutter.tsx`)
1. **统一磨砂玻璃视觉语言**：
   - 摒弃原有的实心米白圆盘与靶心内圈。
   - 外环采用与左右按钮同色系的双层光学磨砂环（`w-16 h-16 rounded-full bg-white/12 backdrop-blur-2xl border border-white/35 p-1.5`），悬停与按压时呈现细腻的呼吸缩放反馈。
2. **中心内芯与相机线框图标**：
   - 内芯采用高透亮面玻璃层（`w-full h-full rounded-full bg-white/20 border border-white/40 flex items-center justify-center`），正中央放置清晰的 `Camera` 线框图标（配翠绿/纯白光学点缀），一眼即可识别拍照意图，同时与左侧“相册导入”、右侧“翻转镜头”形成浑然一体的三联底部控制栏。

---

## 3. 涉及文件
- `src/components/ARSpace/ARCameraPanel.tsx`：重构首次进入引导层 UI 结构与暗色磨砂玻璃样式。
- `src/components/ARSpace/ZenShutter.tsx`：重构底部中央拍照快门按钮为磨砂玻璃外环配 `Camera` 线框图标。
