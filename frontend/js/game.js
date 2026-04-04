/**
 * game.js —— 游戏室页面逻辑
 *
 * 负责：Socket 事件监听、UI 更新、手牌渲染、动作发送。
 * 具体游戏规则的按钮由后端 game_started 事件携带 actions 字段来驱动，
 * 也可在 renderActionPanel() 中按规则自定义。
 */

// ── 状态 ──────────────────────────────────────────────────────────
const state = {
  roomId:     null,
  playerId:   null,
  playerName: null,
  hostId:     null,
  phase:      'waiting',
  players:    [],
  myHand:     [],
  communityCards: [],
  selectedCards: new Set(),  // 选中的手牌索引
  selectedTableCardIndex: null,
  animatingPlaceCardIndex: null,
  enteringTableCardIndexes: new Set(),
  flippingTableCardIndexes: new Set(),
  myPlacedCards: [],
  lastResult: null,
  lastCanContinue: false,
  gameState:  {},
};

// ── DOM 引用 ──────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const roomLabel      = $('room-label');
const phaseBadge     = $('phase-badge');
const playerList     = $('player-list');
const hostControls   = $('host-controls');
const clientControls = $('client-controls');
const btnStart       = $('btn-start');
const btnReady       = $('btn-ready');
const btnLeave       = $('btn-leave');
const waitingScreen  = $('waiting-screen');
const gameScreen     = $('game-screen');
const resultScreen   = $('result-screen');
const roomIdDisplay  = $('room-id-display');
const btnCopyId      = $('btn-copy-id');
const opponentsArea  = $('opponents-area');
const communityCards = $('community-cards');
const myHandEl       = $('my-hand');
const actionPanel    = $('action-panel');
const chatMessages   = $('chat-messages');
const chatInput      = $('chat-input');
const btnSend        = $('btn-send');
const turnInfo       = $('turn-info');
const deckCount      = $('deck-count');
const resultCards    = $('result-cards');
const btnContinueRound = $('btn-continue-round');
const myPlacedCardsEl = $('my-placed-cards');
const turnBanner     = $('turn-banner');
const t = (key, vars) => (window.I18N ? window.I18N.t(key, vars) : key);

// ── Socket 连接 ───────────────────────────────────────────────────
const socket = io(window.SERVER_URL, { transports: ['websocket', 'polling'] });

socket.on('connect', () => {
  console.log('[Socket] 已连接');
  // 重连后重新加入房间（携带 playerId 以复用已有玩家槽位）
  if (state.roomId && state.playerId) {
    socket.emit('join_room', {
      roomId:     state.roomId,
      playerId:   state.playerId,
      playerName: state.playerName,
      password:   sessionStorage.getItem('cg_roomPw') || '',
    }, (res) => {
      if (res && !res.success) console.warn('[reconnect] 重连失败:', res.error);
    });
  }
});

socket.on('disconnect', () => {
  addSystemMessage(t('game.msg.disconnected'));
});

// ── 房间/游戏事件 ─────────────────────────────────────────────────
socket.on('room_update', (data) => {
  state.players  = data.players;
  state.hostId   = data.hostId;
  state.phase    = data.phase;
  state.gameState = data.gameState || {};
  renderPhase(data.phase);
  renderPlayerList();
  renderActionPanel();
  updateHostControls();
});

socket.on('player_left', ({ playerName }) => {
  addSystemMessage(t('game.msg.playerLeft', { name: playerName }));
});

socket.on('game_started', (data) => {
  state.players  = data.players;
  state.gameState = data.gameState || {};
  state.communityCards = [];
  state.selectedTableCardIndex = null;
  showScreen('game');
  renderOpponents();
  renderCommunityCards(state.communityCards);
  updateGameInfo();
  announceTurn(state.gameState?.currentTurn);
  addSystemMessage(t('game.msg.started'));
});

// 收到自己的手牌（私发）
socket.on('deal_hand', ({ hand }) => {
  state.myHand = hand;
  renderMyHand();
});

