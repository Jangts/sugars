# 项目协作约定

本仓库使用 npm workspaces 管理 `packages/*`。在根目录安装和构建，使用根 `package-lock.json`。保留已有工作区和暂存区改动。

从 [项目文档](docs/README.md) 进入。接口、代码组织和文档遵守本项目规范。全面检查、专项检查和修复复查使用全局 `$comprehensive-code-review`，自动读取 [项目检查入口](docs/review-entrypoints.md)。历史背景、迁移对照及验证证据归位于 [维护资料](docs/maintenance/README.md)。

维护工作以原模块的源码、调用方式和行为为基线。编辑器使用原生 DOM，Web Component 直接复用编辑器包。图表保留原系列、比例尺和交互的语义，按实际职责组织代码。原始 TangramJS 与 Interblocks 作为历史原件保留，移植在本仓库进行。

发布访问级别以各包的清单为准。实际 npm 发布按当前任务的授权执行。历史代码和素材的来源与许可分别记录，随包交付前核对实际包体。
