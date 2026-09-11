# P11 — 发布前清理与预检

## 目标

把连续开发阶段留下的临时 patch 脚本清理掉，并增加发布前稳定性预检，避免根目录文档污染、临时文件残留、关键脚本缺失或再次引入会挤压官方主视图的 CSS。

## 已完成

- 清理 `docs/_patch*` 临时开发脚本。
- 新增 `scripts/release-preflight.cjs`。
- 新增 `npm run preflight`。
- 预检内容：根目录文档纯洁性、Docs 临时文件、P0-P10 关键产物、package 脚本、compat 防回归、HUD 布局防回归、关键交互文案。

## 命令

```powershell
npm run preflight
npm run test:matrix
npm run smoke:api
```