// 收到游戏状态更新（如轮次变化、公共牌变化）
socket.on('state_update', (data) => {
  const previousCards = state.communityCards;
  const previousTurn = state.gameState?.currentTurn || null;
  if (data.gameState) state.gameState = data.gameState;
  if (data.communityCards) {
    const nextCards = data.communityCards;
    state.enteringTableCardIndexes = new Set();
    state.flippingTableCardIndexes = new Set();
    if (nextCards.length > previousCards.length) {
      for (let i = previousCards.length; i < nextCards.length; i++) {
        state.enteringTableCardIndexes.add(i);
      }
    }
    const compareLength = Math.min(previousCards.length, nextCards.length);
    for (let i = 0; i < compareLength; i++) {
      if (previousCards[i]?.faceDown && !nextCards[i]?.faceDown) {
        state.flippingTableCardIndexes.add(i);
      }
    }
    state.communityCards = data.communityCards;
    if (
      state.selectedTableCardIndex != null &&
      (!state.communityCards[state.selectedTableCardIndex] || !state.communityCards[state.selectedTableCardIndex].faceDown)
    ) {
      state.selectedTableCardIndex = null;
    }
    renderCommunityCards(state.communityCards);
  }
  if (data.players) { state.players = data.players; renderPlayerList(); renderOpponents(); }
  renderActionPanel();
  updateGameInfo();
  const nextTurn = state.gameState?.currentTurn || null;
  if (nextTurn && nextTurn !== previousTurn && !state.gameState?.awaitingRps) {
    announceTurn(nextTurn);
  }
});

// 仅自己可见的私人状态（自己的已放牌明细）
socket.on('private_state', (data) => {
  state.myPlacedCards = data?.myPlacedCards || [];
  renderMyPlacedCards(state.myPlacedCards);
});

// 动作确认（规则引擎回调）
socket.on('action_ack', (data) => {
  if (data.message) addSystemMessage(data.message);
});

// 游戏结束
socket.on('game_over', (result) => {
  showResultScreen(result, false);
});

socket.on('round_over', (result) => {
  showResultScreen(result, !!result.canContinue);
});

socket.on('match_continued', () => {
  showScreen('game');
  addSystemMessage(t('game.msg.nextRound'));
});

// 聊天消息
socket.on('chat_message', ({ playerName, message }) => {
  addChatMessage(playerName, message);
});

// ── UI 渲染 ───────────────────────────────────────────────────────
function renderPhase(phase) {
  phaseBadge.textContent = t(`game.phase.${phase}`);
  phaseBadge.className   = `phase-badge ${phase}`;
}

function renderPlayerList() {
  const currentTurn = state.gameState?.currentTurn;
  playerList.innerHTML = state.players.map(p => {
    const isMe   = p.id === state.playerId;
    const isHost = p.id === state.hostId;
    const isTurn = p.id === currentTurn;
    return `<li class="player-item ${isMe ? 'is-me' : ''} ${isTurn ? 'is-turn' : ''}">
      <span class="player-name">${p.name}</span>
      <div class="player-tags">
        ${isHost ? `<span class="tag host">${t('game.tag.host')}</span>` : ''}
        ${isMe   ? `<span class="tag me">${t('game.tag.me')}</span>`   : ''}
        ${p.ready && state.phase === 'waiting' ? `<span class="tag ready">${t('game.tag.ready')}</span>` : ''}
        ${state.phase === 'playing' ? `<span class="tag">${t('game.tag.cards', { count: p.cardCount })}</span>` : ''}
      </div>
    </li>`;
  }).join('');
}

function updateHostControls() {
  const isHost = state.playerId === state.hostId;
  hostControls.classList.toggle('hidden', !isHost);
  clientControls.classList.toggle('hidden', isHost);

  if (isHost) {
    const allReady = state.players
      .filter(p => p.id !== state.hostId)
      .every(p => p.ready);
    btnStart.disabled = state.players.length < 2 || !allReady;
  }
}

function renderOpponents() {
  const opponents = state.players.filter(p => p.id !== state.playerId);
  opponentsArea.innerHTML = opponents.map(p => `
    <div class="opponent-slot">
      <span class="opponent-name">${p.name} (${t('game.tag.cards', { count: p.cardCount })})</span>
      <div class="opponent-cards">
        ${Array.from({ length: Math.min(p.cardCount, 7) }, () => '<div class="card-back-mini"></div>').join('')}
      </div>
    </div>
  `).join('');
}

