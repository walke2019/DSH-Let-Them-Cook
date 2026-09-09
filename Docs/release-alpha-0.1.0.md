# 发布准备说明 — dsh-group-chat 0.1.0 Alpha

日期：2026-09-08

## 当前发布定位

`@dsh-external/dsh-group-chat` 当前适合作为 Alpha 版本发布/自用验证：

- 已具备插件化 DSH 接入、群聊 UI、角色主题、工作流、工具路由、assignment/mailbox、任务 DAG、模型推荐、兼容层与测试矩阵。
- 仍不定位为生产级 durable agent framework；持久子 Agent session、跨阶段全局 DAG、Playwright UI 冒烟测试与 marketplace 正式元数据仍在后续版本。

## 已具备的插件元数据

`package.json` 当前包含：

- name: `@dsh-external/dsh-group-chat`
- version: `0.1.0`
- main: `./lib/index.js`
- client export: `./lib/client.js`
- dsh.client.inject 配置
- scripts:
  - `npm run typecheck`
  - `npm run build:all`
  - `npm run test:matrix`
  - `npm run smoke:api`

## 发布前本地验证命令

```powershell
npm run test:matrix
npm run smoke:api
```

通过标准：

- `TEST_MATRIX_EXIT:0`
- `API_SMOKE_EXIT:0`

## 当前兼容边界

- 兼容层只读取能力，不直接访问 `ctx.version` 等未注入属性，避免 Cordis loader 报错。
- 模型目录不可用时返回空列表与 warning，前端仍可手动输入模型 ID。
- 工具注册表不可枚举时，保持原白名单名称传入 `tools.restrict()`。
