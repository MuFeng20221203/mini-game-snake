// debug.js - 调试版本，用于排查加载问题
console.log('Debug version starting...');

// 检查微信 API 是否可用
if (typeof wx === 'undefined') {
  console.error('wx API not available');
} else {
  console.log('wx API available');
}

// 检查 Canvas 是否可用
try {
  const canvas = wx.createCanvas();
  console.log('Canvas creation successful');
  
  const ctx = canvas.getContext('2d');
  console.log('Canvas context creation successful');
  
  // 简单的测试绘制
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 100, 100);
  console.log('Test drawing successful');
  
} catch (error) {
  console.error('Canvas test failed:', error);
}

// 检查系统信息
try {
  const systemInfo = wx.getSystemInfoSync();
  console.log('System info:', systemInfo);
} catch (error) {
  console.error('System info failed:', error);
}

console.log('Debug version completed');
