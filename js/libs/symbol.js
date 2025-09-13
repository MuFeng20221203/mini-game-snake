// symbol.js - Symbol 支持
// 为微信小游戏环境提供 Symbol 支持

if (typeof Symbol === 'undefined') {
  // 简单的 Symbol 实现
  window.Symbol = function(description) {
    return '__symbol_' + description + '_' + Math.random();
  };
}