function renderMyHand() {
  myHandEl.innerHTML = state.myHand.map((card, i) => {
    const isRed = isCardRed(card);
    const colorText = getCardColorText(card);
    const selected = state.selectedCards.has(i);
    const outgoing = state.animatingPlaceCardIndex === i ? 'outgoing' : '';
    return `<div class="card ${isRed ? 'red' : 'black'} ${selected ? 'selected' : ''} ${outgoing}" data-card-index="${i}"
                 onclick="toggleCard(${i})" title="${colorText}">
      <div class="card-corner-top">${colorText}</div>
      <div class="card-rank">${colorText}</div>
      <div class="card-corner-bottom">${colorText}</div>
    </div>`;
  }).join('');
}

function renderCommunityCards(cards) {
  const revealableSet = getRevealableTableIndexes(cards);
  communityCards.innerHTML = cards.map((card, index) => {
    const ownerName = card.ownerName || t('game.table.unknown');
    const mineSuffix = card.ownerId === state.playerId ? t('game.table.mine') : '';
    const ownerTag = `<span class="table-card-owner">${ownerName}${mineSuffix}</span>`;
    const orderTag = `<span class="table-card-order">#${index + 1}</span>`;
    if (card.faceDown) {
      const selected = state.selectedTableCardIndex === index ? 'selected' : '';
      const revealMode = !!state.gameState?.revealMode;
      const revealable = revealableSet.has(index);
      const locked = revealMode && !revealable ? 'locked-face-down' : '';
      const entering = state.enteringTableCardIndexes.has(index) ? 'deal-in' : '';
      const tip = revealMode && !revealable
        ? t('game.table.faceDownLocked', { index: index + 1 })
        : t('game.table.faceDown', { index: index + 1 });
      return `<div class="card face-down ${selected} ${locked} ${entering}" title="${tip}" onclick="toggleTableCard(${index})">${ownerTag}${orderTag}</div>`;
    }
    const isRed = isCardRed(card);
    const colorText = getCardColorText(card);
    const flipped = state.flippingTableCardIndexes.has(index) ? 'flip-in' : '';
    return `<div class="card ${isRed ? 'red' : 'black'} ${flipped}">
      ${ownerTag}
      ${orderTag}
      <div class="card-corner-top">${colorText}</div>
      <div class="card-rank">${colorText}</div>
      <div class="card-corner-bottom">${colorText}</div>
    </div>`;
  }).join('');
}

function getRevealableTableIndexes(cards) {
  const seenOwners = new Set();
  const indexOnly = new Set();
  for (let i = cards.length - 1; i >= 0; i--) {
    const card = cards[i];
    if (!card.faceDown) continue;
    if (!seenOwners.has(card.ownerId)) {
      seenOwners.add(card.ownerId);
      indexOnly.add(i);
    }
  }
  return indexOnly;
}

function isCardRed(card) {
  if (card.color) return card.color === 'red';
  return card.suit === '♥' || card.suit === '♦';
}

function getCardColorText(card) {
  return isCardRed(card) ? t('game.card.red') : t('game.card.black');
}

function updateGameInfo() {
  const gs = state.gameState;
  const currentPlayer = state.players.find(p => p.id === gs?.currentTurn);
  if (gs?.awaitingRps) {
    turnInfo.textContent = t('game.turn.rps');
  } else {
    turnInfo.textContent  = t('game.turn.now', { name: currentPlayer ? currentPlayer.name : '-' });
  }
  const declared = Number.isInteger(gs?.declaredBlack) ? gs.declaredBlack : 0;
  const declaredBy = gs?.declaredBy ? state.players.find(p => p.id === gs.declaredBy)?.name : null;
  const revealedBlack = Number.isInteger(gs?.revealedBlack) ? gs.revealedBlack : 0;
  if (gs?.revealMode) {
    deckCount.textContent = t('game.table.deckInfoReveal', {
      count: state.communityCards.length,
      revealed: revealedBlack,
      declared,
      name: declaredBy || '-'
    });
  } else {
    const by = declaredBy ? t('game.table.by', { name: declaredBy }) : '';
    deckCount.textContent = t('game.table.deckInfoDeclared', {
      count: state.communityCards.length,
      declared,
      by
    });
  }
}

/**
 * 动作按钮面板——后续根据具体规则填充。
 * 示例：[出牌, 摸牌, 过] 三个按钮。
 */
