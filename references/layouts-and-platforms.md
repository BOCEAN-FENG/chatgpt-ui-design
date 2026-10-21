# 布局与平台

## 按内容选择布局

| 场景 | 骨架 | 内容宽度与密度 |
| --- | --- | --- |
| 对话 | 侧栏＋主对话＋底部输入 | 对话列基准 `760px`；没有助手气泡墙 |
| Agent／创作工作区 | 侧栏＋任务／编辑主区域＋按需 inspector | 主区域优先占空间；信息面板宽约 `320–400px`，空间不足转抽屉或 Tabs |
| 项目／文件／任务列表 | 侧栏＋标题与工具栏＋列表／表格 | 默认最大宽约 `1120px`；密集工具可流式填满主区，不强限为对话宽度 |
| 设置／表单 | 分类导航＋设置内容 | 主表单约 `640–800px`；按组排列，不逐项大卡片化 |

大屏保持合理行长；长文、编辑器、预览可按内容扩大，不把所有主内容限定成细长的一列。小屏优先保留主要任务与操作，再收起次要面板。

## 网页、Electron 与 Tauri

- 使用一份语义 token 和组件层。优先原工程框架及成熟控件；使用 Tailwind 时把 `--cg-*` 映射到项目主题，避免每个节点散写近似 hex 值。
- 使用 Flex/Grid 管理壳体；根高度采用 `100dvh` 并提供适用回退。确保主容器 `min-width: 0; min-height: 0`，明确每个滚动区，避免父子同时无意滚动。
- `>=1024px`：默认侧栏常驻，可折叠。`640–1023px`：默认收为可开关抽屉。`<640px`：单主区、`16px` 页面边距、触屏控件至少 `44px`。以实际可用宽度复核，而非只依赖设备名称。
- 三列工作区至少为主区留约 `560px`；不够时先收起 inspector。不可把 `260+560+360px` 的三列硬挤进 `1024px`。
- 网页不画一套假的桌面红黄绿按钮。Electron／Tauri 优先保留原生标题栏；若工程已使用自定义标题栏，复用框架实际窗口 API，遵守操作系统的按钮位置和系统菜单行为。
- 仅让空白标题栏区域可拖动；按钮、输入、菜单及链接必须在非拖动区域。考虑双击最大化、最大化后的窗口边缘、任务栏／Dock 和多显示器缩放。
- 对 Windows 的 DPI 125%／150%、macOS Retina、窄窗口和窗口恢复后的尺寸做检查。不要把 CSS 像素等同于屏幕物理像素，也不要硬编码整页缩放来“适配”。
- 本包的 `reference.html` 可用标准静态服务器打开。`?platform=desktop` 仅展示额外的桌面标题安全区，不声称已经实现系统窗口管理。

## 原生桌面映射

保留现有框架，用同一组颜色、密度和布局关系实现平台控件。CSS 仅是语义设计变量的载体，不要求原生程序执行 CSS。

| 设计角色 | Qt / PySide6 | WPF / WinUI | Flutter | SwiftUI |
| --- | --- | --- | --- | --- |
| 颜色语义 | QPalette＋QSS | ResourceDictionary / ThemeResources | ThemeData / ColorScheme / ThemeExtension | Color 资源与环境主题 |
| 主布局 | QSplitter / QBoxLayout | Grid / SplitView | Row / Expanded / NavigationRail | NavigationSplitView / HStack |
| 内容列上限 | setMaximumWidth＋居中布局 | MaxWidth＋HorizontalAlignment | ConstrainedBox＋Align | frame(maxWidth:) |
| 字体 | QFont＋系统回退 | 系统字体＋DynamicResource | TextTheme＋本地回退 | 系统 Font / Dynamic Type |
| 图标 | 同一套 SVG 的 QIcon，主题切换更新颜色 | 一套矢量 Geometry / SVG | 一套矢量图标 | SF Symbols 或一致自绘符号 |
| 焦点与语义 | 原生 focusPolicy / accessibleName | AutomationProperties / FocusVisualStyle | FocusNode / Semantics | accessibilityLabel / FocusState |
| 尺寸 | Qt 逻辑像素，保留高 DPI 支持 | DIP | logical pixels | points |

