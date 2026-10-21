# 来源与边界

核对日期：2026-10-19。将本包作为稳定的设计基线，不追随每次版本更新机械改值。只有用户要求“最新”或指定截图时才重新核对相应界面。

| 参考 | 用于哪些判断 | 边界 |
| --- | --- | --- |
| [OpenAI UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines) | 中性色、系统字体、一致间距、单色线性图标、可访问性；已查看其 Color、Typography 与 Icons 图示 | 面向 ChatGPT 内嵌 UI，不能将宿主专用布局规则直接套给所有独立产品 |
| [颜色示意图](https://developers.openai.com/images/apps-sdk/color.png) | 浅／深色的背景和文字层级 | 设计示意，不是当前各客户端的完整内部 token 表 |
| [ChatGPT desktop app](https://learn.chatgpt.com/docs/app) | 多项目、文件与工作区的桌面产品背景 | 不提供本包所有尺寸和颜色的官方数值 |
| [Desktop settings](https://learn.chatgpt.com/docs/app/settings) | 平台快捷键与偏好可配置的产品方向 | 本包的快捷键与布局默认值允许按用户产品调整 |
| [OpenAI design guidelines](https://openai.com/brand/) | 区分品牌资产、标识与界面字体 | 品牌字体说明不证明每个平台实际 UI 使用同一种字体 |

本包自行定义了 `--cg-*` 命名、侧栏宽度、文字规格、组件尺寸、断点和应用基线颜色；其中部分颜色与公开示意相近。这些均不应被描述成对私有实现的提取或官方精确复刻。以用户提供的截图和可运行工程为最直接的任务依据。

若环境缺少联网能力，继续使用已附的 token 和规范，并说明没有重新核对指定版本；不要猜测不可见客户端的新变化。不要把需要联网抓取私有样式作为普通开发任务的前置条件。
