// main.js - 贪吃蛇游戏主文件
const SnakeGame = require('./game/snakegame');

class Main {
  constructor() {
    this.game = new SnakeGame();
    this.init();
  }

  init() {
    console.log('Main class initializing...');
    
    // 初始化游戏
    this.game.init();
    
    // 绑定触摸事件
    this.bindEvents();
  }

  bindEvents() {
    // 触摸事件已经在SnakeGame中绑定，这里不需要重复绑定
    console.log('Main events initialized');
  }
}

module.exports = Main;