优先系统字体与原生窗口管理。将侧栏、内容、表单、菜单、tooltip 都纳入主题，不能只把主背景改深色。检查系统文件选择器、滚动条、弹窗及禁用态与主题是否相容。

### Qt / PySide 实施

运行 `python scripts/export_theme.py --theme light --format qss --out /目标路径/light.qss`，深色同理。将导出样式作用于指定应用或根窗口，并设置组件对象名／属性：

```python
sidebar.setObjectName("cgSidebar")
composer.setObjectName("cgComposer")
send_button.setProperty("cgRole", "primary")
# 在创建完控件后应用主题；使用 UTF-8 读取导出的 QSS。
root_window.setStyleSheet(theme_qss)
```

导出样式覆盖基本窗口、侧栏、按钮、输入、列表、菜单和 tooltip。为树视图、复杂表格和自定义绘制控件补充项目专属状态；保留 Qt 的原生控件语义。QSS 的 SVG 不自动可靠继承网页 `currentColor`，应将图标前景替换为当前主题色并在切换时重新创建 QIcon。用布局的 stretch、margin、spacing 控制几何关系，不绝对定位整页。

同时映射 QPalette，让未自定义绘制的控件也能跟随主题。将 JSON 导出的 `colors` 读为 `colors` 字典后，在切换主题时更新：

```python
from PySide6.QtGui import QColor, QPalette

palette = app.palette()
for role, token in {
    "Window": "canvas", "WindowText": "text", "Base": "canvas",
    "AlternateBase": "surface", "Text": "text", "Button": "surface",
    "ButtonText": "text", "Highlight": "selected", "HighlightedText": "text",
    "ToolTipBase": "overlay", "ToolTipText": "text", "PlaceholderText": "muted",
}.items():
    palette.setColor(getattr(QPalette.ColorRole, role), QColor(colors[token]))
for role in (QPalette.ColorRole.Text, QPalette.ColorRole.WindowText,
             QPalette.ColorRole.ButtonText):
    palette.setColor(QPalette.ColorGroup.Disabled, role, QColor(colors["disabled"]))
app.setPalette(palette)
```

保留应用的系统字体和用户文字缩放策略；需要大字模式时统一调整主题字号与控件最小尺寸，不能只缩放截图。

### WPF / WinUI 实施

运行 `--format xaml` 导出 WPF 的 Color 与 SolidColorBrush 资源；合并进 `Application.Resources`，控件 Style/Template 使用 `DynamicResource CGCanvasBrush`、`CGTextBrush`、`CGActionBrush` 等。导出的是 WPF 资源，不是跨 WPF／WinUI 通用的完整控件皮肤；WinUI 按其 ThemeDictionaries 结构映射同名语义色。

原生应用必须实际绑定 normal／pointer-over／pressed／disabled／focus 的控件状态；仅导入颜色不能宣称完成主题。不要为改变外观移除 AutomationPeer、键盘导航或最小窗口尺寸约束。

### Flutter / SwiftUI 及其他原生框架

运行 `--format json` 获得颜色和度量。将颜色映射到本地主题对象，把 CSS 字体栈转换成平台系统字体及可用回退，不原样塞入不接受 CSS 的字段。Flutter 使用 ThemeExtension 保存侧栏、内容等业务角色；SwiftUI 使用 Asset Catalog 或动态 Color；保留各平台文字缩放及标准控件交互。

## ChatGPT 内嵌组件的边界

如果实际任务是 ChatGPT Apps／插件的内嵌 UI，优先继承宿主 token 和已有 `@openai/apps-sdk-ui`，按官方 UI guidelines 实现。不要在内嵌 widget 里重复造宿主侧栏、账户、聊天输入框或导航壳。独立产品才使用本包完整壳体；不要为普通产品强制引入只为嵌入宿主而设计的 SDK。
