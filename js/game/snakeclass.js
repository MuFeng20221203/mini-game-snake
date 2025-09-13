// snakeclass.js - 蛇类
class Snake {
  constructor() {
    this.body = [];
    this.direction = 'right';
    this.nextDirection = 'right';
  }

  init(gridWidth, gridHeight) {
    // 初始化蛇的位置（居中）
    const centerX = Math.floor(gridWidth / 2);
    const centerY = Math.floor(gridHeight / 2);
    this.body = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY }
    ];
    this.direction = 'right';
    this.nextDirection = 'right';
  }

  move() {
    this.direction = this.nextDirection;
    
    const head = { ...this.body[0] };
    
    switch (this.direction) {
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
    
    this.body.unshift(head);
    this.body.pop();
  }

  grow() {
    // 在移动之前的蛇尾位置添加新的身体段
    // 这样蛇尾方向计算会更准确
    const tail = { ...this.body[this.body.length - 1] };
    this.body.push(tail);
  }

  changeDirection(newDirection) {
    // 防止反向移动
    if ((this.direction === 'up' && newDirection === 'down') ||
        (this.direction === 'down' && newDirection === 'up') ||
        (this.direction === 'left' && newDirection === 'right') ||
        (this.direction === 'right' && newDirection === 'left')) {
      return;
    }
    
    this.nextDirection = newDirection;
  }

  getHead() {
    return this.body[0];
  }

  getBody() {
    return this.body;
  }

  checkSelfCollision(futureHead = null) {
    const head = futureHead || this.getHead();
    for (let i = 1; i < this.body.length; i++) {
      if (head.x === this.body[i].x && head.y === this.body[i].y) {
        return true;
      }
    }
    return false;
  }

  checkFood(foodPosition) {
    const head = this.getHead();
    return head.x === foodPosition.x && head.y === foodPosition.y;
  }

  render(canvas) {
    console.log('Rendering snake with body:', this.body);
    
    // 正确的渲染顺序：先绘制蛇身，再绘制蛇尾和蛇头
    // 1. 先绘制蛇身（跳过最后一个位置，避免与蛇尾重叠）
    for (let i = 0; i < this.body.length - 1; i++) {
      canvas.drawSnakeBody(this.body[i].x, this.body[i].y);
    }
    
    // 2. 绘制蛇尾（半圆 + 半矩形）
    if (this.body.length > 1) {
      const tailDirection = this.getTailDirection();
      canvas.drawSnakeTail(this.body[this.body.length - 1].x, this.body[this.body.length - 1].y, tailDirection);
    }
    
    // 3. 最后绘制蛇头（半圆 + 半矩形）
    canvas.drawSnakeHead(this.body[0].x, this.body[0].y, this.direction);
  }

  getTailDirection() {
    if (this.body.length < 2) return 'left';
    
    // 蛇尾应该跟随倒数第二个身体段的方向
    // 计算尾巴相对于倒数第二个身体段的方向
    const tail = this.body[this.body.length - 1];
    const secondLast = this.body[this.body.length - 2];
    
    const dx = tail.x - secondLast.x;
    const dy = tail.y - secondLast.y;
    
    // 在穿墙模式下，检查是否跨越了边界
    // 如果距离过大，说明跨越了边界，需要特殊处理
    const maxDistance = 2; // 最大正常距离
    
    if (Math.abs(dx) > maxDistance || Math.abs(dy) > maxDistance) {
      // 在穿墙模式下，蛇尾方向应该与蛇头移动方向相反
      // 蛇头朝右移动 → 蛇尾朝左（半圆在左侧）
      // 蛇头朝左移动 → 蛇尾朝右（半圆在右侧）
      // 蛇头朝上移动 → 蛇尾朝下（半圆在下侧）
      // 蛇头朝下移动 → 蛇尾朝上（半圆在上侧）
      switch (this.direction) {
        case 'right': return 'left';   // 蛇头朝右 → 蛇尾朝左
        case 'left': return 'right';   // 蛇头朝左 → 蛇尾朝右
        case 'up': return 'down';      // 蛇头朝上 → 蛇尾朝下
        case 'down': return 'up';      // 蛇头朝下 → 蛇尾朝上
        default: return 'left';
      }
    }
    
    // 正常情况下，根据相对位置确定蛇尾方向
    if (dx > 0) return 'right';    // 尾巴在右边 → 蛇尾朝右
    if (dx < 0) return 'left';     // 尾巴在左边 → 蛇尾朝左
    if (dy > 0) return 'down';     // 尾巴在下边 → 蛇尾朝下
    if (dy < 0) return 'up';       // 尾巴在上边 → 蛇尾朝上
    
    return 'left'; // 默认方向
  }
}

module.exports = Snake;
