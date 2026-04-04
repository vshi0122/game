/**
 * Deck —— 标准 52 张扑克牌（+ 可选大小王）管理。
 */

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

class Deck {
  /**
   * @param {object} options
   * @param {boolean} [options.includeJokers=false] 是否包含大小王
   */
  constructor({ includeJokers = false } = {}) {
    this.cards = [];
    this._build(includeJokers);
  }

  _build(includeJokers) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push({ suit, rank, value: this._getValue(rank) });
      }
    }
    if (includeJokers) {
      this.cards.push({ suit: '🃏', rank: 'Small Joker', value: 14 });
      this.cards.push({ suit: '🃏', rank: 'Big Joker',   value: 15 });
    }
  }

  _getValue(rank) {
    const map = { A: 1, J: 11, Q: 12, K: 13 };
    return map[rank] ?? parseInt(rank, 10);
  }

  /** Fisher–Yates 洗牌 */
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    return this;
  }

  /** 发 n 张牌，返回牌组 */
  deal(n = 1) {
    if (this.cards.length < n) throw new Error('牌堆已无足够的牌');
    return this.cards.splice(0, n);
  }

  /** 剩余牌数 */
  get remaining() {
    return this.cards.length;
  }
}

module.exports = Deck;
