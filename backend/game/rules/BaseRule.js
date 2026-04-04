/**
 * BaseRule —— 规则引擎基类（接口定义）
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  当你拿到具体游戏规则后，继承此类并覆写下列方法即可接入。         │
 * │  Room 实例会通过 this.room 访问，包括广播、发牌等能力。           │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * 使用方式（在 Room.js 中替换 require）：
 *   const RuleEngine = require('./rules/PokerRule');   // 你的规则文件
 */

class BaseRule {
  /** @param {import('../Room')} room */
  constructor(room) {
    this.room = room;
  }

  _buildInitialHand() {
    const cards = [
      { color: 'black' },
      { color: 'black' },
      { color: 'black' },
      { color: 'red' },
    ];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  _buildCommunityCards() {
    const tableCards = this.room.gameState.tableCards || [];
    return tableCards.map(item => {
      const owner = this.room.players.get(item.ownerId);
      const ownerName = owner?.name || '未知玩家';
      if (item.faceDown) return { faceDown: true, ownerId: item.ownerId, ownerName };
      return { color: item.card.color, faceDown: false, ownerId: item.ownerId, ownerName };
    });
  }

  _buildPlayersSnapshot() {
    return [...this.room.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      ready: p.ready,
      score: p.score,
      cardCount: p.hand.length,
    }));
  }

  _nextTurn() {
    const order = this.room.gameState.turnOrder || [];
    if (!order.length) return;
    const currentIndex = Number.isInteger(this.room.gameState.turnIndex) ? this.room.gameState.turnIndex : 0;
    const nextIndex = (currentIndex + 1) % order.length;
    this.room.gameState.turnIndex = nextIndex;
    this.room.gameState.currentTurn = order[nextIndex];
  }

  _syncState() {
    this.room._broadcast('state_update', {
      players: this._buildPlayersSnapshot(),
      gameState: this.room.gameState,
      communityCards: this._buildCommunityCards(),
    });

    // 私有视图：每位玩家只收到自己的放牌明细（颜色与顺序）。
    for (const player of this.room.players.values()) {
      this.room._emit(player.id, 'private_state', this._buildPrivateState(player.id));
    }
  }

  _buildPrivateState(playerId) {
    const tableCards = this.room.gameState.tableCards || [];
    const myPlacedCards = tableCards
      .map((item, index) => ({ item, index }))
      .filter(x => x.item.ownerId === playerId)
      .map((x, idx) => ({
        globalOrder: x.index + 1,
        myOrder: idx + 1,
        color: x.item.card.color,
        faceDown: x.item.faceDown,
      }));

    return {
      myPlacedCards,
    };
  }

  _getInitialPlacedSet() {
    const tableCards = this.room.gameState.tableCards || [];
    return new Set(tableCards.map(item => item.ownerId));
  }

  _allPlayersInitialPlaced() {
    const placedSet = this._getInitialPlacedSet();
    const playerIds = [...this.room.players.values()].map(p => p.id);
    return playerIds.length > 0 && playerIds.every(id => placedSet.has(id));
  }

  _setCurrentTurn(playerId) {
    const order = this.room.gameState.turnOrder || [];
    const idx = order.indexOf(playerId);
    if (idx >= 0) {
      this.room.gameState.turnIndex = idx;
      this.room.gameState.currentTurn = playerId;
    }
  }

  _startRpsPhase(participants) {
    this.room.gameState.awaitingRps = true;
    this.room.gameState.rpsParticipants = participants;
    this.room.gameState.rpsChoices = {};
    this.room.gameState.currentTurn = null;
    this.room.gameState.info = '首次声明前：请先进行石头剪刀布';
    this._syncState();
  }

  _resolveRpsRound() {
    const gs = this.room.gameState;
    const participants = gs.rpsParticipants || [];
    const choices = gs.rpsChoices || {};
    const submittedChoices = participants.map(id => choices[id]).filter(Boolean);
    if (submittedChoices.length !== participants.length) return;

    const used = new Set(submittedChoices);
    // 全同或三种都出现：平局重来
    if (used.size === 1 || used.size === 3) {
      gs.rpsChoices = {};
      gs.info = '石头剪刀布平局，参与者重新选择';
      this._syncState();
      this.room._broadcast('action_ack', {
        playerId: null,
        action: 'rps_pick',
        message: '石头剪刀布平局，本轮参与者请重新选择',
      });
      return;
    }

    const winningChoice =
      used.has('rock') && used.has('scissors') ? 'rock' :
      used.has('scissors') && used.has('paper') ? 'scissors' :
      'paper';

    const winners = participants.filter(id => choices[id] === winningChoice);
    if (winners.length > 1) {
      // 多人并列获胜，进入这些人之间的加赛
      gs.rpsParticipants = winners;
      gs.rpsChoices = {};
      gs.info = '石头剪刀布并列获胜，进入加赛';
      this._syncState();
      this.room._broadcast('action_ack', {
        playerId: null,
        action: 'rps_pick',
        message: '石头剪刀布并列获胜，获胜玩家继续加赛',
      });
      return;
    }

    const firstDeclarerId = winners[0];
    const firstDeclarer = this.room.players.get(firstDeclarerId);
    gs.awaitingRps = false;
    gs.rpsParticipants = [];
    gs.rpsChoices = {};
    gs.initialDeclareRequired = true;
    gs.forcedFirstDeclarer = firstDeclarerId;
    gs.info = `${firstDeclarer?.name || '玩家'} 获得首个声明权`;
    this._setCurrentTurn(firstDeclarerId);
    this._syncState();
    this.room._broadcast('action_ack', {
      playerId: firstDeclarerId,
      action: 'rps_pick',
      message: `${firstDeclarer?.name || '玩家'} 石头剪刀布获胜，请先声明`,
    });
  }

  _isTopFaceDownCardOfOwner(tableCardIndex) {
    const tableCards = this.room.gameState.tableCards || [];
    const target = tableCards[tableCardIndex];
    if (!target || !target.faceDown) return false;

    const ownerId = target.ownerId;
    // 从后往前找该玩家最上方仍未翻开的牌（栈顶）
    for (let i = tableCards.length - 1; i >= 0; i--) {
      const card = tableCards[i];
      if (card.ownerId === ownerId && card.faceDown) {
        return i === tableCardIndex;
      }
    }
    return false;
  }

  _resetDeclaration() {
    this.room.gameState.declaredBlack = 0;
    this.room.gameState.declaredBy = null;
    this.room.gameState.passedPlayers = [];
    this.room.gameState.revealMode = false;
    this.room.gameState.revealedBlack = 0;
  }

  _buildRoundResultCards() {
    const tableCards = this.room.gameState.tableCards || [];
    const ownerOrderMap = new Map();
    return tableCards.map((item, index) => {
      const ownerName = this.room.players.get(item.ownerId)?.name || 'Unknown';
      const prev = ownerOrderMap.get(item.ownerId) || 0;
      const ownerOrder = prev + 1;
      ownerOrderMap.set(item.ownerId, ownerOrder);
      return {
        color: item.card.color,
        ownerId: item.ownerId,
        ownerName,
        globalOrder: index + 1,
        ownerOrder,
      };
    });
  }

  _checkRevealResult() {
    const gs = this.room.gameState;
    const declaredBlack = gs.declaredBlack || 0;
    const revealedBlack = gs.revealedBlack || 0;
    const declaredBy = gs.declaredBy;
    const tableCards = gs.tableCards || [];
    const declarer = this.room.players.get(declaredBy);
    const declarerName = declarer?.name || '声明玩家';

    if (revealedBlack === declaredBlack) {
      gs.info = `${declarerName} 翻牌成功`;
      this._syncState();
      this.room.handleRoundOutcome({
        declarerId: declaredBy,
        success: true,
        resultCode: 'success_exact',
        declaredBlack,
        revealedBlack,
        winners: [declarerName],
        revealedCards: this._buildRoundResultCards(),
      });
      return true;
    }

    if (revealedBlack > declaredBlack) {
      gs.info = `${declarerName} 翻牌失败`;
      this._syncState();
      this.room.handleRoundOutcome({
        declarerId: declaredBy,
        success: false,
        resultCode: 'fail_over',
        declaredBlack,
        revealedBlack,
        winners: [],
        revealedCards: this._buildRoundResultCards(),
      });
      return true;
    }

    const remainingFaceDown = tableCards.filter(item => item.faceDown).length;
    if (revealedBlack + remainingFaceDown < declaredBlack) {
      gs.info = `${declarerName} 翻牌失败`;
      this._syncState();
      this.room.handleRoundOutcome({
        declarerId: declaredBy,
        success: false,
        resultCode: 'fail_insufficient',
        declaredBlack,
        revealedBlack,
        winners: [],
        revealedCards: this._buildRoundResultCards(),
      });
      return true;
    }

    return false;
  }

  _tryEnterRevealMode(lastPassPlayerName) {
    const gs = this.room.gameState;
    const declaredBlack = gs.declaredBlack || 0;
    const declaredBy = gs.declaredBy;
    if (declaredBlack <= 0 || !declaredBy) return false;

    const passedSet = new Set(gs.passedPlayers || []);
    const others = [...this.room.players.values()].map(p => p.id).filter(id => id !== declaredBy);
    const allOthersPassed = others.length > 0 && others.every(id => passedSet.has(id));
    if (!allOthersPassed) return false;

    gs.revealMode = true;
    gs.revealedBlack = 0;
    gs.currentTurn = declaredBy;
    gs.info = '进入翻牌阶段，由声明者翻牌';

    this._syncState();
    this.room._broadcast('action_ack', {
      playerId: declaredBy,
      action: 'reveal_start',
      message: `${lastPassPlayerName} 选择了过，其他玩家均已过牌，声明者开始翻牌`,
    });
    return true;
  }

  /**
   * 游戏开始时调用。
   * 负责：初始发牌、设置初始状态、通知玩家。
   * @param {Player[]} players - 所有玩家列表
   * @param {import('../Deck')} deck  - 已洗好的牌堆
   */
  onGameStart(players, deck) {
    // 规则 1：每人 4 张牌，固定 3 黑 1 红，除了颜色无任何区别。
    for (const player of players) {
      player.hand = this._buildInitialHand();
      // 私发手牌（其他玩家不可见）
      this.room._emit(player.id, 'deal_hand', { hand: player.hand });
    }

    const turnOrder = players.map(p => p.id);
    const tableCards = [];

    this.room.gameState = {
      currentTurn: turnOrder[0],
      turnOrder,
      turnIndex: 0,
      round: 1,
      tableCards,
      initialPlacementPhase: true,
      declaredBlack: 0,
      declaredBy: null,
      passedPlayers: [],
      revealMode: false,
      revealedBlack: 0,
      initialDeclareRequired: false,
      forcedFirstDeclarer: null,
      awaitingRps: false,
      rpsParticipants: [],
      rpsChoices: {},
      info: '开局阶段：每位玩家需手动扣置 1 张牌',
    };

    this.room._broadcast('game_started', this.room._getRoomState());
    this._syncState();
  }

  /**
   * 收到玩家操作时调用。
   * @param {string} playerId
   * @param {string} action  - 动作名称，如 'play', 'draw', 'fold'
   * @param {any}    data    - 动作携带的数据
   */
  onAction(playerId, action, data) {
    const gs = this.room.gameState;
    const allInitialPlaced = this._allPlayersInitialPlaced();
    const isInitialDeclarePhase = allInitialPlaced && gs.initialDeclareRequired;

    if (gs.awaitingRps) {
      if (action !== 'rps_pick') {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '当前处于石头剪刀布阶段，请先完成选择',
        });
        return;
      }

      const participants = gs.rpsParticipants || [];
      if (!participants.includes(playerId)) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '你不在本轮石头剪刀布参与名单中',
        });
        return;
      }

      const choice = data?.choice;
      if (!['rock', 'paper', 'scissors'].includes(choice)) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '无效选择，请选择石头/剪刀/布',
        });
        return;
      }

      gs.rpsChoices[playerId] = choice;
      this._syncState();
      this.room._emit(playerId, 'action_ack', {
        playerId,
        action,
        message: '已提交石头剪刀布选择',
      });
      this._resolveRpsRound();
      return;
    }

    // 首次声明阶段：允许任意玩家声明一次，不受当前回合限制。
    if (isInitialDeclarePhase) {
      if (action !== 'declare') {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '游戏开始后必须先完成一次声明',
        });
        return;
      }
    }

    if (gs.revealMode) {
      if (action !== 'reveal_table_card') {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '当前是翻牌阶段，仅可执行翻牌操作',
        });
        return;
      }
      if (playerId !== gs.declaredBy) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '只有声明者可以翻牌',
        });
        return;
      }
    }

    const currentTurn = this.room.gameState.currentTurn;
    if (!isInitialDeclarePhase && playerId !== currentTurn) {
      this.room._emit(playerId, 'action_ack', {
        playerId,
        action,
        message: '未轮到你的回合',
      });
      return;
    }

    // 开局首次扣置阶段：仅允许尚未完成首扣的玩家执行扣置。
    if (!allInitialPlaced) {
      if (action !== 'place_face_down') {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '开局阶段只能先扣置 1 张牌',
        });
        return;
      }
      const initialPlacedSet = this._getInitialPlacedSet();
      if (initialPlacedSet.has(playerId)) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '你已完成首次扣置，请等待其他玩家完成',
        });
        return;
      }
    }

    if (action === 'place_face_down') {
      const player = this.room.players.get(playerId);
      if (!player) return;
      if (!player.hand.length) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '你手中无牌，不能扣置',
        });
        return;
      }

      const indexes = Array.isArray(data?.cardIndexes) ? data.cardIndexes : [];
      if (indexes.length !== 1) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '请选择且仅选择 1 张手牌进行扣置',
        });
        return;
      }

      const cardIndex = indexes[0];
      if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= player.hand.length) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '所选手牌无效',
        });
        return;
      }

      const [placedCard] = player.hand.splice(cardIndex, 1);
      if (!placedCard) return;

      this.room.gameState.tableCards = this.room.gameState.tableCards || [];
      this.room.gameState.tableCards.push({
        ownerId: playerId,
        card: placedCard,
        faceDown: true,
      });

      // 规则：扣置后已声明黑牌数归 0
      this._resetDeclaration();

      // 私发最新手牌给该玩家
      this.room._emit(playerId, 'deal_hand', { hand: player.hand });

      if (gs.initialPlacementPhase) {
        const allInitialDone = this._allPlayersInitialPlaced();
        if (allInitialDone) {
          // 首次扣置完成后进入石头剪刀布，决定首个声明权（仅触发一次）。
          gs.initialPlacementPhase = false;
          const participants = [...this.room.players.values()].map(p => p.id);
          this._startRpsPhase(participants);
        } else {
          this.room.gameState.info = '开局阶段：每位玩家需手动扣置 1 张牌';
          this._nextTurn();
          this._syncState();
        }
      } else {
        // 正常对局中的扣置，不再触发石头剪刀布。
        this._nextTurn();
        this._syncState();
      }

      this.room._broadcast('action_ack', {
        playerId,
        action,
        message: `${player.name} 扣置了 1 张牌`,
      });
      return;
    }

    if (action === 'declare') {
      if (!allInitialPlaced) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '所有玩家完成首次扣置前，不能声明',
        });
        return;
      }

      if (isInitialDeclarePhase && gs.forcedFirstDeclarer && gs.forcedFirstDeclarer !== playerId) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '首个声明权不在你，请等待获胜玩家先声明',
        });
        return;
      }

      const player = this.room.players.get(playerId);
      if (!player) return;

      const value = Number.parseInt(data?.declaredBlack, 10);
      if (!Number.isInteger(value) || value < 1) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '声明值必须是大于 0 的整数',
        });
        return;
      }

      const currentDeclared = this.room.gameState.declaredBlack || 0;
      if (value <= currentDeclared) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: `声明失败：必须大于当前声明值 ${currentDeclared}`,
        });
        return;
      }

      gs.declaredBlack = value;
      gs.declaredBy = playerId;
      gs.passedPlayers = [];
      gs.revealMode = false;
      gs.revealedBlack = 0;
      gs.initialDeclareRequired = false;
      gs.forcedFirstDeclarer = null;

      // 如果是首次声明阶段，后续从声明者的下一位开始正常轮转。
      if (isInitialDeclarePhase) {
        this._setCurrentTurn(playerId);
      }

      this._nextTurn();
      this._syncState();

      this.room._broadcast('action_ack', {
        playerId,
        action,
        message: `${player.name} 声明了黑牌数量：${value}`,
      });
      return;
    }

    if (action === 'pass') {
      if (!allInitialPlaced) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '所有玩家完成首次扣置前，不能选择过',
        });
        return;
      }

      if ((gs.declaredBlack || 0) === 0) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '当前已声明黑牌数为 0，不能选择过',
        });
        return;
      }

      const player = this.room.players.get(playerId);
      if (!player) return;

      const declaredBlack = gs.declaredBlack || 0;
      const declaredBy = gs.declaredBy;
      if (declaredBlack > 0 && declaredBy && declaredBy !== playerId) {
        const currentPassed = new Set(gs.passedPlayers || []);
        currentPassed.add(playerId);
        gs.passedPlayers = [...currentPassed];

        if (this._tryEnterRevealMode(player.name)) {
          return;
        }
      }

      this._nextTurn();
      this._syncState();

      this.room._broadcast('action_ack', {
        playerId,
        action,
        message: `${player.name} 选择了过`,
      });
      return;
    }

    if (action === 'reveal_table_card') {
      const index = data?.tableCardIndex;
      const tableCards = gs.tableCards || [];
      if (!Number.isInteger(index) || index < 0 || index >= tableCards.length) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '请选择 1 张有效的场上扣牌',
        });
        return;
      }

      const target = tableCards[index];
      if (!target.faceDown) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '该牌已翻开，请选择其他背面牌',
        });
        return;
      }

      if (!this._isTopFaceDownCardOfOwner(index)) {
        this.room._emit(playerId, 'action_ack', {
          playerId,
          action,
          message: '该玩家此牌下方仍有未翻开的牌，需先翻栈顶牌',
        });
        return;
      }

      target.faceDown = false;
      const colorText = target.card.color === 'red' ? '红' : '黑';
      this.room._broadcast('action_ack', {
        playerId,
        action,
        message: `翻开了 1 张牌，颜色是${colorText}`,
      });

      if (target.card.color === 'red') {
        const tableCards = gs.tableCards || [];
        const declarer = this.room.players.get(gs.declaredBy);
        const declarerName = declarer?.name || '声明玩家';
        gs.info = `${declarerName} 翻到红牌，判负`;
        this._syncState();
        this.room.handleRoundOutcome({
          declarerId: gs.declaredBy,
          success: false,
          resultCode: 'fail_red',
          declaredBlack: gs.declaredBlack || 0,
          revealedBlack: gs.revealedBlack || 0,
          winners: [],
          revealedCards: this._buildRoundResultCards(),
        });
        return;
      }

      gs.revealedBlack = (gs.revealedBlack || 0) + 1;

      this.room._broadcast('action_ack', {
        playerId,
        action,
        message: `已翻黑牌 ${gs.revealedBlack}/${gs.declaredBlack}`,
      });

      if (!this._checkRevealResult()) {
        this._syncState();
      }
      return;
    }

    this.room._emit(playerId, 'action_ack', {
      playerId,
      action,
      message: '该动作尚未实现',
    });
  }

  /**
   * 玩家中途离开时调用。
   * @param {string} playerId
   */
  onPlayerLeave(playerId) {
    // 默认：剩余玩家不足则结束游戏
    if (this.room.players.size < 2) {
      this.room.endGame({ reason: '玩家不足', winners: [] });
    }
  }
}

module.exports = BaseRule;
