// snakegame.js - 贪吃蛇游戏核心逻辑
const Canvas = require('./canvas');
const Snake = require('./snakeclass');
const Food = require('./food');

class SnakeGame {
  constructor() {
    this.canvas = new Canvas();
    this.snake = new Snake();
    this.food = new Food();
    
    this.gameState = 'init'; // stopped, playing, paused
    this.score = 0;
    this.level = 1;
    this.bestScore = parseInt(wx.getStorageSync('bestScore') || '0');
    this.mode = 'wall'; // wall, through
    
    this.gameLoop = null;
    this.lastTime = 0;
    this.speed = 200; // 毫秒
  }

  async init() {
    try {
      console.log('SnakeGame initializing...');
      
      // 等待 Canvas 异步初始化完成
      await this.canvas.init();
      console.log('Canvas initialized');
      
      this.snake.init(this.canvas.gridWidth, this.canvas.gridHeight);
      console.log('Snake initialized');
      
      this.food.generate(this.snake.getBody(), this.canvas.gridWidth, this.canvas.gridHeight);
      console.log('Food generated');
      
      // 延迟渲染，确保 Canvas 完全准备就绪
      setTimeout(() => {
        this.render();
        console.log('Initial render completed');
      }, 50);
      
      this.bindEvents();
      console.log('Events bound');
      
      console.log('SnakeGame initialization completed successfully');
    } catch (error) {
      console.error('SnakeGame init error:', error);
      throw error; // 重新抛出错误，让上层处理
    }
  }

  bindEvents() {
    // 绑定按钮事件
    this.bindButtonEvents();
    
    // 绑定触摸滑动事件
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    // 绑定触摸事件
    wx.onTouchStart((e) => {
      this.onTouchStart(e);
    });

    wx.onTouchMove((e) => {
      // 可以在这里处理触摸移动
    });

    wx.onTouchEnd((e) => {
      this.onTouchEnd(e);
    });
  }

  bindButtonEvents() {
    // 微信小游戏中，按钮事件通常通过触摸事件处理
    // 这里先不绑定具体按钮事件，后续可以通过触摸坐标判断
    console.log('Button events initialized');
  }

  onTouchStart(e) {
    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  }

