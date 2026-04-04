require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameManager = require('./game/GameManager');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

// 健康检查接口（Railway 需要）
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Card Game Server Running' });
});

app.get('/api/rooms', (req, res) => {
  res.json(gameManager.getPublicRoomList());
});

const gameManager = new GameManager(io);

// ─── Socket 事件处理 ──────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[连接] ${socket.id}`);

  // 创建房间
  socket.on('create_room', ({ playerName, roomName, maxPlayers, password }, cb) => {
    try {
      const room = gameManager.createRoom({ roomName, maxPlayers: maxPlayers || 4, password: password || '' });
      const result = gameManager.joinRoom(room.id, socket, playerName);
      cb({ success: true, roomId: room.id, playerId: result.playerId });
    } catch (err) {
      cb({ success: false, error: err.message });
    }
  });

  // 加入房间
  socket.on('join_room', ({ roomId, playerName, password, playerId }, cb) => {
    try {
      const result = gameManager.joinRoom(roomId, socket, playerName, password, playerId);
      cb({ success: true, playerId: result.playerId });
    } catch (err) {
      cb({ success: false, error: err.message });
    }
  });

  // 玩家准备
  socket.on('player_ready', ({ roomId, playerId }) => {
    gameManager.setPlayerReady(roomId, playerId, socket);
  });

  // 开始游戏（房主操作）
  socket.on('start_game', ({ roomId, playerId }, cb) => {
    try {
      gameManager.startGame(roomId, playerId);
      if (cb) cb({ success: true });
    } catch (err) {
      if (cb) cb({ success: false, error: err.message });
    }
  });

  // 游戏动作（出牌、弃牌等，由规则模块处理）
  socket.on('game_action', ({ roomId, playerId, action, data }) => {
    gameManager.handleGameAction(roomId, playerId, action, data, socket);
  });

  // 发送聊天消息
  socket.on('chat_message', ({ roomId, playerName, message }) => {
    io.to(roomId).emit('chat_message', {
      playerName,
      message,
      timestamp: Date.now(),
    });
  });

  // 断线处理
  socket.on('disconnect', () => {
    console.log(`[断线] ${socket.id}`);
    gameManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ 服务器运行在端口 ${PORT}`);
});
