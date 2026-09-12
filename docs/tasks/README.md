# 开发任务、待办清单与里程碑管理 (Development Tasks & Milestones)

本目录归口管理 `DSH Let Them Cook` 的所有开发任务、阶段迭代计划、待办清点（TODO）与演进全景。

---

## 核心任务文档

| 文档 | 说明 |
| :--- | :--- |
| **[TODO.md](./TODO.md)** (或查看 [根目录 docs/TODO.md](../TODO.md)) | 全局待办任务清单、P0~P94 迭代进展与已完成状态记录。 |
| **[roadmap.md](./roadmap.md)** | 项目产品化路线图、中长期技术演进与生态对齐方案。 |
| **[milestones-index.md](./milestones-index.md)** | P1~P94 迭代里程碑全景索引表，含每个阶段的目标与验证方式。 |

---

## 任务执行与验收规范

1. **先列计划再开干**：复杂任务严格拆解入 `docs/TODO.md`；
2. **任务与单测绑定**：每个开发任务必须编写对应的验收测试脚本，统一放置于 `__tests__/test-*.cjs` 目录；
3. **矩阵回归验证**：任务完成后必须通过 `npm run test:matrix` 全矩阵 90+ 套单测验证与 `npm run preflight` 发版红线检查；
4. **经验沉淀宪章**：踩坑或重大修复必须及时提炼进 `AGENTS.md` 与 `docs/agents/`。
