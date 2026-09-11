# 发版记录与发布检查清单 (Releases & Checklists)

本目录归档 `DSH Let Them Cook` 的版本发布说明、发版红线预检与 Git 提交规范清单。

---

## 核心发版文档

| 文档 | 说明 |
| :--- | :--- |
| **[git-release-checklist.md](./git-release-checklist.md)** | Git 提交与发版检查清单（前置状态、全矩阵验证、忽略规则与 Git 命令）。 |
| **[release-alpha-0.1.0.md](./release-alpha-0.1.0.md)** | v0.1.0 首发版本里程碑说明与核心特性概览。 |

---

## 发版硬性门禁

每次提交代码或发布版本前，必须在本地依次执行并全部通过：

1. `npm run typecheck` — TypeScript 静态类型检查通过
2. `npm run build:all` — Host 端与 Web Client 端制品构建成功
3. `npm run test:matrix` — 自动化测试矩阵 50+ 项 100% PASS
4. `npm run preflight` — 发版红线检查 0 报错
5. Commit 提交信息必须**严格使用地道纯英文** (Conventional Commits)