function renderActionPanel(actions = []) {
  if (!actions.length) {
    actions = [
      { label: t('game.action.place'), action: 'place_face_down' },
      { label: t('game.action.reveal'), action: 'reveal_table_card' },
      { label: t('game.action.declare'), action: 'declare' },
      { label: t('game.action.pass'), action: 'pass' },
    ];
  }

  const isRevealMode = !!state.gameState?.revealMode;
  const isDeclarer = state.playerId && state.gameState?.declaredBy === state.playerId;
  const isMyTurn = state.playerId && state.gameState?.currentTurn === state.playerId;
  const initialPlacementDone = new Set((state.gameState?.tableCards || []).map(item => item.ownerId));
  const allPlayersDoneInitial = state.players.length > 0 && state.players.every(p => initialPlacementDone.has(p.id));
  const isInitialDeclarePhase = allPlayersDoneInitial && !!state.gameState?.initialDeclareRequired;
  const isAwaitingRps = !!state.gameState?.awaitingRps;
  const rpsParticipants = state.gameState?.rpsParticipants || [];
  const inRpsParticipants = rpsParticipants.includes(state.playerId);
  const forcedFirstDeclarer = state.gameState?.forcedFirstDeclarer;
  const declaredBlack = Number.isInteger(state.gameState?.declaredBlack) ? state.gameState.declaredBlack : 0;
  const iPlacedInitialCard = initialPlacementDone.has(state.playerId);

  if (isAwaitingRps) {
    if (!inRpsParticipants) {
      actionPanel.innerHTML = `<span class="hint">${t('game.msg.waitRps')}</span>`;
      return;
    }
    actionPanel.innerHTML = `
      <button class="btn btn-secondary" onclick="sendAction('rps_pick', { choice: 'rock' })">${t('game.action.rock')}</button>
      <button class="btn btn-secondary" onclick="sendAction('rps_pick', { choice: 'scissors' })">${t('game.action.scissors')}</button>
      <button class="btn btn-secondary" onclick="sendAction('rps_pick', { choice: 'paper' })">${t('game.action.paper')}</button>
    `;
    return;
  }

  // 首次声明阶段：所有玩家都只显示“声明”。
  if (isInitialDeclarePhase) {
    if (forcedFirstDeclarer && forcedFirstDeclarer !== state.playerId) {
      actionPanel.innerHTML = `<span class="hint">${t('game.msg.waitFirstDeclarer')}</span>`;
      return;
    }
    actions = actions.filter(a => a.action === 'declare');
    actionPanel.innerHTML = actions.map(a => `
      <button class="btn btn-secondary" onclick="sendAction('${a.action}')">
        ${a.label}
      </button>
    `).join('');
    return;
  }

  // 非首次声明阶段，没轮到自己不显示任何操作。
  if (!isMyTurn) {
    actionPanel.innerHTML = `<span class="hint">${t('game.msg.waitTurn')}</span>`;
    return;
  }

  if (isRevealMode) {
    if (isDeclarer) {
      actions = actions.filter(a => a.action === 'reveal_table_card');
    } else {
      actions = [];
    }
  } else {
    actions = actions.filter(a => a.action !== 'reveal_table_card');

    // 开局首次覆盖阶段：每位玩家尚未完成首次扣置前，只允许扣置。
    if (!allPlayersDoneInitial && !iPlacedInitialCard) {
      actions = actions.filter(a => a.action === 'place_face_down');
    } else if (!allPlayersDoneInitial && iPlacedInitialCard) {
      actions = [];
    } else if (state.gameState?.initialDeclareRequired) {
      // 仅首次正式回合强制声明。
      actions = actions.filter(a => a.action === 'declare');
    } else if (!state.myHand.length) {
      // 手中无牌时不能扣置。
      actions = actions.filter(a => a.action !== 'place_face_down');
    }

    // 规则更新：当前已声明黑牌数为 0 时，不能选择过。
    if (declaredBlack === 0) {
      actions = actions.filter(a => a.action !== 'pass');
    }
  }

  if (!actions.length) {
    actionPanel.innerHTML = `<span class="hint">${t('game.msg.noAction')}</span>`;
    return;
  }

  actionPanel.innerHTML = actions.map(a => `
    <button class="btn btn-secondary" onclick="sendAction('${a.action}')">
      ${a.label}
    </button>
  `).join('');
}

// ── 手牌选择 ──────────────────────────────────────────────────────
window.toggleCard = function(index) {
  if (state.selectedCards.has(index)) {
    state.selectedCards.delete(index);
  } else {
    state.selectedCards.add(index);
  }
  renderMyHand();
};

