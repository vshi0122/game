/**
 * lobby.js —— 大厅页面逻辑
 */

// ── 状态 ──────────────────────────────────────────────
let socket = null;
let myPlayerId = null;
let myRoomId = null;

// ── DOM 引用 ──────────────────────────────────────────
const $ = id => document.getElementById(id);
const playerNameInput  = $('player-name');
const roomNameInput    = $('room-name');
const maxPlayersInput  = $('max-players');
const createPwInput    = $('create-password');
const continueModeInput = $('continue-mode');
const successTargetInput = $('success-target');
const failTargetInput = $('fail-target');
const roomIdInput      = $('room-id');
const joinPwInput      = $('join-password');
const btnCreate        = $('btn-create');
const btnJoin          = $('btn-join');
const btnRefresh       = $('btn-refresh');
const roomList         = $('room-list');
const statusBar        = $('status-bar');

// ── 工具函数 ──────────────────────────────────────────
function showStatus(msg, type = '') {
  statusBar.textContent = msg;
  statusBar.className = `status-bar ${type}`;
  clearTimeout(statusBar._timer);
  statusBar._timer = setTimeout(() => {
    statusBar.className = 'status-bar hidden';
  }, 3500);
}

function getPlayerName() {
  const name = playerNameInput.value.trim();
  if (!name) { showStatus('请先输入玩家名称', 'error'); return null; }
  return name;
}

function connectSocket() {
  if (socket && socket.connected) return socket;
  socket = io(window.SERVER_URL, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    showStatus('已连接到服务器', 'success');
    fetchRooms();
  });

  socket.on('connect_error', () => {
    showStatus('无法连接到服务器，请检查后端是否运行', 'error');
  });

  return socket;
}

function navigateToGame(roomId, playerId, playerName) {
  sessionStorage.setItem('cg_roomId', roomId);
  sessionStorage.setItem('cg_playerId', playerId);
  sessionStorage.setItem('cg_playerName', playerName);
  location.href = 'game.html';
}

// ── 创建房间 ──────────────────────────────────────────
btnCreate.addEventListener('click', () => {
  const playerName = getPlayerName();
  if (!playerName) return;

  const s = connectSocket();
  showStatus('正在创建房间…');

  s.emit('create_room', {
    playerName,
    roomName: roomNameInput.value.trim() || `${playerName} 的房间`,
    maxPlayers: parseInt(maxPlayersInput.value, 10) || 4,
    password: createPwInput.value,
    gameConfig: {
      continueMode: continueModeInput.checked,
      successTarget: parseInt(successTargetInput.value, 10) || 1,
      failTarget: parseInt(failTargetInput.value, 10) || 1,
    },
  }, (res) => {
    if (res.success) {
      navigateToGame(res.roomId, res.playerId, playerName);
    } else {
      showStatus(`创建失败：${res.error}`, 'error');
    }
  });
});

// ── 加入房间 ──────────────────────────────────────────
btnJoin.addEventListener('click', joinByInput);
roomIdInput.addEventListener('keydown', e => { if (e.key === 'Enter') joinByInput(); });

function joinByInput() {
  const playerName = getPlayerName();
  if (!playerName) return;
  const roomId = roomIdInput.value.trim().toUpperCase();
  if (roomId.length !== 6) { showStatus('请输入 6 位房间 ID', 'error'); return; }
  doJoin(roomId, playerName, joinPwInput.value);
}

function doJoin(roomId, playerName, password = '') {
  const s = connectSocket();
  showStatus('正在加入房间…');

  s.emit('join_room', { roomId, playerName, password }, (res) => {
    if (res.success) {
      navigateToGame(roomId, res.playerId, playerName);
    } else {
      showStatus(`加入失败：${res.error}`, 'error');
    }
  });
}

// ── 公开房间列表 ──────────────────────────────────────
btnRefresh.addEventListener('click', fetchRooms);

async function fetchRooms() {
  try {
    const resp = await fetch(`${window.SERVER_URL}/api/rooms`);
    const rooms = await resp.json();
    renderRoomList(rooms);
  } catch {
    // 静默失败，不干扰用户
  }
}

function renderRoomList(rooms) {
  if (!rooms.length) {
    roomList.innerHTML = '<li class="empty-hint">暂无公开房间</li>';
    return;
  }
  roomList.innerHTML = rooms.map(r => `
    <li class="room-item">
      <div class="room-info">
        <div>${r.roomName}</div>
        <div class="room-meta">ID: ${r.roomId} · ${r.playerCount}/${r.maxPlayers} 人</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="quickJoin('${r.roomId}')">加入</button>
    </li>
  `).join('');
}

window.quickJoin = function(roomId) {
  const playerName = getPlayerName();
  if (!playerName) return;
  doJoin(roomId, playerName);
};

// ── 初始化 ────────────────────────────────────────────
(function init() {
  // 恢复上次填写的名称
  const savedName = sessionStorage.getItem('cg_playerName');
  if (savedName) playerNameInput.value = savedName;

  // 每 30 秒自动刷新房间列表
  connectSocket();
  setInterval(fetchRooms, 30000);

  const updateContinueModeInputs = () => {
    const enabled = continueModeInput.checked;
    successTargetInput.disabled = !enabled;
    failTargetInput.disabled = !enabled;
    if (!enabled) {
      successTargetInput.value = '1';
      failTargetInput.value = '1';
    }
  };
  continueModeInput.addEventListener('change', updateContinueModeInputs);
  updateContinueModeInputs();
})();