  onTouchEnd(e) {
    if (e.changedTouches.length > 0) {
      const touchX = e.changedTouches[0].clientX;
      const touchY = e.changedTouches[0].clientY;
      
      console.log('Touch end at:', touchX, touchY);
      
      // 检查是否点击了按钮
      if (this.checkButtonClick(touchX, touchY)) {
        console.log('Button clicked');
        return;
      }
      
      // 处理滑动方向
      const deltaX = touchX - this.touchStartX;
      const deltaY = touchY - this.touchStartY;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (deltaX > 30) {
          this.snake.changeDirection('right');
        } else if (deltaX < -30) {
          this.snake.changeDirection('left');
        }
      } else {
        // 垂直滑动
        if (deltaY > 30) {
          this.snake.changeDirection('down');
        } else if (deltaY < -30) {
          this.snake.changeDirection('up');
        }
      }
    }
  }

  checkButtonClick(touchX, touchY) {
    // 计算游戏区域位置和尺寸
    const gameAreaX = this.canvas.gridSize;
    const gameAreaY = 120 + this.canvas.gridSize;
    const availableWidth = this.canvas.width - 2 * this.canvas.gridSize;
    const availableHeight = this.canvas.height - 200;
    const gameAreaSize = Math.min(availableWidth, availableHeight);
    const gameAreaBottom = gameAreaY + gameAreaSize;
    
    const buttonY = gameAreaBottom + 10; // 贴着游戏框底部
    const buttonWidth = 60;
    const buttonHeight = 30;
    const buttonSpacing = (gameAreaSize - 4 * buttonWidth) / 3; // 按钮间距基于游戏区域宽度
    const startX = gameAreaX; // 从游戏框左边开始
    
    const buttonTexts = ['切换穿墙', '开始', '暂停', '重开'];
    
    console.log('Button detection:', {
      touchX, touchY,
      buttonY, buttonWidth, buttonHeight,
      buttonSpacing, startX,
      gameAreaBottom
    });
    
    for (let i = 0; i < buttonTexts.length; i++) {
      const buttonX = startX + i * (buttonWidth + buttonSpacing);
      
      console.log(`Button ${i} (${buttonTexts[i]}):`, {
        buttonX, buttonY,
        right: buttonX + buttonWidth,
        bottom: buttonY + buttonHeight,
        inX: touchX >= buttonX && touchX <= buttonX + buttonWidth,
        inY: touchY >= buttonY && touchY <= buttonY + buttonHeight
      });
      
      if (touchX >= buttonX && touchX <= buttonX + buttonWidth &&
          touchY >= buttonY && touchY <= buttonY + buttonHeight) {
        
        console.log(`Clicked button: ${buttonTexts[i]}`);
        
        // 处理按钮点击
        switch (buttonTexts[i]) {
          case '切换穿墙':
            this.mode = this.mode === 'wall' ? 'through' : 'wall';
            console.log('Mode changed to:', this.mode);
            // 立即重新渲染以更新UI显示
            this.render();
            break;
          case '开始':
            this.startGame();
            break;
          case '暂停':
            this.pauseGame();
            break;
          case '重开':
            this.restartGame();
            break;
        }
        return true;
      }
    }
    return false;
  }

  startGame() {
    if (this.gameState === 'stopped' || this.gameState === 'paused' || this.gameState === 'init') {
      // 如果游戏完全停止（游戏结束后），需要重新初始化游戏数据
      if (this.gameState === 'stopped') {
        this.resetGameData();
      }
      
      this.gameState = 'playing';
      // 清除可能存在的旧定时器
      if (this.gameLoop) {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
      }
      this.gameLoop = setInterval(() => {
        this.update();
        this.render();
      }, this.speed);
      console.log('Game started/resumed');
    }
  }

  pauseGame() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      clearInterval(this.gameLoop);
      console.log('Game paused');
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.gameLoop = setInterval(() => {
        this.update();
        this.render();
      }, this.speed);
      console.log('Game resumed from pause');
    }
  }

  resetGameData() {
    // 重置游戏数据，但不改变游戏状态
    this.score = 0;
    this.level = 1;
    this.speed = 200;
    this.snake.init(this.canvas.gridWidth, this.canvas.gridHeight);
    this.food.generate(this.snake.getBody(), this.canvas.gridWidth, this.canvas.gridHeight);
    this.render();
    console.log('Game data reset for new game');
  }

  restartGame() {
    this.gameState = 'init';
    clearInterval(this.gameLoop);
    this.gameLoop = null;
    this.resetGameData();
  }

  update() {
    if (this.gameState !== 'playing') return;

    // 先检查移动后是否会碰撞
    if (this.checkCollision()) {
      this.gameOver();
      return;
    }

    // 检查是否吃到食物（在移动之前）
    if (this.snake.checkFood(this.food.getPosition())) {
      this.snake.grow();
      this.food.generate(this.snake.getBody(), this.canvas.gridWidth, this.canvas.gridHeight);
      this.score += 10;
      
      // 升级
      if (this.score > 0 && this.score % 100 === 0) {
        this.level++;
        this.speed = Math.max(100, this.speed - 20);
      }
    }

    // 执行移动（根据模式处理）
    if (this.mode === 'through') {
      this.moveWithThroughWall();
    } else {
      this.snake.move();
    }
  }

  moveWithThroughWall() {
    // 穿墙模式下的移动逻辑
    this.snake.direction = this.snake.nextDirection;
    
    const head = { ...this.snake.getHead() };
    
    // 计算游戏区域的实际网格尺寸
    const availableWidth = this.canvas.width - 2 * this.canvas.gridSize;
    const availableHeight = this.canvas.height - 200;
    const gameAreaSize = Math.min(availableWidth, availableHeight);
    const actualGridWidth = Math.floor(gameAreaSize / this.canvas.gridSize);
    const actualGridHeight = Math.floor(gameAreaSize / this.canvas.gridSize);
    
    // 根据方向移动头部
    switch (this.snake.direction) {
      case 'up':
        head.y--;
        // 如果超出上边界，从下边界出现
        if (head.y < 0) {
          head.y = actualGridHeight - 1;
        }
        break;
      case 'down':
        head.y++;
        // 如果超出下边界，从上边界出现
        if (head.y >= actualGridHeight) {
          head.y = 0;
        }
        break;
      case 'left':
        head.x--;
        // 如果超出左边界，从右边界出现
        if (head.x < 0) {
          head.x = actualGridWidth - 1;
        }
        break;
      case 'right':
        head.x++;
        // 如果超出右边界，从左边界出现
        if (head.x >= actualGridWidth) {
          head.x = 0;
        }
        break;
    }
    
    console.log('Through wall move:', {
      direction: this.snake.direction,
      headPosition: head,
      gridSize: `${actualGridWidth}x${actualGridHeight}`
    });
    
    // 更新蛇身
    this.snake.body.unshift(head);
    this.snake.body.pop();
  }

  checkCollision() {
    // 计算移动后的头部位置
    const head = { ...this.snake.getHead() };
    
    switch (this.snake.direction) {
      case 'up':
        head.y--;
        break;
      case 'down':
        head.y++;
        break;
      case 'left':
        head.x--;
        break;
      case 'right':
        head.x++;
        break;
    }
    
    // 计算实际的网格尺寸（与drawGameArea保持一致）
    const availableWidth = this.canvas.width - 2 * this.canvas.gridSize;
    const availableHeight = this.canvas.height - 200;
    const gameAreaSize = Math.min(availableWidth, availableHeight);
    const actualGridWidth = Math.floor(gameAreaSize / this.canvas.gridSize);
    const actualGridHeight = Math.floor(gameAreaSize / this.canvas.gridSize);
    
    // 检查撞墙（如果不是穿墙模式）
    if (this.mode === 'wall') {
      // 使用实际计算的网格尺寸进行边界检测
      const willCollide = head.x < 0 || head.x >= actualGridWidth || 
                         head.y < 0 || head.y >= actualGridHeight;
      
      if (willCollide) {
        console.log('Wall collision detected:', {
          headX: head.x, 
          headY: head.y, 
          storedGridWidth: this.canvas.gridWidth, 
          storedGridHeight: this.canvas.gridHeight,
          actualGridWidth,
          actualGridHeight,
          direction: this.snake.direction,
          bounds: {
            minX: 0,
            maxX: actualGridWidth - 1,
            minY: 0,
            maxY: actualGridHeight - 1
          },
          note: `蛇头在网格坐标(${head.x}, ${head.y})，实际边界是(0,0)到(${actualGridWidth-1}, ${actualGridHeight-1})`
        });
        return true;
      } else {
        // 添加正常移动的调试信息
        console.log('Snake moving normally:', {
          headX: head.x, 
          headY: head.y, 
          direction: this.snake.direction,
          actualBounds: `(0,0) to (${actualGridWidth-1}, ${actualGridHeight-1})`,
          withinBounds: true
        });
      }
    } else {
      // 穿墙模式：从对面出现（这里不需要修改head，因为会在move方法中处理）
    }

    // 检查撞到自己（使用移动后的位置）
    return this.snake.checkSelfCollision(head);
  }

  gameOver() {
    this.gameState = 'stopped';
    clearInterval(this.gameLoop);
    this.gameLoop = null;
    
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      wx.setStorageSync('bestScore', this.bestScore);
    }
    
    // 显示游戏结束提示
    wx.showToast({
      title: '游戏结束！',
      icon: 'none',
      duration: 2000
    });
    
    this.render();
  }

  reset() {
    console.log('Resetting game...');
    
    // 停止游戏循环
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    
    // 重置游戏状态
    this.gameState = 'stopped';
    this.score = 0;
    this.level = 1;
    this.speed = 200;
    
    // 重新初始化蛇和食物
    try {
      this.snake.init(this.canvas.gridWidth, this.canvas.gridHeight);
      this.food.generate(this.snake.getBody(), this.canvas.gridWidth, this.canvas.gridHeight);
      
      // 清理 Canvas 并重新绘制
      this.clearCanvas();
      this.render();
      
      console.log('Game reset completed');
    } catch (error) {
      console.error('Game reset error:', error);
    }
  }

  clearCanvas() {
    if (this.canvas && this.canvas.ctx) {
      this.canvas.ctx.fillStyle = '#FFFFFF';
      this.canvas.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  render() {
    console.log('Starting render... Game state:', this.gameState);
    this.canvas.clear();
    console.log('Canvas cleared');
    
    // 绘制游戏区域
    this.canvas.drawGameArea();
    console.log('Game area drawn');
    
    // 绘制蛇
    this.snake.render(this.canvas);
    console.log('Snake rendered');
    
    // 绘制食物
    this.food.render(this.canvas);
    console.log('Food rendered');
    
    // 绘制UI
    this.drawUI();
    console.log('UI drawn, render complete');
  }

  drawUI() {
    // 绘制分数、等级等信息
    const ctx = this.canvas.getContext();
    
    // 计算游戏区域位置
    const gameAreaX = this.canvas.gridSize;
    const gameAreaY = 120 + this.canvas.gridSize;
    
    // 绘制顶部信息 - 按照图片样式布局
    ctx.fillStyle = '#000000';
    ctx.font = '16px sans-serif'; // 系统默认字体，兼容性更好
    
    // 左边：Mode 和 Score
    ctx.fillText(`Mode: ${this.mode === 'wall' ? '撞墙' : '穿墙'}`, gameAreaX, gameAreaY - 35);
    ctx.fillText(`Score: ${this.score}`, gameAreaX, gameAreaY - 10);
    
    // 右边：Level 和 Best
    const rightColumnX = gameAreaX + this.canvas.width - 2 * this.canvas.gridSize - 100; // 从右边开始
    ctx.fillText(`Level: ${this.level}`, rightColumnX, gameAreaY - 35);
    ctx.fillText(`Best: ${this.bestScore}`, rightColumnX, gameAreaY - 10);
    
    // 绘制游戏控制按钮
    this.drawControlButtons(ctx);
  }

  drawControlButtons(ctx) {
    // 计算游戏区域位置和尺寸
    const gameAreaX = this.canvas.gridSize;
    const gameAreaY = 120 + this.canvas.gridSize;
    const availableWidth = this.canvas.width - 2 * this.canvas.gridSize;
    const availableHeight = this.canvas.height - 200;
    const gameAreaSize = Math.min(availableWidth, availableHeight);
    const gameAreaBottom = gameAreaY + gameAreaSize;
    
    const buttonY = gameAreaBottom + 10; // 贴着游戏框底部
    const buttonWidth = 60;
    const buttonHeight = 30;
    const buttonSpacing = 15; // 增加按钮间距
    
    // 计算按钮总宽度并居中
    const totalButtonWidth = 4 * buttonWidth + 3 * buttonSpacing;
    const startX = gameAreaX + (gameAreaSize - totalButtonWidth) / 2; // 居中计算

    // 按钮文本
    const buttonTexts = ['切换穿墙', '开始', '暂停', '重开'];
    
    buttonTexts.forEach((text, index) => {
      const buttonX = startX + index * (buttonWidth + buttonSpacing);
      
      // 绘制按钮背景 - 淡灰色背景，无边框
      ctx.fillStyle = '#E8E8E8'; // 淡灰色背景
      ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
      
      // 绘制按钮文字
      ctx.fillStyle = '#000000';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, buttonX + buttonWidth/2, buttonY + buttonHeight/2 + 4);
    });
    
    // 重置文本对齐
    ctx.textAlign = 'left';
  }
}

module.exports = SnakeGame;