window.toggleTableCard = function(index) {
  const target = state.communityCards[index];
  if (!target || !target.faceDown) return;
  if (state.gameState?.revealMode) {
    const revealableSet = getRevealableTableIndexes(state.communityCards);
    if (!revealableSet.has(index)) {
      addSystemMessage(t('game.table.stackTop'));
      return;
    }
  }
  if (state.selectedTableCardIndex === index) {
    state.selectedTableCardIndex = null;
  } else {
    state.selectedTableCardIndex = index;
  }
  renderCommunityCards(state.communityCards);
};

// ── 动作发送 ──────────────────────────────────────────────────────
window.sendAction = function(action, extraData = {}) {
  const isMyTurn = state.playerId && state.gameState?.currentTurn === state.playerId;
  const initialPlacementDone = new Set((state.gameState?.tableCards || []).map(item => item.ownerId));
  const allPlayersDoneInitial = state.players.length > 0 && state.players.every(p => initialPlacementDone.has(p.id));
  const isInitialDeclarePhase = allPlayersDoneInitial && !!state.gameState?.initialDeclareRequired;
  const isAwaitingRps = !!state.gameState?.awaitingRps;
  const inRpsParticipants = (state.gameState?.rpsParticipants || []).includes(state.playerId);
  const forcedFirstDeclarer = state.gameState?.forcedFirstDeclarer;

  if (isAwaitingRps) {
    if (action !== 'rps_pick') {
      addSystemMessage(t('game.msg.rpsPhase'));
      return;
    }
    if (!inRpsParticipants) {
      addSystemMessage(t('game.msg.notInRps'));
      return;
    }
  }

  if (
    !isAwaitingRps &&
    !isMyTurn &&
    !(isInitialDeclarePhase && action === 'declare')
  ) {
    addSystemMessage(t('game.msg.notYourTurn'));
    return;
  }

  if (isInitialDeclarePhase && action === 'declare' && forcedFirstDeclarer && forcedFirstDeclarer !== state.playerId) {
    addSystemMessage(t('game.msg.noFirstDeclareRight'));
    return;
  }

  if (action === 'declare') {
    const currentDeclared = Number.isInteger(state.gameState?.declaredBlack) ? state.gameState.declaredBlack : 0;
    const input = window.prompt(t('game.msg.promptDeclare', { current: currentDeclared }));
    if (input == null) return;
    const value = Number.parseInt(input.trim(), 10);
    if (!Number.isInteger(value) || value < 1) {
      addSystemMessage(t('game.msg.declareInteger'));
      return;
    }
    if (value <= currentDeclared) {
      addSystemMessage(t('game.msg.declareTooSmall', { current: currentDeclared }));
      return;
    }
    extraData = { ...extraData, declaredBlack: value };
  }

  if (action === 'place_face_down' && state.selectedCards.size !== 1) {
    addSystemMessage(t('game.msg.selectOneCard'));
    return;
  }
  if (action === 'pass' && (state.gameState?.declaredBlack || 0) === 0) {
    addSystemMessage(t('game.msg.passNotAllowed'));
    return;
  }
  if (action === 'place_face_down' && !state.myHand.length) {
    addSystemMessage(t('game.msg.noHandCard'));
    return;
  }
  if (action === 'reveal_table_card' && state.selectedTableCardIndex == null) {
    addSystemMessage(t('game.table.noSelection'));
    return;
  }

  const emitAction = () => {
    const selectedCards = [...state.selectedCards].map(i => state.myHand[i]);
    const selectedIndexes = [...state.selectedCards].sort((a, b) => a - b);
    socket.emit('game_action', {
      roomId:   state.roomId,
      playerId: state.playerId,
      action,
      data: {
        cards: selectedCards,
        cardIndexes: selectedIndexes,
        tableCardIndex: state.selectedTableCardIndex,
        ...extraData,
      },
    });
    state.selectedCards.clear();
    if (action === 'reveal_table_card') state.selectedTableCardIndex = null;
    state.animatingPlaceCardIndex = null;
    renderMyHand();
    renderCommunityCards(state.communityCards);
  };

  if (action === 'place_face_down') {
    state.animatingPlaceCardIndex = [...state.selectedCards][0];
    renderMyHand();
    setTimeout(emitAction, 260);
    return;
  }

  emitAction();
};

