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

try {
  const Main = require('./js/main')
  console.log('Main class loaded');
  
  new Main()
  console.log('Main instance created');
} catch (error) {
  console.error('Main creation error:', error);
}
