---
name: chatgpt-ui-design
description: "设计、实现或美化具有 ChatGPT 网页及桌面端视觉气质的前端界面。用于用户要求 ChatGPT 风格、极简 AI 工具风格、改善 AI 生成界面，或统一网页、Electron、Tauri、Qt/PySide、WPF、Flutter 等软件的颜色、字体、布局、按钮、图标、侧栏、输入框和交互状态。支持对话、工作区、列表、设置、表单等页面及浅深色主题；交付可运行界面并做视觉与交互验收。"
---

# ChatGPT 风格前端设计

将“克制、中性、文字优先、内容居中、工具退后”的视觉语言落实到可运行软件。默认使用中文沟通，沿用产品的内容语言。将本包视为完整的风格基线；让用户的截图、明确偏好和已有产品约束优先。

## 执行顺序

1. **查看工程和现状。** 识别框架、启动命令、组件库、现有 token、页面和实际功能。修改旧项目时，先运行并保留基准截图；保留路由、数据、权限和业务逻辑。仅改指定区域时，不扩散成整站重写。
2. **确定页面类型。** 从对话、工作区、列表／数据、设置／表单中选主类型。用一句话说明平台、主题和布局假设后开工；只有缺失信息确实阻断实现时再提问。不要为做界面先要求用户填写设计问卷。
3. **读取视觉基线。** 必读 [视觉系统](references/visual-system.md) 和 [组件规范](references/components.md)。采用 [tokens.css](assets/tokens.css) 中的语义变量。保留现有变量 API 时，建立映射，不并存两套互相竞争的全局规则。
4. **选择平台适配。** 必读 [布局与平台](references/layouts-and-platforms.md) 中对应章节。网页及 WebView 读取 [primitives.css](assets/primitives.css)；原生桌面读取其中的原生映射，并使用 `scripts/export_theme.py` 导出所需主题。不要为了套 CSS 把用户的原生软件改成网页壳。
5. **先搭骨架。** 先确定窗口／画布、侧栏、头栏、内容宽度、滚动区和主要操作，再落文字、控件和细节。使用真实产品文案及符合业务的数据形状。不要先堆卡片再寻找用途。
6. **接通交互。** 按 [交互与可访问性](references/interaction-and-a11y.md) 完成鼠标、键盘、触屏和关键状态。用户可见的按钮必须有明确结果；演示数据或模拟后端必须如实标识。
7. **运行并看图。** 按 [验收规则](references/quality-gates.md) 检查浅色、深色、窄屏和主要状态；检查实际截图、对齐、字形及遮挡。修复后再交付。无法运行的部分明确说明，不能把代码检查说成视觉验证。
8. **简短交付。** 说明实际改动、运行方式、已验证的状态与剩余限制。让界面承担视觉表达，不在产品界面里写设计说明、技术选型或实现教程。

## 不可丢失的风格约束

- 让中性色占据绝大部分界面；浅色用白／浅灰，深色用炭灰。默认主操作使用黑白反转，有业务语义时再用颜色。
- 将装饰、色块和阴影压到最低。禁止默认套用紫蓝渐变、大面积玻璃拟态、发光边框、巨型营销标题、每项一张悬浮卡片和彩色图标九宫格。
- 以 `14px` 结构文字、`16px` 内容文字为默认层级；中文同样保持可读大小。让行高、字重和间距建立层次，不把辅助文字淡到难以辨认。
- 统一单色线性图标、圆角、按钮高度和对齐基线。图标使用 `currentColor`；优先复用工程现有的一套图标库，缺失时再用 [icons.svg](assets/icons.svg)。不要混用 emoji、图片截图和不同笔画的图标。
- 让侧栏安静、主内容宽度有上限、关键操作易发现。普通列表保持列表，设置保持设置；不要把所有软件都改成聊天机器人。
- 保留用户产品自己的名称和标识。品牌标识与工具图标分开处理；详见视觉系统的“图标与标识”。
- 不把这里的工程基线描述为“当前 ChatGPT 的精确官方 CSS”。用户要求某一版本的精确复刻时，先核对其截图和平台，再调整；参考出处见 [来源与边界](references/sources.md)。

## 资源选择

| 需求 | 使用资源 |
| --- | --- |
| 所有界面 | `references/visual-system.md`、`references/components.md`、`assets/tokens.css` |
| 网页、Electron、Tauri | `references/layouts-and-platforms.md`、`assets/primitives.css` |
| Qt/PySide、WPF、Flutter、SwiftUI | 布局与平台的原生章节、`scripts/export_theme.py` |
| 交互、键盘和移动端 | `references/interaction-and-a11y.md` |
| 截图检查、交付前验收 | `references/quality-gates.md`、`scripts/check_tokens.py` |
| 查看完整风格和控件状态 | `assets/reference.html`；保持同目录的 CSS 与 SVG 可访问 |
| 核对风格是否适用于新场景 | `references/evaluation-prompts.md` |
| 用户询问参考来源或要求最新样式 | `references/sources.md`；按需重新核对官方来源 |

## 快速落地

Web：先映射 `tokens.css`，再复用 `primitives.css` 的按钮、侧栏、表单和文字基础。作用域使用 `.cg-app`，避免覆盖宿主站点。让 `<html data-theme="light|dark">` 决定整套主题；未设置时跟随系统。复用到已有 CSS 系统时保留语义角色及尺寸关系，无需逐行复制。

原生：以 `python scripts/export_theme.py --theme dark --format qss --out /目标路径/theme.qss` 导出 Qt 主题，或用 `--format xaml` 导出 WPF 资源、`--format json` 导出通用设计变量。保留原生布局、字体缩放及控件语义，按平台章节完成样式接线。

校验：运行 `python scripts/check_tokens.py` 检查本包调色板的关键对比度。该脚本不验证应用中的实际颜色、布局或无障碍行为；仍须运行应用、查看截图并操作界面。
