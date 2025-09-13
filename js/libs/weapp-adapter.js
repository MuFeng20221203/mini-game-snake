// weapp-adapter.js - 微信小游戏适配器
// 为微信小游戏环境提供必要的API适配

// 适配canvas相关API
// 微信小游戏中，Canvas由游戏自己创建，不需要全局创建

// 适配事件监听
if (!window.addEventListener) {
  window.addEventListener = function(event, callback) {
    wx.on(event, callback);
  };
}

// 适配requestAnimationFrame
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function(callback) {
    return wx.requestAnimationFrame(callback);
  };
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function(id) {
    wx.cancelAnimationFrame(id);
  };
}

// 适配console
if (!window.console) {
  window.console = {
    log: wx.log,
    warn: wx.log,
    error: wx.log
  };
}

// 适配localStorage
if (!window.localStorage) {
  window.localStorage = {
    getItem: function(key) {
      return wx.getStorageSync(key);
    },
    setItem: function(key, value) {
      wx.setStorageSync(key, value);
    },
    removeItem: function(key) {
      wx.removeStorageSync(key);
    }
  };
}