function renderResultCards(cards) {
  if (!cards.length) {
    resultCards.innerHTML = '';
    return;
  }

  resultCards.innerHTML = cards.map(card => {
    const isRed = isCardRed(card);
    const colorText = getCardColorText(card);
    const ownerName = card.ownerName || t('game.table.unknown');
    const meta = t('game.result.cardMeta', {
      owner: ownerName,
      globalOrder: card.globalOrder || '-',
      ownerOrder: card.ownerOrder || '-'
    });
    return `<div class="result-card-item">
      <div class="card ${isRed ? 'red' : 'black'}" title="${colorText}">
        <div class="card-corner-top">${colorText}</div>
        <div class="card-rank">${colorText}</div>
        <div class="card-corner-bottom">${colorText}</div>
      </div>
      <div class="result-card-meta">${meta}</div>
    </div>`;
  }).join('');
}

function getResultTitle(result) {
  if (result?.resultCode === 'success_exact') return t('game.result.title.success_exact');
  if (result?.resultCode === 'fail_red') return t('game.result.title.fail_red');
  if (result?.resultCode === 'fail_over') return t('game.result.title.fail_over');
  if (result?.resultCode === 'fail_insufficient') return t('game.result.title.fail_insufficient');
  return result?.success ? t('game.result.title.success') : t('game.result.title.fail');
}

function getResultDetail(result) {
  const declarer = state.players.find(p => p.id === result?.declarerId)?.name || t('game.table.unknown');
  const declared = Number.isInteger(result?.declaredBlack) ? result.declaredBlack : 0;
  const revealed = Number.isInteger(result?.revealedBlack) ? result.revealedBlack : 0;

  if (result?.resultCode === 'success_exact') {
    return t('game.result.detail.success_exact', { declarer, declared, revealed });
  }
  if (result?.resultCode === 'fail_red') {
    return t('game.result.detail.fail_red', { declarer, declared, revealed });
  }
  if (result?.resultCode === 'fail_over') {
    return t('game.result.detail.fail_over', { declarer, declared, revealed });
  }
  if (result?.resultCode === 'fail_insufficient') {
    return t('game.result.detail.fail_insufficient', { declarer, declared, revealed });
  }

  if (result?.winners?.length) {
    return t('game.result.winners', { names: result.winners.join(', ') });
  }
  return result?.detail || '';
}

function renderMyPlacedCards(cards) {
  if (!cards.length) {
    myPlacedCardsEl.innerHTML = `<span class="hint">${t('game.table.none')}</span>`;
    return;
  }

  let topMyOrder = 0;
  for (let i = cards.length - 1; i >= 0; i--) {
    if (cards[i].faceDown) {
      topMyOrder = cards[i].myOrder;
      break;
    }
  }

  myPlacedCardsEl.innerHTML = cards.map(c => {
    const colorText = c.color === 'red' ? t('game.card.red') : t('game.card.black');
    const topTag = topMyOrder === c.myOrder ? `<span class="top-tag">${t('game.table.top')}</span>` : '';
    return `
      <div class="my-placed-item">
        <div>${c.color === 'red' ? t('game.card.redLabel') : t('game.card.blackLabel')} ${topTag}</div>
        <div class="meta">${t('game.table.myOrder', { myOrder: c.myOrder, globalOrder: c.globalOrder })}</div>
      </div>
    `;
  }).join('');
}

function announceTurn(playerId) {
  const player = state.players.find(p => p.id === playerId);
  if (!player || !turnBanner) return;
  turnBanner.textContent = t('game.turn.banner', { name: player.name });
  turnBanner.classList.remove('hidden', 'showing');
  void turnBanner.offsetWidth;
  turnBanner.classList.add('showing');
  clearTimeout(turnBanner._timer);
  turnBanner._timer = setTimeout(() => {
    turnBanner.classList.add('hidden');
    turnBanner.classList.remove('showing');
  }, 1180);
}

function showResultScreen(result, canContinue) {
  state.lastResult = result;
  state.lastCanContinue = !!canContinue;
  showScreen('result');
  $('result-title').textContent = getResultTitle(result) || t('game.result.roundOver');
  const statsLine = Array.isArray(result.stats) && result.stats.length
    ? `\n${t('game.result.stats', { line: result.stats.map(s => t('game.result.statLine', { name: s.name, success: s.successCount, fail: s.failCount })).join(' | ') })}`
    : '';
  $('result-detail').textContent = getResultDetail(result) + statsLine;
  renderResultCards(result.revealedCards || []);
  const isHost = state.playerId === state.hostId;
  btnContinueRound.classList.toggle('hidden', !(canContinue && isHost));
}

