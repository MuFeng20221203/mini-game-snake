// food.js - 食物类
class Food {
  constructor() {
    this.position = { x: 0, y: 0 };
  }

  generate(snakeBody, gridWidth, gridHeight) {
    const maxX = gridWidth;
    const maxY = gridHeight;
    
    do {
      this.position.x = Math.floor(Math.random() * maxX);
      this.position.y = Math.floor(Math.random() * maxY);
    } while (this.isOnSnake(snakeBody));
  }

  isOnSnake(snakeBody) {
    return snakeBody.some(segment => 
      segment.x === this.position.x && segment.y === this.position.y
    );
  }

  getPosition() {
    return this.position;
  }

  render(canvas) {
    canvas.drawCircle(this.position.x, this.position.y, '#000000');
  }
}

module.exports = Food;
