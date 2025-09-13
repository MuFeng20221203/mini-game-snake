// canvas.js - 画布管理
class Canvas {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.gridSize = 20; // 每个格子的像素大小
    this.gridWidth = 0;
    this.gridHeight = 0;
  }

  init() {
    return new Promise((resolve, reject) => {
      try {
        console.log('Canvas initializing...');
        
        // 使用 setTimeout 确保在下一个事件循环中初始化
        setTimeout(() => {
          try {
            this.canvas = wx.createCanvas();
            this.ctx = this.canvas.getContext('2d');
            
            // 获取系统信息
            const systemInfo = wx.getSystemInfoSync();
            this.width = systemInfo.windowWidth;
            this.height = systemInfo.windowHeight;
            
            console.log('System info:', systemInfo);
            console.log('Canvas created:', this.canvas);
            console.log('Context created:', this.ctx);
            
            // 计算游戏区域大小 - 考虑左右间隙和上下空间
            const availableWidth = this.width - 2 * this.gridSize; // 左右各留一格间隙
            const availableHeight = this.height - 200; // 留出顶部和底部空间
            const gameAreaSize = Math.min(availableWidth, availableHeight);
            this.gridWidth = Math.floor(gameAreaSize / this.gridSize);
            this.gridHeight = Math.floor(gameAreaSize / this.gridSize);
            
            console.log('Grid dimensions:', this.gridWidth, this.gridHeight);
            
            // 设置画布大小
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            
            console.log('Canvas size set:', this.canvas.width, this.canvas.height);
            
            // 立即绘制白色背景，确保可见
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(0, 0, this.width, this.height);
            console.log('White background drawn');
            
            resolve();
          } catch (error) {
            console.error('Canvas initialization error:', error);
            reject(error);
          }
        }, 100); // 延迟100ms确保系统准备就绪
        
      } catch (error) {
        console.error('Canvas initialization error:', error);
        reject(error);
      }
    });
  }

  getContext() {
    return this.ctx;
  }

  clear() {
    // 清除并设置白色背景
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawGameArea() {
    const ctx = this.ctx;
    
    // 使用与init()方法相同的计算方式，确保一致性
    const availableWidth = this.width - 2 * this.gridSize; // 左右各留一格间隙
    const availableHeight = this.height - 200; // 留出更多顶部和底部空间
    const gameAreaSize = Math.min(availableWidth, availableHeight);
    const gameAreaX = this.gridSize; // 左边留一格间隙
    const gameAreaY = 120 + this.gridSize; // 顶部留出更多空间，避免与右上角功能键重叠
    
    // 重新计算实际的网格尺寸，确保与绘制区域完全匹配
    const actualGridWidth = Math.floor(gameAreaSize / this.gridSize);
    const actualGridHeight = Math.floor(gameAreaSize / this.gridSize);
    const actualGameAreaSize = actualGridWidth * this.gridSize;
    
    console.log('Drawing square game area:', {
      gameAreaX, gameAreaY, 
      originalGameAreaSize: gameAreaSize,
      actualGameAreaSize,
      actualGridWidth, 
      actualGridHeight,
      storedGridWidth: this.gridWidth,
      storedGridHeight: this.gridHeight
    });

    // 绘制游戏区域背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(gameAreaX, gameAreaY, actualGameAreaSize, actualGameAreaSize);

    // 绘制游戏区域边框
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(gameAreaX, gameAreaY, actualGameAreaSize, actualGameAreaSize);
    
    // 绘制网格线 - 设置为透明
    ctx.strokeStyle = 'rgba(0, 0, 0, 0)'; // 透明网格线
    ctx.lineWidth = 1;
    
    // 绘制垂直线
    for (let i = 0; i <= actualGridWidth; i++) {
      const x = gameAreaX + i * this.gridSize;
      ctx.beginPath();
      ctx.moveTo(x, gameAreaY);
      ctx.lineTo(x, gameAreaY + actualGameAreaSize);
      ctx.stroke();
    }
    
    // 绘制水平线
    for (let i = 0; i <= actualGridHeight; i++) {
      const y = gameAreaY + i * this.gridSize;
      ctx.beginPath();
      ctx.moveTo(gameAreaX, y);
      ctx.lineTo(gameAreaX + actualGameAreaSize, y);
      ctx.stroke();
    }
    
    console.log('Square game area with grid drawn');
  }

  drawRect(x, y, color = '#000000') {
    const ctx = this.ctx;
    const pixelX = x * this.gridSize;
    const pixelY = y * this.gridSize + 100; // 偏移到游戏区域

    ctx.fillStyle = color;
    ctx.fillRect(pixelX, pixelY, this.gridSize - 2, this.gridSize - 2);
  }

  drawCircle(x, y, color = '#000000') {
    const ctx = this.ctx;
    
    // 计算游戏区域的偏移
    const gameAreaX = this.gridSize;
    const gameAreaY = 120 + this.gridSize;
    
    const pixelX = gameAreaX + x * this.gridSize;
    const pixelY = gameAreaY + y * this.gridSize;
    const centerX = pixelX + this.gridSize / 2;
    const centerY = pixelY + this.gridSize / 2;

    // 绘制食物 - 简单的黑色圆
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.gridSize / 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  drawSnakeHead(x, y, direction) {
    const ctx = this.ctx;
    
    // 计算游戏区域的偏移
    const gameAreaX = this.gridSize;
    const gameAreaY = 120 + this.gridSize;
    const availableWidth = this.width - 2 * this.gridSize;
    const availableHeight = this.height - 200;
    const gameAreaSize = Math.min(availableWidth, availableHeight);
    
    const pixelX = gameAreaX + x * this.gridSize;
    const pixelY = gameAreaY + y * this.gridSize;
    const radius = this.gridSize / 2;
    const centerX = pixelX + this.gridSize / 2;
    const centerY = pixelY + this.gridSize / 2;

    console.log('Drawing snake head at:', x, y, 'direction:', direction);

    // 绘制蛇头 - 先绘制完整白色矩形，再用剪切区域形成半圆
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(pixelX, pixelY, this.gridSize, this.gridSize);

    // 使用剪切区域来形成半圆效果
    ctx.save();
    ctx.beginPath();

    // 设置剪切区域：只保留半圆部分
    switch (direction) {
      case 'right':
        // 右半圆：剪切区域为右半部分
        ctx.rect(centerX, pixelY, this.gridSize / 2, this.gridSize);
        break;
      case 'left':
        // 左半圆：剪切区域为左半部分
        ctx.rect(pixelX, pixelY, this.gridSize / 2, this.gridSize);
        break;
      case 'up':
        // 上半圆：剪切区域为上半部分
        ctx.rect(pixelX, pixelY, this.gridSize, this.gridSize / 2);
        break;
      case 'down':
        // 下半圆：剪切区域为下半部分
        ctx.rect(pixelX, centerY, this.gridSize, this.gridSize / 2);
        break;
    }
    ctx.clip();

    // 在剪切区域内绘制黑色圆形，形成黑色半圆效果
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.restore();

    // 绘制朝向蛇身方向的半矩形（覆盖白色背景，与蛇身连接）
    ctx.fillStyle = '#000000';
    switch (direction) {
      case 'right':
        // 右方向：左半矩形（朝向蛇身）
        ctx.fillRect(pixelX, pixelY, this.gridSize / 2, this.gridSize);
        break;
      case 'left':
        // 左方向：右半矩形（朝向蛇身）
        ctx.fillRect(pixelX + this.gridSize / 2, pixelY, this.gridSize / 2, this.gridSize);
        break;
      case 'up':
        // 上方向：下半矩形（朝向蛇身）
        ctx.fillRect(pixelX, pixelY + this.gridSize / 2, this.gridSize, this.gridSize / 2);
        break;
      case 'down':
        // 下方向：上半矩形（朝向蛇身）
        ctx.fillRect(pixelX, pixelY, this.gridSize, this.gridSize / 2);
        break;
    }

    // 绘制眼睛 - 更精确的位置
    ctx.fillStyle = '#FFFFFF';
    const eyeSize = 4;
    const eyeOffset = 5;

    if (direction === 'right') {
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY - eyeOffset, eyeSize/2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY + eyeOffset, eyeSize/2, 0, 2 * Math.PI);
      ctx.fill();
    } else if (direction === 'left') {
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - eyeOffset, eyeSize/2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY + eyeOffset, eyeSize/2, 0, 2 * Math.PI);
      ctx.fill();
    } else if (direction === 'up') {
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - eyeOffset, eyeSize/2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY - eyeOffset, eyeSize/2, 0, 2 * Math.PI);
      ctx.fill();
    } else if (direction === 'down') {
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY + eyeOffset, eyeSize/2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY + eyeOffset, eyeSize/2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  drawSnakeTail(x, y, direction) {
    const ctx = this.ctx;
    
    // 计算游戏区域的偏移
    const gameAreaX = this.gridSize;
    const gameAreaY = 120 + this.gridSize;
    const availableWidth = this.width - 2 * this.gridSize;
    const availableHeight = this.height - 200;
    const gameAreaSize = Math.min(availableWidth, availableHeight);
    
    const pixelX = gameAreaX + x * this.gridSize;
    const pixelY = gameAreaY + y * this.gridSize;
    const radius = this.gridSize / 2;
    const centerX = pixelX + this.gridSize / 2;
    const centerY = pixelY + this.gridSize / 2;

    console.log('Drawing snake tail at:', x, y, 'direction:', direction);

    // 绘制蛇尾 - 外侧黑色半圆，内侧白色矩形
    // 先绘制完整白色矩形（内侧部分）
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(pixelX, pixelY, this.gridSize, this.gridSize);

    // 使用剪切区域来形成半圆效果（与蛇头相反的方向）
    ctx.save();
    ctx.beginPath();

    // 设置剪切区域：只保留半圆部分（外侧半圆）
    switch (direction) {
      case 'right':
        // 蛇尾朝左，外侧是右半圆：剪切区域为右半部分
        ctx.rect(centerX, pixelY, this.gridSize / 2, this.gridSize);
        break;
      case 'left':
        // 蛇尾朝右，外侧是左半圆：剪切区域为左半部分
        ctx.rect(pixelX, pixelY, this.gridSize / 2, this.gridSize);
        break;
      case 'up':
        // 蛇尾朝下，外侧是上半圆：剪切区域为上半部分
        ctx.rect(pixelX, pixelY, this.gridSize, this.gridSize / 2);
        break;
      case 'down':
        // 蛇尾朝上，外侧是下半圆：剪切区域为下半部分
        ctx.rect(pixelX, centerY, this.gridSize, this.gridSize / 2);
        break;
    }
    ctx.clip();

    // 在剪切区域内绘制黑色圆形，形成黑色半圆效果（外侧半圆）
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.restore();

    // 绘制朝向蛇身方向的半矩形（保持黑色，与蛇身连接）
    ctx.fillStyle = '#000000';
    switch (direction) {
      case 'right':
        // 蛇尾朝左：左半矩形（朝向蛇身，不覆盖右半圆）
        ctx.fillRect(pixelX, pixelY, this.gridSize / 2, this.gridSize);
        break;
      case 'left':
        // 蛇尾朝右：右半矩形（朝向蛇身，不覆盖左半圆）
        ctx.fillRect(pixelX + this.gridSize / 2, pixelY, this.gridSize / 2, this.gridSize);
        break;
      case 'up':
        // 蛇尾朝下：下半矩形（朝向蛇身，不覆盖上半圆）
        ctx.fillRect(pixelX, pixelY + this.gridSize / 2, this.gridSize, this.gridSize / 2);
        break;
      case 'down':
        // 蛇尾朝上：上半矩形（朝向蛇身，不覆盖下半圆）
        ctx.fillRect(pixelX, pixelY, this.gridSize, this.gridSize / 2);
        break;
    }
  }

  drawSnakeBody(x, y) {
    // 绘制矩形蛇身，完全填充不留间隙
    // 计算游戏区域的偏移
    const gameAreaX = this.gridSize;
    const gameAreaY = 120 + this.gridSize;
    
    const pixelX = gameAreaX + x * this.gridSize;
    const pixelY = gameAreaY + y * this.gridSize;

    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(pixelX, pixelY, this.gridSize, this.gridSize);
    console.log('Drawing snake body at:', x, y);
  }

  // 绘制圆角矩形
  drawRoundedRect(x, y, width, height, topLeft, topRight, bottomRight, bottomLeft) {
    const ctx = this.ctx;
    
    ctx.beginPath();
    ctx.moveTo(x + topLeft, y);
    
    // 上边
    ctx.lineTo(x + width - topRight, y);
    if (topRight > 0) {
      ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
    }
    
    // 右边
    ctx.lineTo(x + width, y + height - bottomRight);
    if (bottomRight > 0) {
      ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
    }
    
    // 下边
    ctx.lineTo(x + bottomLeft, y + height);
    if (bottomLeft > 0) {
      ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
    }
    
    // 左边
    ctx.lineTo(x, y + topLeft);
    if (topLeft > 0) {
      ctx.quadraticCurveTo(x, y, x + topLeft, y);
    }
    
    ctx.closePath();
    ctx.fill();
  }
}

module.exports = Canvas;