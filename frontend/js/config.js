/**
 * config.js —— 服务器地址配置
 *
 * 本地开发时自动连接 localhost；
 * 部署后将下面的 PRODUCTION_URL 替换为 Railway 分配的域名，
 * 或设置 window.CARD_GAME_SERVER 环境注入。
 */

const PRODUCTION_URL = 'https://game-production-46a5.up.railway.app';

window.SERVER_URL =
  window.CARD_GAME_SERVER ||          // 支持外部注入
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? `http://${location.hostname}:3001`
    : PRODUCTION_URL);
