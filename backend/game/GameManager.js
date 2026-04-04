const { v4: uuidv4 } = require('uuid');
const Room = require('./Room');

/**
 * GameManager —— 管理所有房间，作为 Socket.IO 和游戏逻辑之间的中枢。
 */
class GameManager {
  constructor(io) {
    this.io = io;
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
    /** @type {Map<string, string>} socket.id => roomId */
    this.socketToRoom = new Map();
  }

  // ── 房间管理 ───────────────────────────────────────────────────

  createRoom({ roomName, maxPlayers, password }) {
    const id = uuidv4().slice(0, 6).toUpperCase();
    const room = new Room({ id, roomName: roomName || `房间 ${id}`, maxPlayers, password, io: this.io });
    this.rooms.set(id, room);
    console.log(`[GameManager] 房间创建: ${id} "${room.roomName}"`);
    return room;
  }

  getRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`房间 ${roomId} 不存在`);
    return room;
  }

  joinRoom(roomId, socket, playerName, password, reconnectPlayerId) {
    const room = this.getRoom(roomId);
    const result = room.addPlayer(socket, playerName, password, reconnectPlayerId);
    this.socketToRoom.set(socket.id, roomId);
    socket.join(roomId);
    return result;
  }

  setPlayerReady(roomId, playerId, socket) {
    const room = this.getRoom(roomId);
    room.setReady(playerId);
  }

  startGame(roomId, playerId) {
    const room = this.getRoom(roomId);
    room.startGame(playerId);
  }

  handleGameAction(roomId, playerId, action, data, socket) {
    const room = this.getRoom(roomId);
    room.handleAction(playerId, action, data, socket);
  }

  handleDisconnect(socket) {
    const roomId = this.socketToRoom.get(socket.id);
    if (!roomId) return;
    this.socketToRoom.delete(socket.id);

    const room = this.rooms.get(roomId);
    if (!room) return;

    // 宽限期后再移除（兼容页面跳转时的短暂断线）
    room.schedulePlayerRemoval(socket.id, () => {
      this.rooms.delete(roomId);
      console.log(`[GameManager] 空房间已清理: ${roomId}`);
    });
  }

  getPublicRoomList() {
    const list = [];
    for (const room of this.rooms.values()) {
      if (!room.password) {
        list.push(room.getPublicInfo());
      }
    }
    return list;
  }
}

module.exports = GameManager;
