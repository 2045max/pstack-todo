# pstack-todo

一个零依赖的 Todo 网站，用来演示 pstack 的完整流程：issue → PR → 验证 → 合并 → 发布。

## 需求

- 网页可以添加、勾选、删除、筛选 Todo，并导出 CSV。
- 数据存 SQLite，重启后还在。
- 只用 Node 24 内置模块（`node:http`、`node:sqlite`），不装任何 npm 包。

## 约定

- 启动：`node server.js`
- `PORT`：端口，默认 3000。只监听 `127.0.0.1`。
- `DB_PATH`：数据库文件，默认 `todo.db`。
- `./verify.sh`：用空闲端口和临时数据库启动真实服务，发 HTTP 请求检查，全过返回 0。结束时关闭服务并删除临时文件。
- CI 在每个 PR 和 `main` 上运行 `./verify.sh`。
- Todo 的 JSON 格式：`{"id": 1, "title": "买牛奶", "done": false}`
