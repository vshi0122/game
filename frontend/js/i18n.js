(function () {
  const STORAGE_KEY = 'cg_lang';
  const DEFAULT_LANG = 'zh';

  const dict = {
    zh: {
      'common.lang': '语言',
      'common.loading': '加载中...',

      'index.docTitle': '纸牌对战',
      'index.title': '🃏 纸牌对战',
      'index.subtitle': '多人在线实时对战',
      'index.rules': '查看规则',
      'index.yourName': '你的名称',
      'index.createRoom': '创建房间',
      'index.joinRoom': '加入房间',
      'index.publicRooms': '公开房间',
      'index.or': '或',
      'index.continueMode': '继续游戏模式',
      'index.continueModeDesc': '开启后：整场将在达到阈值时结束（例如 成功 {success} 次 或 失败 {fail} 次）。',
      'index.create': '创建',
      'index.join': '加入',
      'index.refresh': '🔄 刷新',
      'index.noRooms': '暂无公开房间',
      'index.maxPlayers': '人数上限',
      'index.createPassword': '房间密码（可选）',
      'index.successTarget': '成功达到（次）',
      'index.failTarget': '失败达到（次）',
      'index.roomNamePlaceholder': '房间名称（可选）',
      'index.maxPlayersPlaceholder': '2-8 人',
      'index.createPwPlaceholder': '房间密码（可选）',
      'index.namePlaceholder': '输入玩家名称…',
      'index.roomIdPlaceholder': '输入 6 位房间 ID',
      'index.joinPwPlaceholder': '房间密码（若有）',
      'index.peopleCount': '{count} 人',
      'index.peopleCountDetail': '已加入 {joined} / 上限 {max} 人',

      'lobby.needName': '请先输入玩家名称',
      'lobby.connected': '已连接到服务器',
      'lobby.connectError': '无法连接到服务器，请检查后端是否运行',
      'lobby.creatingRoom': '正在创建房间…',
      'lobby.createFailed': '创建失败：{error}',
      'lobby.joiningRoom': '正在加入房间…',
      'lobby.joinFailed': '加入失败：{error}',
      'lobby.needRoomId': '请输入 6 位房间 ID',
      'lobby.defaultRoomName': '{name} 的房间',

      'game.docTitle': '纸牌对战 - 游戏中',
      'game.title': '🃏 纸牌对战',
      'game.rules': '规则',
      'game.leave': '离开',
      'game.players': '玩家列表',
      'game.start': '开始游戏',
      'game.waitReady': '等待所有玩家准备',
      'game.ready': '✅ 准备',
      'game.unready': '❌ 取消准备',
      'game.waiting': '等待游戏开始…',
      'game.roomLabel': '房间：{roomId}',
      'game.roomIdLabel': '房间 ID：',
      'game.copy': '复制',
      'game.copied': '✅ 已复制',
      'game.myPlaced': '我的已放牌（仅自己可见）',
      'game.chat': '聊天',
      'game.send': '发送',
      'game.chatPlaceholder': '发送消息…',
      'game.backLobby': '返回大厅',
      'game.continueRound': '继续下一轮',

      'game.phase.waiting': '等待中',
      'game.phase.ready': '准备',
      'game.phase.playing': '游戏中',
      'game.phase.ended': '已结束',
      'game.phase.rps': '猜拳中',
      'game.phase.place': '扣置阶段',
      'game.phase.firstDeclare': '首声明',
      'game.phase.reveal': '翻牌阶段',

      'game.instruction.waiting.host': '等待玩家准备完成，然后由你点击“开始游戏”。',
      'game.instruction.waiting.player': '先点击“准备”，等待房主开始游戏。',
      'game.instruction.ended.hostContinue': '本轮已结束。你可以点击“继续下一轮”，或返回大厅。',
      'game.instruction.ended.playerContinue': '本轮已结束，等待房主决定是否继续下一轮。',
      'game.instruction.ended.review': '本轮已结束，请先查看结算结果。',
      'game.instruction.rps.self': '请先出石头、剪刀或布，决定谁获得首个声明权。',
      'game.instruction.rps.wait': '等待石头剪刀布结果，系统将决定首个声明者。',
      'game.instruction.place.self': '请选择 1 张手牌扣置到场上，完成开局步骤。',
      'game.instruction.place.done': '你已完成扣置，等待其他玩家也各自扣置 1 张牌。',
      'game.instruction.place.wait': '等待 {name} 扣置 1 张牌，所有玩家完成后才进入下一阶段。',
      'game.instruction.firstDeclare.self': '轮到你先声明。请输入一个大于 0 的黑牌数量。',
      'game.instruction.firstDeclare.wait': '等待 {name} 先完成首个声明。',
      'game.instruction.reveal.self': '轮到你翻牌。请先翻每位玩家最上面的那张牌，目标是翻出 {count} 张黑牌。',
      'game.instruction.reveal.wait': '等待声明者 {name} 翻牌。',
      'game.instruction.turn.selfNoDeclare': '轮到你操作。你可以声明更大的黑牌数，或扣置 1 张牌。',
      'game.instruction.turn.selfDeclared': '轮到你操作。当前已声明 {count} 张黑牌，你可以继续声明、更换场牌，或选择过。',
      'game.instruction.turn.wait': '等待 {name} 操作。',

      'game.tag.host': '房主',
      'game.tag.me': '我',
      'game.tag.ready': '已准备',
      'game.tag.cards': '{count} 张',

      'game.turn.rps': '阶段：石头剪刀布决首声明',
      'game.turn.now': '轮到：{name}',
      'game.turn.banner': '轮到 {name}',

      'game.table.unknown': '未知',
      'game.table.mine': ' (我)',
      'game.table.faceDown': '背面牌 #{index}',
      'game.table.faceDownLocked': '背面牌 #{index}（这张牌被上面的牌压住了）',
      'game.table.stackTop': '这张牌上面还有别的牌，请先翻最上面的那张',
      'game.table.noSelection': '请先选择 1 张场上的背面牌',
      'game.table.hiddenCount': '背面剩余：{count}',
      'game.table.myOrder': '我的顺序 #{myOrder} · 场上顺序 #{globalOrder}',
      'game.table.top': '栈顶',
      'game.table.none': '你还没有放过牌',
      'game.table.deckInfoReveal': '场牌 {count} 张 · 翻牌中 {revealed}/{declared}（声明者：{name}）',
      'game.table.deckInfoDeclared': '场牌 {count} 张 · 已声明黑牌：{declared}{by}',
      'game.table.by': '（{name}）',

      'game.card.red': '红',
      'game.card.black': '黑',
      'game.card.white': '白',
      'game.card.redLabel': '红牌',
      'game.card.blackLabel': '黑牌',
      'game.card.whiteLabel': '白牌',

      'game.msg.disconnected': '与服务器断开连接，正在重连…',
      'game.msg.playerLeft': '{name} 离开了房间',
      'game.msg.started': '游戏开始！',
      'game.msg.nextRound': '下一轮已开始',
      'game.msg.waitRps': '等待石头剪刀布结果',
      'game.msg.waitFirstDeclarer': '等待首声明玩家操作',
      'game.msg.waitTurn': '等待你的回合',
      'game.msg.noAction': '当前阶段无可执行操作',
      'game.msg.rpsPhase': '当前是石头剪刀布阶段',
      'game.msg.notInRps': '你不在本轮石头剪刀布参与者中',
      'game.msg.notYourTurn': '未轮到你的回合',
      'game.msg.noFirstDeclareRight': '首个声明权不在你，请等待获胜玩家先声明',
      'game.msg.promptDeclare': '请输入要声明的黑牌数量（当前为 {current}，必须更大）',
      'game.msg.declareInteger': '声明值必须是大于 0 的整数',
      'game.msg.declareTooSmall': '声明失败：必须大于当前声明值 {current}',
      'game.msg.selectOneCard': '请先选择且仅选择 1 张手牌',
      'game.msg.passNotAllowed': '当前已声明黑牌数为 0，不能选择过',
      'game.msg.noHandCard': '你手中无牌，不能扣置',
      'game.msg.startFailed': '开始失败：{error}',
      'game.msg.continueFailed': '继续失败：{error}',
      'game.msg.helloWait': '你好，{name}！等待其他玩家加入…',
      'game.declareModal.title': '声明黑牌数量',
      'game.declareModal.tip': '当前声明值为 {current}，请输入更大的整数。',
      'game.declareModal.inputPlaceholder': '输入声明值',
      'game.declareModal.confirm': '确认声明',
      'game.declareModal.cancel': '取消',

      'game.log.rpsDrawReplay': '石头剪刀布平局，本轮参与者请重新选择',
      'game.log.rpsTiePlayoff': '石头剪刀布并列获胜，获胜玩家继续加赛',
      'game.log.rpsPhaseOnly': '当前处于石头剪刀布阶段，请先完成选择',
      'game.log.notInRpsRound': '你不在本轮石头剪刀布参与名单中',
      'game.log.invalidRpsChoice': '无效选择，请选择石头/剪刀/布',
      'game.log.rpsSubmitted': '已提交石头剪刀布选择',
      'game.log.mustDeclareAfterStart': '游戏开始后必须先完成一次声明',
      'game.log.revealOnly': '当前是翻牌阶段，仅可执行翻牌操作',
      'game.log.onlyDeclarerReveal': '只有声明者可以翻牌',
      'game.log.notYourTurn': '未轮到你的回合',
      'game.log.onlyPlaceAtStart': '开局阶段只能先扣置 1 张牌',
      'game.log.placedWaitOthers': '你已完成首次扣置，请等待其他玩家完成',
      'game.log.noHandCannotPlace': '你手中无牌，不能扣置',
      'game.log.selectExactlyOneHandCard': '请选择且仅选择 1 张手牌进行扣置',
      'game.log.invalidHandCard': '所选手牌无效',
      'game.log.cannotDeclareBeforeInitialPlacement': '所有玩家完成首次扣置前，不能声明',
      'game.log.noFirstDeclareRight': '首个声明权不在你，请等待获胜玩家先声明',
      'game.log.declareMustPositiveInt': '声明值必须是大于 0 的整数',
      'game.log.cannotPassBeforeInitialPlacement': '所有玩家完成首次扣置前，不能选择过',
      'game.log.cannotPassWhenDeclaredZero': '当前已声明黑牌数为 0，不能选择过',
      'game.log.selectValidTableCard': '请选择 1 张有效的场上扣牌',
      'game.log.cardAlreadyRevealed': '该牌已翻开，请选择其他背面牌',
      'game.log.mustRevealTopFirst': '这张牌上面还有别的牌，需先翻最上面的那张',
      'game.log.actionNotImplemented': '该动作尚未实现',
      'game.log.rpsWinnerFirstDeclare': '{name} 石头剪刀布获胜，请先声明',
      'game.log.playerPlacedOne': '{name} 扣置了 1 张牌',
      'game.log.playerDeclaredBlack': '{name} 声明了黑牌数量：{count}',
      'game.log.playerPassed': '{name} 选择了过',
      'game.log.revealedOneColor': '翻开了 1 张牌，颜色是{color}',
      'game.log.revealedBlackProgress': '已翻黑牌 {current}/{target}',
      'game.log.declareMustGreater': '声明失败：必须大于当前声明值 {current}',

      'game.action.place': '扣置 1 张',
      'game.action.reveal': '翻开 1 张',
      'game.action.declare': '声明',
      'game.action.pass': '过',
      'game.action.rock': '石头',
      'game.action.scissors': '剪刀',
      'game.action.paper': '布',
      'game.actionDesc.place': '从手牌中放 1 张到场上，并把当前声明值重置为 0。',
      'game.actionDesc.reveal': '翻开 1 张场上的背面牌，只能先翻该玩家最上面的那张。',
      'game.actionDesc.declareStart': '报出一个大于 0 的黑牌数量，开启本轮声明。',
      'game.actionDesc.declareRaise': '把当前声明值从 {count} 再往上抬高，迫使后手表态。',
      'game.actionDesc.pass': '接受当前 {count} 的声明，不再加码。若其他人也过，将进入翻牌。',
      'game.actionDesc.rps': '用石头剪刀布决定谁获得首个声明权。',
      'game.actionDesc.rpsRock': '石头克剪刀。',
      'game.actionDesc.rpsScissors': '剪刀克布。',
      'game.actionDesc.rpsPaper': '布克石头。',
      'game.actionDisabled.noHand': '你手里已经没有牌了，所以现在不能扣置。',
      'game.actionDisabled.passNeedsDeclare': '必须先有人声明大于 0 的黑牌数，之后才可以过。',
      'game.actionDisabled.revealSelect': '先点选 1 张可翻开的场牌，再执行翻牌。',
      'game.actionDisabled.waitFirstDeclarer': '首声明权属于 {name}，请先等待对方声明。',

      'game.result.roundOver': '本轮结束',
      'game.result.winners': '获胜：{names}',
      'game.result.stats': '战绩：{line}',
      'game.result.statLine': '{name} 成功{success}/失败{fail}',
      'game.result.title.success_exact': '声明成功，获胜！',
      'game.result.title.fail_red': '声明失败，翻到红牌',
      'game.result.title.fail_over': '声明失败，黑牌超出',
      'game.result.title.fail_insufficient': '声明失败，无法达成目标',
      'game.result.title.success': '本轮胜利',
      'game.result.title.fail': '本轮失败',
      'game.result.detail.success_exact': '{declarer} 声明黑牌 {declared}，实际翻出黑牌 {revealed}，声明达成。',
      'game.result.detail.fail_red': '{declarer} 在翻牌阶段翻到红牌，立即判负。',
      'game.result.detail.fail_over': '{declarer} 声明黑牌 {declared}，但已翻出黑牌 {revealed}（超出）。',
      'game.result.detail.fail_insufficient': '{declarer} 声明黑牌 {declared}，剩余牌不足以达成目标。',
      'game.result.cardMeta': '来源：{owner}<br>场上序号 #{globalOrder} · 该玩家序号 #{ownerOrder}',

      'rules.docTitle': '纸牌对战 - 规则说明',
      'rules.title': '🃏 规则说明',
      'rules.subtitle': '该页面可在大厅和游戏中随时打开查看（新标签页）。',
      'rules.backLobby': '返回大厅',
      'rules.backGame': '返回游戏页',
      'rules.1.title': '1. 牌与开局',
      'rules.1.1': '每位玩家开局获得 4 张牌，固定为 2 黑 1 红 1 白。',
      'rules.1.2': '开局阶段每位玩家必须先手动扣置 1 张牌到场上。',
      'rules.1.3': '所有玩家完成首次扣置后，进入石头剪刀布，决出首个声明玩家。',
      'rules.2.title': '2. 回合可执行动作',
      'rules.2.1': '声明黑牌数量：若场上已有声明值 x，新声明必须大于 x。',
      'rules.2.2': '扣置 1 张牌：从手牌选 1 张扣置到场上，并将已声明值归 0。',
      'rules.2.3': '过：仅当当前声明值大于 0 时可以选择过。',
      'rules.2.note': '补充：手中无牌时不能扣置。',
      'rules.3.title': '3. 翻牌与胜负',
      'rules.3.1': '当已声明值大于 0，且除声明者外其他玩家都选择过时，进入翻牌阶段。',
      'rules.3.2': '仅声明者可翻牌，且必须按每位玩家的“栈顶顺序”翻牌，不能跳层。',
      'rules.3.3': '翻到红牌立即失败。',
      'rules.3.4': '当已翻黑牌数达到声明值即成功。',
      'rules.3.5': '若已翻黑牌超过声明值或剩余牌不可能达成声明值，则失败。',
      'rules.4.title': '4. 多轮继续模式',
      'rules.4.1': '创建房间时可开启“继续游戏模式”。',
      'rules.4.2': '可设置成功次数和失败次数阈值（例如成功 2 次或失败 2 次结束整场）。',
      'rules.4.3': '每轮结算后若未达到阈值，房主可点击“继续下一轮”。'
    },
    en: {
      'common.lang': 'Language',
      'common.loading': 'Loading...',

      'index.docTitle': 'Card Duel',
      'index.title': '🃏 Card Duel',
      'index.subtitle': 'Multiplayer real-time online game',
      'index.rules': 'Rules',
      'index.yourName': 'Your Name',
      'index.createRoom': 'Create Room',
      'index.joinRoom': 'Join Room',
      'index.publicRooms': 'Public Rooms',
      'index.or': 'OR',
      'index.continueMode': 'Continue Match Mode',
      'index.continueModeDesc': 'When enabled, the match ends once a threshold is reached (e.g. {success} successes OR {fail} failures).',
      'index.create': 'Create',
      'index.join': 'Join',
      'index.refresh': '🔄 Refresh',
      'index.noRooms': 'No public rooms',
      'index.maxPlayers': 'Max players',
      'index.createPassword': 'Room password (optional)',
      'index.successTarget': 'Success threshold',
      'index.failTarget': 'Fail threshold',
      'index.roomNamePlaceholder': 'Room name (optional)',
      'index.maxPlayersPlaceholder': '2-8 players',
      'index.createPwPlaceholder': 'Room password (optional)',
      'index.namePlaceholder': 'Enter player name...',
      'index.roomIdPlaceholder': 'Enter 6-digit room ID',
      'index.joinPwPlaceholder': 'Room password (if any)',
      'index.peopleCount': '{count} players',
      'index.peopleCountDetail': 'Players: {joined}/{max}',

      'lobby.needName': 'Please enter your player name first',
      'lobby.connected': 'Connected to server',
      'lobby.connectError': 'Cannot connect to server. Please check backend status',
      'lobby.creatingRoom': 'Creating room...',
      'lobby.createFailed': 'Create failed: {error}',
      'lobby.joiningRoom': 'Joining room...',
      'lobby.joinFailed': 'Join failed: {error}',
      'lobby.needRoomId': 'Please enter a 6-digit room ID',
      'lobby.defaultRoomName': "{name}'s room",

      'game.docTitle': 'Card Duel - In Game',
      'game.title': '🃏 Card Duel',
      'game.rules': 'Rules',
      'game.leave': 'Leave',
      'game.players': 'Players',
      'game.start': 'Start Game',
      'game.waitReady': 'Waiting for all players to be ready',
      'game.ready': '✅ Ready',
      'game.unready': '❌ Cancel Ready',
      'game.waiting': 'Waiting for game to start...',
      'game.roomLabel': 'Room: {roomId}',
      'game.roomIdLabel': 'Room ID: ',
      'game.copy': 'Copy',
      'game.copied': '✅ Copied',
      'game.myPlaced': 'My placed cards (private)',
      'game.chat': 'Chat',
      'game.send': 'Send',
      'game.chatPlaceholder': 'Send a message...',
      'game.backLobby': 'Back to Lobby',
      'game.continueRound': 'Continue Next Round',

      'game.phase.waiting': 'Waiting',
      'game.phase.ready': 'Ready',
      'game.phase.playing': 'Playing',
      'game.phase.ended': 'Ended',
      'game.phase.rps': 'RPS',
      'game.phase.place': 'Placement',
      'game.phase.firstDeclare': 'First Declare',
      'game.phase.reveal': 'Reveal',

      'game.instruction.waiting.host': 'Wait until players are ready, then click Start Game.',
      'game.instruction.waiting.player': 'Click Ready first, then wait for the host to start the game.',
      'game.instruction.ended.hostContinue': 'This round is over. You can continue to the next round or return to the lobby.',
      'game.instruction.ended.playerContinue': 'This round is over. Waiting for the host to decide whether to continue.',
      'game.instruction.ended.review': 'This round is over. Review the result summary first.',
      'game.instruction.rps.self': 'Choose Rock, Scissors, or Paper to decide who gets the first declaration.',
      'game.instruction.rps.wait': 'Waiting for the Rock-Paper-Scissors result to determine the first declarer.',
      'game.instruction.place.self': 'Select 1 hand card and place it face-down on the table to finish setup.',
      'game.instruction.place.done': 'You have finished placement. Wait for other players to place 1 card each.',
      'game.instruction.place.wait': 'Waiting for {name} to place 1 card. The next phase starts after all players finish.',
      'game.instruction.firstDeclare.self': 'You must make the first declaration. Enter a black-card count greater than 0.',
      'game.instruction.firstDeclare.wait': 'Waiting for {name} to make the first declaration.',
      'game.instruction.reveal.self': 'It is your reveal turn. Reveal the top visible card of each player first and aim for {count} black cards.',
      'game.instruction.reveal.wait': 'Waiting for declarer {name} to reveal cards.',
      'game.instruction.turn.selfNoDeclare': 'It is your turn. You can declare a black-card count or place 1 card.',
      'game.instruction.turn.selfDeclared': 'It is your turn. {count} black cards are currently declared, so you may raise, place, or pass.',
      'game.instruction.turn.wait': 'Waiting for {name} to act.',

      'game.tag.host': 'Host',
      'game.tag.me': 'Me',
      'game.tag.ready': 'Ready',
      'game.tag.cards': '{count} cards',

      'game.turn.rps': 'Phase: Rock-Paper-Scissors for first declaration',
      'game.turn.now': 'Turn: {name}',
      'game.turn.banner': '{name}\'s turn',

      'game.table.unknown': 'Unknown',
      'game.table.mine': ' (Me)',
      'game.table.faceDown': 'Face-down #{index}',
      'game.table.faceDownLocked': 'Face-down #{index} (another card is covering this one)',
      'game.table.stackTop': 'Another card is on top of this one. Reveal the top card first',
      'game.table.noSelection': 'Please select one face-down card on the table',
      'game.table.hiddenCount': 'Face-down remaining: {count}',
      'game.table.myOrder': 'My order #{myOrder} · Table order #{globalOrder}',
      'game.table.top': 'Top',
      'game.table.none': 'You have not placed any cards yet',
      'game.table.deckInfoReveal': 'Table {count} cards · Revealing {revealed}/{declared} (Declarer: {name})',
      'game.table.deckInfoDeclared': 'Table {count} cards · Declared black cards: {declared}{by}',
      'game.table.by': ' ({name})',

      'game.card.red': 'Red',
      'game.card.black': 'Black',
      'game.card.white': 'White',
      'game.card.redLabel': 'Red card',
      'game.card.blackLabel': 'Black card',
      'game.card.whiteLabel': 'White card',

      'game.msg.disconnected': 'Disconnected from server. Reconnecting...',
      'game.msg.playerLeft': '{name} left the room',
      'game.msg.started': 'Game started!',
      'game.msg.nextRound': 'Next round has started',
      'game.msg.waitRps': 'Waiting for Rock-Paper-Scissors result',
      'game.msg.waitFirstDeclarer': 'Waiting for first declarer action',
      'game.msg.waitTurn': 'Waiting for your turn',
      'game.msg.noAction': 'No available action in current phase',
      'game.msg.rpsPhase': 'Current phase is Rock-Paper-Scissors',
      'game.msg.notInRps': 'You are not in this RPS participant group',
      'game.msg.notYourTurn': 'It is not your turn',
      'game.msg.noFirstDeclareRight': 'You do not have first declaration right. Wait for winner declaration first',
      'game.msg.promptDeclare': 'Enter declared black card count (current {current}, must be greater)',
      'game.msg.declareInteger': 'Declared value must be an integer greater than 0',
      'game.msg.declareTooSmall': 'Declare failed: value must be greater than {current}',
      'game.msg.selectOneCard': 'Please select exactly one hand card first',
      'game.msg.passNotAllowed': 'Declared black card count is 0, pass is not allowed',
      'game.msg.noHandCard': 'You have no hand cards and cannot place',
      'game.msg.startFailed': 'Start failed: {error}',
      'game.msg.continueFailed': 'Continue failed: {error}',
      'game.msg.helloWait': 'Hi, {name}! Waiting for other players to join...',
      'game.declareModal.title': 'Declare Black Card Count',
      'game.declareModal.tip': 'Current declared value is {current}. Enter a greater integer.',
      'game.declareModal.inputPlaceholder': 'Enter declared value',
      'game.declareModal.confirm': 'Confirm',
      'game.declareModal.cancel': 'Cancel',

      'game.log.rpsDrawReplay': 'RPS draw. Participants must choose again.',
      'game.log.rpsTiePlayoff': 'RPS tie among winners. Winners continue playoff.',
      'game.log.rpsPhaseOnly': 'RPS phase is active. Please finish your selection first.',
      'game.log.notInRpsRound': 'You are not in this round\'s RPS participant list.',
      'game.log.invalidRpsChoice': 'Invalid choice. Please choose Rock/Scissors/Paper.',
      'game.log.rpsSubmitted': 'RPS choice submitted.',
      'game.log.mustDeclareAfterStart': 'After game start, one declaration must be completed first.',
      'game.log.revealOnly': 'Reveal phase is active. Only reveal action is allowed.',
      'game.log.onlyDeclarerReveal': 'Only the declarer can reveal cards.',
      'game.log.notYourTurn': 'It is not your turn.',
      'game.log.onlyPlaceAtStart': 'At setup, you can only place one face-down card first.',
      'game.log.placedWaitOthers': 'You have completed initial placement. Wait for others.',
      'game.log.noHandCannotPlace': 'You have no hand cards and cannot place.',
      'game.log.selectExactlyOneHandCard': 'Please select exactly one hand card to place.',
      'game.log.invalidHandCard': 'Selected hand card is invalid.',
      'game.log.cannotDeclareBeforeInitialPlacement': 'Cannot declare until all players complete initial placement.',
      'game.log.noFirstDeclareRight': 'You do not have first declaration right. Wait for the winner to declare first.',
      'game.log.declareMustPositiveInt': 'Declared value must be an integer greater than 0.',
      'game.log.cannotPassBeforeInitialPlacement': 'Cannot pass until all players complete initial placement.',
      'game.log.cannotPassWhenDeclaredZero': 'Declared black count is 0, so pass is not allowed.',
      'game.log.selectValidTableCard': 'Please select one valid face-down table card.',
      'game.log.cardAlreadyRevealed': 'This card is already revealed. Please select another face-down card.',
      'game.log.mustRevealTopFirst': 'Another card is covering this one. Reveal the top card first.',
      'game.log.actionNotImplemented': 'This action is not implemented yet.',
      'game.log.rpsWinnerFirstDeclare': '{name} won RPS and must declare first.',
      'game.log.playerPlacedOne': '{name} placed 1 face-down card.',
      'game.log.playerDeclaredBlack': '{name} declared black cards: {count}.',
      'game.log.playerPassed': '{name} passed.',
      'game.log.revealedOneColor': 'Revealed 1 card, color: {color}.',
      'game.log.revealedBlackProgress': 'Revealed black cards {current}/{target}.',
      'game.log.declareMustGreater': 'Declare failed: value must be greater than current {current}.',

      'game.action.place': 'Place 1 Face-down',
      'game.action.reveal': 'Reveal 1 Card',
      'game.action.declare': 'Declare',
      'game.action.pass': 'Pass',
      'game.action.rock': 'Rock',
      'game.action.scissors': 'Scissors',
      'game.action.paper': 'Paper',
      'game.actionDesc.place': 'Place 1 hand card onto the table and reset the declared value to 0.',
      'game.actionDesc.reveal': 'Reveal 1 face-down table card. You must reveal that player\'s top card first.',
      'game.actionDesc.declareStart': 'Announce a black-card count greater than 0 to start the declaration.',
      'game.actionDesc.declareRaise': 'Raise the current declaration above {count} and pressure the next players to respond.',
      'game.actionDesc.pass': 'Accept the current declaration of {count} and do not raise. If others also pass, reveal phase begins.',
      'game.actionDesc.rps': 'Use Rock-Paper-Scissors to decide who gets first declaration.',
      'game.actionDesc.rpsRock': 'Rock beats Scissors.',
      'game.actionDesc.rpsScissors': 'Scissors beat Paper.',
      'game.actionDesc.rpsPaper': 'Paper beats Rock.',
      'game.actionDisabled.noHand': 'You have no hand cards left, so you cannot place right now.',
      'game.actionDisabled.passNeedsDeclare': 'Someone must first declare a black-card count greater than 0 before pass becomes available.',
      'game.actionDisabled.revealSelect': 'Select one revealable table card first, then reveal it.',
      'game.actionDisabled.waitFirstDeclarer': 'The first declaration belongs to {name}, so wait for that player to declare first.',

      'game.result.roundOver': 'Round Over',
      'game.result.winners': 'Winners: {names}',
      'game.result.stats': 'Stats: {line}',
      'game.result.statLine': '{name} success {success}/fail {fail}',
      'game.result.title.success_exact': 'Declaration Success',
      'game.result.title.fail_red': 'Declaration Failed: Red Card',
      'game.result.title.fail_over': 'Declaration Failed: Black Cards Exceeded',
      'game.result.title.fail_insufficient': 'Declaration Failed: Target Impossible',
      'game.result.title.success': 'Round Won',
      'game.result.title.fail': 'Round Lost',
      'game.result.detail.success_exact': '{declarer} declared {declared} black cards and revealed {revealed}. Target reached.',
      'game.result.detail.fail_red': '{declarer} revealed a red card during reveal phase and immediately lost.',
      'game.result.detail.fail_over': '{declarer} declared {declared} black cards but revealed {revealed} (exceeded).',
      'game.result.detail.fail_insufficient': '{declarer} declared {declared} black cards, but remaining cards could not reach the target.',
      'game.result.cardMeta': 'Source: {owner}<br>Table order #{globalOrder} · Player stack order #{ownerOrder}',

      'rules.docTitle': 'Card Duel - Rules',
      'rules.title': '🃏 Rules',
      'rules.subtitle': 'You can open this page from the lobby or game at any time (new tab).',
      'rules.backLobby': 'Back to Lobby',
      'rules.backGame': 'Back to Game',
      'rules.1.title': '1. Cards and Setup',
      'rules.1.1': 'Each player starts with 4 cards: 2 black, 1 red, and 1 white.',
      'rules.1.2': 'During setup, each player must place 1 face-down card on the table.',
      'rules.1.3': 'After all players place the first card, play Rock-Paper-Scissors to decide the first declarer.',
      'rules.2.title': '2. Available Actions Per Turn',
      'rules.2.1': 'Declare black card count: if current declared value is x, your new declaration must be greater than x.',
      'rules.2.2': 'Place 1 card face-down from hand and reset declared value to 0.',
      'rules.2.3': 'Pass: only available when declared value is greater than 0.',
      'rules.2.note': 'Note: you cannot place if you have no hand cards.',
      'rules.3.title': '3. Reveal and Win/Lose',
      'rules.3.1': 'When declared value is greater than 0 and all non-declarers pass, reveal phase starts.',
      'rules.3.2': 'Only the declarer can reveal cards, and must reveal in stack-top order for each player.',
      'rules.3.3': 'Revealing a red card causes immediate failure.',
      'rules.3.4': 'If revealed black count reaches declared value, it is a success.',
      'rules.3.5': 'If revealed black exceeds declared value, or target becomes impossible with remaining cards, it is a failure.',
      'rules.4.title': '4. Continue Match Mode',
      'rules.4.1': 'You can enable Continue Match Mode when creating a room.',
      'rules.4.2': 'Set success and failure thresholds (for example, 2 successes or 2 failures ends the match).',
      'rules.4.3': 'After each round, if thresholds are not reached, host can click Continue Next Round.'
    }
  };

  function getLang() {
    const raw = (localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG).toLowerCase();
    return raw === 'en' ? 'en' : 'zh';
  }

  function setLang(lang) {
    const safe = lang === 'en' ? 'en' : 'zh';
    localStorage.setItem(STORAGE_KEY, safe);
    applyPage();
    window.dispatchEvent(new CustomEvent('lang_changed', { detail: { lang: safe } }));
  }

  function t(key, vars) {
    const lang = getLang();
    const source = dict[lang] || dict.zh;
    let txt = source[key] || dict.zh[key] || key;
    if (vars && typeof vars === 'object') {
      Object.keys(vars).forEach((k) => {
        txt = txt.replaceAll(`{${k}}`, String(vars[k]));
      });
    }
    return txt;
  }

  function setText(id, key, vars) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key, vars);
  }

  function setPlaceholder(id, key) {
    const el = document.getElementById(id);
    if (el) el.placeholder = t(key);
  }

  function setupLanguageSelectors() {
    const lang = getLang();
    const selectors = document.querySelectorAll('#lang-select');
    selectors.forEach((sel) => {
      sel.value = lang;
      if (!sel.dataset.i18nBound) {
        sel.dataset.i18nBound = '1';
        sel.addEventListener('change', () => setLang(sel.value));
      }
    });
  }

  function applyIndex() {
    document.title = t('index.docTitle');
    setText('lang-label', 'common.lang');
    setText('lobby-title', 'index.title');
    setText('lobby-subtitle', 'index.subtitle');
    setText('btn-rules', 'index.rules');
    setText('label-your-name', 'index.yourName');
    setText('label-create-room', 'index.createRoom');
    setText('label-join-room', 'index.joinRoom');
    setText('label-public-rooms', 'index.publicRooms');
    setText('label-or', 'index.or');
    setText('label-continue-mode', 'index.continueMode');
    setText('label-max-players', 'index.maxPlayers');
    setText('label-create-password', 'index.createPassword');
    setText('label-success-target', 'index.successTarget');
    setText('label-fail-target', 'index.failTarget');
    setText('btn-create', 'index.create');
    setText('btn-join', 'index.join');
    setText('btn-refresh', 'index.refresh');

    setPlaceholder('player-name', 'index.namePlaceholder');
    setPlaceholder('room-name', 'index.roomNamePlaceholder');
    setPlaceholder('max-players', 'index.maxPlayersPlaceholder');
    setPlaceholder('create-password', 'index.createPwPlaceholder');
    setPlaceholder('room-id', 'index.roomIdPlaceholder');
    setPlaceholder('join-password', 'index.joinPwPlaceholder');

    const successInput = document.getElementById('success-target');
    const failInput = document.getElementById('fail-target');
    const continueDesc = document.getElementById('continue-mode-desc');
    if (continueDesc) {
      const success = successInput?.value || '2';
      const fail = failInput?.value || '2';
      continueDesc.textContent = t('index.continueModeDesc', { success, fail });
    }

    const emptyHint = document.querySelector('#room-list .empty-hint');
    if (emptyHint) emptyHint.textContent = t('index.noRooms');
  }

  function applyGame() {
    document.title = t('game.docTitle');
    setText('lang-label', 'common.lang');
    setText('game-title', 'game.title');
    setText('btn-rules', 'game.rules');
    setText('btn-leave', 'game.leave');
    setText('label-player-list', 'game.players');
    setText('btn-start', 'game.start');
    setText('host-hint', 'game.waitReady');
    setText('label-waiting', 'game.waiting');
    setText('label-room-id', 'game.roomIdLabel');
    setText('btn-copy-id', 'game.copy');
    setText('label-my-private', 'game.myPlaced');
    setText('label-chat', 'game.chat');
    setText('btn-send', 'game.send');
    setText('btn-continue-round', 'game.continueRound');
    setText('btn-back-lobby', 'game.backLobby');
    setText('btn-table-continue-round', 'game.continueRound');
    setText('btn-table-back-lobby', 'game.backLobby');
    setText('declare-modal-title', 'game.declareModal.title');
    setText('btn-declare-cancel', 'game.declareModal.cancel');
    setText('btn-declare-confirm', 'game.declareModal.confirm');
    setPlaceholder('chat-input', 'game.chatPlaceholder');
    setPlaceholder('declare-modal-input', 'game.declareModal.inputPlaceholder');
  }

  function applyRules() {
    document.title = t('rules.docTitle');
    setText('lang-label', 'common.lang');
    setText('rules-title', 'rules.title');
    setText('rules-subtitle', 'rules.subtitle');
    setText('btn-back-lobby', 'rules.backLobby');
    setText('btn-back-game', 'rules.backGame');
    setText('rule1-title', 'rules.1.title');
    setText('rule1-1', 'rules.1.1');
    setText('rule1-2', 'rules.1.2');
    setText('rule1-3', 'rules.1.3');
    setText('rule2-title', 'rules.2.title');
    setText('rule2-1', 'rules.2.1');
    setText('rule2-2', 'rules.2.2');
    setText('rule2-3', 'rules.2.3');
    setText('rule2-note', 'rules.2.note');
    setText('rule3-title', 'rules.3.title');
    setText('rule3-1', 'rules.3.1');
    setText('rule3-2', 'rules.3.2');
    setText('rule3-3', 'rules.3.3');
    setText('rule3-4', 'rules.3.4');
    setText('rule3-5', 'rules.3.5');
    setText('rule4-title', 'rules.4.title');
    setText('rule4-1', 'rules.4.1');
    setText('rule4-2', 'rules.4.2');
    setText('rule4-3', 'rules.4.3');
  }

  function applyPage() {
    const lang = getLang();
    document.documentElement.lang = lang;
    setupLanguageSelectors();

    const path = (location.pathname || '').toLowerCase();
    if (path.endsWith('/index.html') || path === '/' || path.endsWith('/yx/') || path.endsWith('/yx')) {
      applyIndex();
      return;
    }
    if (path.endsWith('/game.html')) {
      applyGame();
      return;
    }
    if (path.endsWith('/rules.html')) {
      applyRules();
    }
  }

  window.I18N = {
    getLang,
    setLang,
    t,
    applyPage
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPage);
  } else {
    applyPage();
  }
})();
