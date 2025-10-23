// main.js - 贪吃蛇游戏主文件
const SnakeGame = require('./game/snakegame');
const FriendRank = require('./game/friendRank');

class Main {
  constructor() {
    try {
      console.log('Main class constructor starting...');
      this.friendRank = new FriendRank();
      this.game = new SnakeGame(this.friendRank);
      // 使用 setTimeout 确保在下一个事件循环中初始化
      setTimeout(() => {
        this.init().catch(error => {
          console.error('Main class init error:', error);
          this.showError('游戏初始化失败，请重试');
        });
      }, 50);
      console.log('Main class constructor completed successfully');
    } catch (error) {
      console.error('Main class constructor error:', error);
      this.showError('游戏初始化失败，请重试');
    }
  }

  async init() {
    try {
      console.log('Main class initializing...');
      
      // 初始化用户信息
      try {
        await this.friendRank.initUserInfo();
        
        // 获取好友排行榜
        await this.friendRank.getFriendRank();
        
        // 更新全局实例
        if (typeof global !== 'undefined') {
          global.friendRankInstance = this.friendRank;
        }
      } catch (error) {
        console.error('初始化好友系统失败:', error);
      }
      
      // 初始化游戏（现在是异步的）
      await this.game.init();
      
      // 绑定触摸事件
      this.bindEvents();
      
      console.log('Main class initialization completed');
    } catch (error) {
      console.error('Main class init error:', error);
      this.showError('游戏启动失败，请重试');
    }
  }

  showError(message) {
    console.error('Game Error:', message);
    // 可以在这里添加用户可见的错误提示
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    });
  }

  bindEvents() {
    // 触摸事件已经在SnakeGame中绑定，这里不需要重复绑定
    console.log('Main events initialized');
    
    // 监听页面显示事件
    if (typeof wx !== 'undefined' && wx.onShow) {
      wx.onShow((options) => {
        console.log('Page onShow - ensuring game is visible');
        
        // 处理分享场景（可以在这里添加群聊分享逻辑）
        if (options && options.shareTicket) {
          console.log('收到 shareTicket:', options.shareTicket);
        }
        
        // 确保游戏可见
        setTimeout(() => {
          if (this.game && this.game.canvas) {
            this.game.clearCanvas();
            this.game.render();
          }
        }, 100);
      });
      
      wx.onHide(() => {
        console.log('Page onHide - pausing game');
        // 页面隐藏时暂停游戏
        if (this.game && this.game.gameState === 'playing') {
          this.game.pauseGame();
        }
      });
    }
  }
}

module.exports = Main;
