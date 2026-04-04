# 🃏 多人联机纸牌游戏

基于 **Node.js + Socket.IO**（后端）和 **原生 HTML/CSS/JS**（前端）构建的实时多人扑克对战平台。

---

## 项目结构

```
yx/
├── backend/          ← Node.js + Socket.IO 服务端
│   ├── server.js
│   ├── game/
│   │   ├── GameManager.js   # 房间总调度
│   │   ├── Room.js          # 房间逻辑
│   │   ├── Deck.js          # 52张牌组管理
│   │   └── rules/
│   │       └── BaseRule.js  # 规则引擎接口（待实现）
│   ├── package.json
│   └── railway.toml         # Railway 部署配置
│
└── frontend/         ← 静态前端
    ├── index.html    # 大厅
    ├── game.html     # 游戏室
    ├── css/
    │   ├── style.css
    │   └── game.css
    ├── js/
    │   ├── config.js   # 服务器地址配置
    │   ├── lobby.js    # 大厅逻辑
    │   └── game.js     # 游戏逻辑
    └── vercel.json     # Vercel 部署配置
```

---

## 本地开发

### 1. 启动后端

```bash
cd backend
npm install
cp .env.example .env      # 按需修改
npm run dev               # nodemon 热重载
```

服务默认运行在 `http://localhost:3001`

### 2. 启动前端

直接用 VS Code **Live Server** 打开 `frontend/index.html`，或：

```bash
# 任意静态服务器
npx serve frontend
# 访问 http://localhost:3000
```

---

## 部署

### 后端 → Railway

1. 在 [railway.app](https://railway.app) 创建项目
2. 连接 GitHub，选择 `backend/` 目录
3. 环境变量添加：
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
4. 部署完成后记录域名，如 `https://xxx.up.railway.app`

### 前端 → Vercel

1. 在 [vercel.com](https://vercel.com) 创建项目
2. 连接 GitHub，选择 `frontend/` 目录，**框架选 Other**
3. 部署完成后，打开 `frontend/js/config.js`，将 `PRODUCTION_URL` 替换为 Railway 域名
4. 重新部署

---

## 添加游戏规则

当游戏规则确定后，在 `backend/game/rules/` 创建新文件：

```js
// backend/game/rules/MyPokerRule.js
const BaseRule = require('./BaseRule');

class MyPokerRule extends BaseRule {
  onGameStart(players, deck) { /* 发牌逻辑 */ }
  onAction(playerId, action, data) { /* 出牌、摸牌逻辑 */ }
}

module.exports = MyPokerRule;
```

然后在 `backend/game/Room.js` 顶部将：
```js
const RuleEngine = require('./rules/BaseRule');
```
替换为：
```js
const RuleEngine = require('./rules/MyPokerRule');
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js 18 + Express + Socket.IO 4 |
| 前端 | 原生 HTML5 / CSS3 / JavaScript |
| 部署 | Railway（后端） + Vercel（前端） |
| 通信 | WebSocket（Socket.IO 自动降级 polling） |
