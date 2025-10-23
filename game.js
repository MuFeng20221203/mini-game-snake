// game.js - 微信小游戏入口文件
console.log('Game.js starting...');

try {
  require('./js/libs/weapp-adapter')
  console.log('weapp-adapter loaded');
} catch (error) {
  console.error('weapp-adapter load error:', error);
}

try {
  require('./js/libs/symbol')
  console.log('symbol loaded');
} catch (error) {
  console.error('symbol load error:', error);
}

let gameInstance = null;
let friendRankInstance = null;

// 分享功能 - 必须在全局定义
function onShareAppMessage() {
  console.log('onShareAppMessage 被调用');
  const game = gameInstance;
  
  // 获取游戏数据
  const score = game ? game.score : 0;
  const bestScore = game ? game.bestScore : 0;
  const mode = game ? (game.mode === 'wall' ? '撞墙模式' : '穿墙模式') : '撞墙模式';
  
  // 获取好友数量
  const friendCount = friendRankInstance ? friendRankInstance.getFriendCount() : 0;
  
  // 生成分享标题
  let title = '🐍 经典贪吃蛇小游戏，快来挑战吧！';
  
  if (friendCount > 0) {
    title = `🐍 有${friendCount}个朋友在玩，快来挑战吧！`;
  }
  
  if (score > 0) {
    title = `🐍 我刚刚玩了${score}分，你能超过我吗？`;
  }
  
  if (bestScore > 0 && bestScore >= 50) {
    title = `🐍 我最高分${bestScore}分！你敢来挑战吗？`;
  }
  
  console.log('分享配置:', { title, score, bestScore, mode, friendCount });
  
  return {
    title: title,
    imageUrl: '', // 可以添加自定义分享图片
    query: `mode=${encodeURIComponent(mode)}&score=${score}&best=${bestScore}`,
    withShareTicket: true // 如果需要群聊分享功能（如群排行榜），设置为 true
  };
}

console.log('分享功能已注册');

try {
  const Main = require('./js/main')
  console.log('Main class loaded');
  
  const main = new Main()
  gameInstance = main.game;
  friendRankInstance = main.friendRank;
  console.log('Main instance created');
} catch (error) {
  console.error('Main creation error:', error);
}
