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

## 文件边界

Todo 存在一张表里：`todos(id, title, done)`，只有 `lib/store.js` 读写它。
新功能只新增文件，启动时按文件自动加载：

- `routes/*.js`：导出 `{ 'GET /path/:id': handler }`。handler 收到 `{ store, filters, features, params, query, readJson }`，返回 `{ status, headers, json }` 或 `{ status, headers, body }`，出错时抛 `HttpError`。
- `filters/<参数>.js`：导出 `(todos, value) => todos`，处理 `GET /api/todos?<参数>=`。
- `public/features/*.js`：网页功能，`import app from '/app.js'`，可用的接口见 `public/app.js` 开头。
- `checks/*.js`：导出 `{ '名称': async ({ request, restart, url }) => {} }`，断言失败就抛错。每个检查用自己的服务和临时数据库。