// ── 屏幕切换 ──────────────────────────────────────────────────────
function showScreen(name) {
  waitingScreen.classList.add('hidden');
  gameScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  if (name === 'waiting') waitingScreen.classList.remove('hidden');
  if (name === 'game')    { gameScreen.classList.remove('hidden'); renderActionPanel(); }
  if (name === 'result')  resultScreen.classList.remove('hidden');
}

// ── 聊天 ──────────────────────────────────────────────────────────
function addChatMessage(sender, message) {
  const li = document.createElement('li');
  li.className = 'chat-msg';
  li.innerHTML = `<span class="sender">${sender}：</span>${escHtml(message)}`;
  chatMessages.appendChild(li);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(message) {
  const li = document.createElement('li');
  li.className = 'chat-msg';
  li.innerHTML = `<span class="system">· ${escHtml(message)}</span>`;
  chatMessages.appendChild(li);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function sendChat() {
  const msg = chatInput.value.trim();
  if (!msg) return;
  socket.emit('chat_message', { roomId: state.roomId, playerName: state.playerName, message: msg });
  chatInput.value = '';
}

btnSend.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

// ── 控制按钮 ──────────────────────────────────────────────────────
btnReady.addEventListener('click', () => {
  socket.emit('player_ready', { roomId: state.roomId, playerId: state.playerId });
  const nowReady = btnReady.dataset.ready === '1';
  btnReady.dataset.ready = nowReady ? '0' : '1';
  btnReady.textContent = btnReady.dataset.ready === '1' ? t('game.unready') : t('game.ready');
});

btnStart.addEventListener('click', () => {
  socket.emit('start_game', { roomId: state.roomId, playerId: state.playerId }, (res) => {
    if (res && !res.success) addSystemMessage(t('game.msg.startFailed', { error: res.error }));
  });
});

btnLeave.addEventListener('click', () => {
  socket.disconnect();
  location.href = 'index.html';
});

btnCopyId.addEventListener('click', () => {
  navigator.clipboard.writeText(state.roomId).then(() => {
    btnCopyId.textContent = t('game.copied');
    setTimeout(() => (btnCopyId.textContent = t('game.copy')), 2000);
  });
});

$('btn-back-lobby').addEventListener('click', () => {
  socket.disconnect();
  location.href = 'index.html';
});

btnContinueRound.addEventListener('click', () => {
  socket.emit('continue_game', { roomId: state.roomId, playerId: state.playerId }, (res) => {
    if (!res?.success) {
      addSystemMessage(t('game.msg.continueFailed', { error: res?.error || 'Unknown error' }));
    }
  });
});

window.addEventListener('lang_changed', () => {
  if (window.I18N) window.I18N.applyPage();
  roomLabel.textContent = t('game.roomLabel', { roomId: state.roomId });
  renderPhase(state.phase);
  renderPlayerList();
  renderOpponents();
  renderMyHand();
  renderCommunityCards(state.communityCards);
  renderActionPanel();
  updateGameInfo();
  renderMyPlacedCards(state.myPlacedCards || []);
  btnReady.textContent = btnReady.dataset.ready === '1' ? t('game.unready') : t('game.ready');
  if (!resultScreen.classList.contains('hidden') && state.lastResult) {
    showResultScreen(state.lastResult, state.lastCanContinue);
  }
});

// ── 初始化 ────────────────────────────────────────────────────────
(function init() {
  state.roomId     = sessionStorage.getItem('cg_roomId');
  state.playerId   = sessionStorage.getItem('cg_playerId');
  state.playerName = sessionStorage.getItem('cg_playerName');

  if (!state.roomId || !state.playerId) {
    location.href = 'index.html';
    return;
  }

  roomLabel.textContent    = t('game.roomLabel', { roomId: state.roomId });
  roomIdDisplay.textContent = state.roomId;
  btnReady.dataset.ready = '0';
  btnReady.textContent = t('game.ready');
  showScreen('waiting');
  addSystemMessage(t('game.msg.helloWait', { name: state.playerName }));
})();
