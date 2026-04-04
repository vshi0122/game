const { v4: uuidv4 } = require('uuid');
const Deck = require('./Deck');
// 规则模块接口 —— 后续替换为具体规则实现
const RuleEngine = require('./rules/BaseRule');

/** 游戏阶段枚举 */
const PHASE = {
  WAITING: 'waiting',   // 等待玩家
  READY:   'ready',     // 全部准备
  PLAYING: 'playing',   // 游戏进行中
  ENDED:   'ended',     // 本局结束
};

class Room {
  constructor({ id, roomName, maxPlayers, password, io }) {
    this.id = id;
    this.roomName = roomName;
    this.maxPlayers = maxPlayers || 4;
    this.password = password || '';
    this.io = io;

    /** @type {Map<string, Player>} playerId => Player */
    this.players = new Map();
    /** @type {Map<string, string>} socket.id => playerId */
    this.socketToPlayer = new Map();

    this.phase = PHASE.WAITING;
    this.deck = new Deck();
    this.ruleEngine = new RuleEngine(this);
    this.gameState = {};   // 由规则引擎维护的游戏状态
    this.hostId = null;    // 房主 playerId
    /** @type {Map<string, ReturnType<typeof setTimeout>>} socketId => timer */
    this.pendingDisconnects = new Map();
  }

  // ── 玩家管理 ────────────────────────────────────────────────────

  addPlayer(socket, playerName, password, reconnectPlayerId) {
    // 断线重连：根据 playerId 复用已有玩家，仅更新 socket 映射
    if (reconnectPlayerId) {
      const existing = this.players.get(reconnectPlayerId);
      if (existing) {
        const oldSocketId = existing.socketId;
        const timer = this.pendingDisconnects.get(oldSocketId);
        if (timer) { clearTimeout(timer); this.pendingDisconnects.delete(oldSocketId); }
        this.socketToPlayer.delete(oldSocketId);
        existing.socketId = socket.id;
        this.socketToPlayer.set(socket.id, reconnectPlayerId);
        console.log(`[Room ${this.id}] ${existing.name} 重连成功`);
        this._broadcast('room_update', this._getRoomState());
        return { playerId: reconnectPlayerId };
      }
    }

    if (this.password && this.password !== password) {
      throw new Error('密码错误');
    }
    if (this.players.size >= this.maxPlayers) {
      throw new Error('房间已满');
    }
    if (this.phase === PHASE.PLAYING) {
      throw new Error('游戏已在进行中，无法加入');
    }

    const playerId = uuidv4().slice(0, 8);
    const player = {
      id: playerId,
      socketId: socket.id,
      name: playerName || `玩家${this.players.size + 1}`,
      ready: false,
      hand: [],       // 手牌
      score: 0,
    };

    this.players.set(playerId, player);
    this.socketToPlayer.set(socket.id, playerId);

    if (!this.hostId) this.hostId = playerId;

    console.log(`[Room ${this.id}] ${player.name} 加入 (${this.players.size}/${this.maxPlayers})`);
    this._broadcast('room_update', this._getRoomState());
    return { playerId };
  }

  removePlayer(socketId) {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;

    const player = this.players.get(playerId);
    this.socketToPlayer.delete(socketId);
    this.players.delete(playerId);

    // 如果房主离开，转移房主
    if (this.hostId === playerId && this.players.size > 0) {
      this.hostId = this.players.keys().next().value;
    }

    console.log(`[Room ${this.id}] ${player?.name} 离开`);

    if (!this.isEmpty()) {
      this._broadcast('room_update', this._getRoomState());
      this._broadcast('player_left', { playerName: player?.name });

      // 游戏中有人离开，暂停或结束
      if (this.phase === PHASE.PLAYING) {
        this.ruleEngine.onPlayerLeave(playerId);
      }
    }
  }

  setReady(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.ready = !player.ready;
    this._broadcast('room_update', this._getRoomState());
  }

  startGame(requestPlayerId) {
    if (requestPlayerId !== this.hostId) throw new Error('只有房主可以开始游戏');
    if (this.players.size < 2) throw new Error('至少需要 2 名玩家');
    const notReady = [...this.players.values()].filter(p => p.id !== this.hostId && !p.ready);
    if (notReady.length > 0) throw new Error('有玩家尚未准备');

    this.phase = PHASE.PLAYING;
    this.deck = new Deck();
    this.deck.shuffle();

    // 清空手牌
    for (const p of this.players.values()) p.hand = [];

    // 初始化规则引擎，由其接管后续流程
    this.ruleEngine.onGameStart([...this.players.values()], this.deck);

    console.log(`[Room ${this.id}] 游戏开始`);
  }

  handleAction(playerId, action, data, socket) {
    if (this.phase !== PHASE.PLAYING) return;
    this.ruleEngine.onAction(playerId, action, data);
  }

  endGame(result) {
    this.phase = PHASE.ENDED;
    this._broadcast('game_over', result);
    // 5 秒后重置房间
    setTimeout(() => this._resetToWaiting(), 5000);
  }

  _resetToWaiting() {
    this.phase = PHASE.WAITING;
    for (const p of this.players.values()) {
      p.ready = false;
      p.hand = [];
      p.score = 0;
    }
    this.gameState = {};
    this._broadcast('room_update', this._getRoomState());
  }

  /**
   * 延迟移除玩家（宽限期内重连可取消）。
   * @param {string} socketId
   * @param {Function} onEmpty - 房间为空时的回调（由 GameManager 处理房间删除）
   * @param {number} [delay=8000]
   */
  schedulePlayerRemoval(socketId, onEmpty, delay = 8000) {
    if (this.pendingDisconnects.has(socketId)) return;
    const timer = setTimeout(() => {
      this.pendingDisconnects.delete(socketId);
      this.removePlayer(socketId);
      if (this.isEmpty()) onEmpty();
    }, delay);
    this.pendingDisconnects.set(socketId, timer);
    console.log(`[Room ${this.id}] 玩家断开，等待重连 (${delay / 1000}s)…`);
  }

  // ── 工具方法 ────────────────────────────────────────────────────

  isEmpty() {
    return this.players.size === 0;
  }

  _broadcast(event, data) {
    this.io.to(this.id).emit(event, data);
  }

  /** 向指定玩家发送私有数据（例如手牌） */
  _emit(playerId, event, data) {
    const player = this.players.get(playerId);
    if (!player) return;
    this.io.to(player.socketId).emit(event, data);
  }

  _getRoomState() {
    return {
      roomId: this.id,
      roomName: this.roomName,
      phase: this.phase,
      hostId: this.hostId,
      maxPlayers: this.maxPlayers,
      players: [...this.players.values()].map(p => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        score: p.score,
        cardCount: p.hand.length,
      })),
      gameState: this.gameState,
    };
  }

  getPublicInfo() {
    return {
      roomId: this.id,
      roomName: this.roomName,
      phase: this.phase,
      playerCount: this.players.size,
      maxPlayers: this.maxPlayers,
    };
  }
}

module.exports = Room;
