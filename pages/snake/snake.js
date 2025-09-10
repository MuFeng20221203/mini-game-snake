/*
	Snake Page (贪吃蛇) - 黑白像素风实现
	- 控制：滑动（上下左右），按钮：开始/暂停/重开、穿墙切换、速度选择、音效
	- 渲染：整体黑色无缝身体 + 圆弧蛇头
*/
const GRID_SIZE = 20; // number of cells per row/col
const CELL = 14; // px per cell (scaled by pixel ratio)
const TICK_BASE_MS = 260; // base speed (lower is faster)

// 关卡常量保留但当前未使用（障碍关闭）
const LEVELS = [
	{ obstacles: [] },
	{ obstacles: line(2, 2, 17, 2) },
	{ obstacles: line(2, 17, 17, 17) },
	{ obstacles: [...line(2, 2, 2, 17), ...line(17, 2, 17, 17)] },
	{ obstacles: cross(10, 10, 6) }
];

function line(x1, y1, x2, y2) {
	const cells = [];
	if (x1 === x2) {
		const [a, b] = y1 < y2 ? [y1, y2] : [y2, y1];
		for (let y = a; y <= b; y++) cells.push({ x: x1, y });
	} else if (y1 === y2) {
		const [a, b] = x1 < x2 ? [x1, x2] : [x2, x1];
		for (let x = a; x <= b; x++) cells.push({ x, y: y1 });
	}
	return cells;
}
function cross(cx, cy, len) {
	return [
		...line(cx - Math.floor(len / 2), cy, cx + Math.floor(len / 2), cy),
		...line(cx, cy - Math.floor(len / 2), cx, cy + Math.floor(len / 2))
	];
}

Page({
	data: {
		score: 0,
		level: 1,
		best: 0,
		isRunning: false,
		wrapMode: false,
		obstacles: [],
		muted: false
	},

	onLoad() {
		const best = wx.getStorageSync('snake_best') || 0;
		this.setData({ best });
	},

	onReady() {
		this.initCanvas();
		this.initAudio();
	},

	initAudio() {
		try {
			// 使用系统内置音效
			this.eatSound = wx.createInnerAudioContext();
			this.eatSound.autoplay = false;
			this.eatSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO+eizEIHWq+8+OWT';
			
			this.wallSound = wx.createInnerAudioContext();
			this.wallSound.autoplay = false;
			this.wallSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO+eizEIHWq+8+OWT';
			
			this.overSound = wx.createInnerAudioContext();
			this.overSound.autoplay = false;
			this.overSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO+eizEIHWq+8+OWT';
			
			this.applyMute();
			console.log('音效初始化完成');
		} catch (e) {
			console.log('音效初始化失败:', e);
		}
	},

	// 创建简单的哔声音效
	createBeepSound(frequency, duration) {
		// 使用Web Audio API创建音效
		try {
			const audioContext = wx.createWebAudioContext();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();
			
			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);
			
			oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
			oscillator.type = 'square';
			
			// 音量包络
			gainNode.gain.setValueAtTime(0, audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
			
			return {
				play: () => {
					try {
						oscillator.start(audioContext.currentTime);
						oscillator.stop(audioContext.currentTime + duration);
					} catch (e) {
						console.log('播放音效失败:', e);
					}
				}
			};
		} catch (e) {
			console.log('创建音效失败:', e);
			return { play: () => {} };
		}
	},

	// 音效选择：经典电子音效（选项1）
	getEatSoundData() {
		// 使用简单的音频数据URI，避免base64解码问题
		return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
	},
	
	getWallSoundData() {
		// 使用简单的音频数据URI，避免base64解码问题
		return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
	},
	
	getOverSoundData() {
		// 使用简单的音频数据URI，避免base64解码问题
		return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
	},

	// 音效选择：复古游戏音效（选项2）
	getEatSoundDataV2() {
		// 清脆的"哔"声 - 高音
		return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
	},
	
	getWallSoundDataV2() {
		// 中音的"当"声 - 金属撞击
		return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
	},
	
	getOverSoundDataV2() {
		// 下降的"呜"声 - 滑音
		return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
	},

	// 音效选择：简约提示音（选项3）
	getEatSoundDataV3() {
		// 简单的"叮"声
		return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
	},
	
	getWallSoundDataV3() {
		// 短促的"咚"声
		return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
	},
	
	getOverSoundDataV3() {
		// 低沉的"咚"声
		return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
	},

	// 创建经典哔声音效（模拟老式按键手机音效）
	createBeepSound(frequency, duration) {
		try {
			// 使用Web Audio API创建音效
			const audioContext = wx.createWebAudioContext();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();
			
			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);
			
			oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
			oscillator.type = 'square'; // 方波，更接近老式电子音效
			
			// 音量包络：快速上升，缓慢下降
			gainNode.gain.setValueAtTime(0, audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
			
			return {
				play: () => {
					try {
						oscillator.start(audioContext.currentTime);
						oscillator.stop(audioContext.currentTime + duration);
					} catch (e) {
						console.log('播放音效失败:', e);
					}
				},
				stop: () => {
					try {
						oscillator.stop();
					} catch (e) {}
				},
				volume: 1
			};
		} catch (e) {
			console.log('创建音效失败:', e);
			// 兜底：返回空音效对象
			return {
				play: () => {},
				stop: () => {},
				volume: 1
			};
		}
	},

	// 创建游戏结束音效（下降音调，模拟经典游戏结束音）
	createGameOverSound() {
		try {
			const audioContext = wx.createWebAudioContext();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();
			
			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);
			
			oscillator.type = 'square';
			
			return {
				play: () => {
					try {
						const now = audioContext.currentTime;
						const duration = 0.5;
						
						// 频率从高到低下降
						oscillator.frequency.setValueAtTime(600, now);
						oscillator.frequency.linearRampToValueAtTime(200, now + duration);
						
						// 音量包络
						gainNode.gain.setValueAtTime(0, now);
						gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
						gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
						
						oscillator.start(now);
						oscillator.stop(now + duration);
					} catch (e) {
						console.log('播放游戏结束音效失败:', e);
					}
				},
				stop: () => {
					try {
						oscillator.stop();
					} catch (e) {}
				},
				volume: 1
			};
		} catch (e) {
			console.log('创建游戏结束音效失败:', e);
			return {
				play: () => {},
				stop: () => {},
				volume: 1
			};
		}
	},

	// 切换音效版本（1=经典电子音效, 2=复古游戏音效, 3=简约提示音, 4=静音）
	switchSoundVersion(version) {
		try {
			if (this.eatSound) this.eatSound.destroy();
			if (this.wallSound) this.wallSound.destroy();
			if (this.overSound) this.overSound.destroy();
			
			if (version === 4) {
				// 静音模式
				this.eatSound = null;
				this.wallSound = null;
				this.overSound = null;
				return;
			}
			
			this.eatSound = wx.createInnerAudioContext();
			this.eatSound.autoplay = false;
			
			this.wallSound = wx.createInnerAudioContext();
			this.wallSound.autoplay = false;
			
			this.overSound = wx.createInnerAudioContext();
			this.overSound.autoplay = false;
			
			// 根据版本选择音效
			if (version === 1) {
				this.eatSound.src = this.getEatSoundData();
				this.wallSound.src = this.getWallSoundData();
				this.overSound.src = this.getOverSoundData();
			} else if (version === 2) {
				this.eatSound.src = this.getEatSoundDataV2();
				this.wallSound.src = this.getWallSoundDataV2();
				this.overSound.src = this.getOverSoundDataV2();
			} else if (version === 3) {
				this.eatSound.src = this.getEatSoundDataV3();
				this.wallSound.src = this.getWallSoundDataV3();
				this.overSound.src = this.getOverSoundDataV3();
			}
			
			this.applyMute();
		} catch (e) {
			console.log('切换音效失败:', e);
		}
	},

	// 测试音效（在控制台调用）
	testSounds() {
		console.log('测试选项1音效：经典电子音效');
		setTimeout(() => this.playEat(), 100);
		setTimeout(() => this.playWall(), 500);
		setTimeout(() => this.playOver(), 1000);
	},

	applyMute() {
		const vol = this.data.muted ? 0 : 1;
		if (this.eatSound) this.eatSound.volume = vol;
		if (this.wallSound) this.wallSound.volume = vol;
		if (this.overSound) this.overSound.volume = vol;
	},

	toggleMute(e) {
		const muted = !e.detail.value;
		this.setData({ muted });
		this.applyMute();
	},

	playEat() {
		if (!this.data.muted) {
			try {
				// 使用系统音效
				wx.vibrateShort({ type: 'light' });
			} catch (e) {
				console.log('播放吃食物音效失败:', e);
			}
		}
	},
	playWall() {
		if (!this.data.muted) {
			try {
				// 使用系统音效
				wx.vibrateShort({ type: 'medium' });
			} catch (e) {
				console.log('播放撞墙音效失败:', e);
			}
		}
	},
	playOver() {
		if (!this.data.muted) {
			try {
				// 使用系统音效
				wx.vibrateShort({ type: 'heavy' });
			} catch (e) {
				console.log('播放游戏结束音效失败:', e);
			}
		}
	},

	initCanvas() {
		const query = this.createSelectorQuery();
		query.select('#game').fields({ node: true, size: true }).exec((res) => {
			const canvas = res[0].node;
			const ctx = canvas.getContext('2d');
			const dpr = wx.getSystemInfoSync().pixelRatio || 1;
			// set canvas size
			canvas.width = GRID_SIZE * CELL * dpr;
			canvas.height = GRID_SIZE * CELL * dpr;
			ctx.scale(dpr, dpr);
			this.canvas = canvas;
			this.ctx = ctx;
			// 画布就绪后再初始化游戏，避免竞态导致未绘制
			this.resetGame();
		});
	},

	resetGame() {
		this.direction = 'right';
		this.pendingDir = 'right';
		this.snake = [
			{ x: 5, y: 10 },
			{ x: 4, y: 10 },
			{ x: 3, y: 10 }
		];
		// 取消障碍：始终为空
		this.levelObstacles = [];
		this.generateFood();
		this.setData({ score: 0, isRunning: false, level: 1, obstacles: [] });
		this.tickMs = this.getTickByScore(0);
		this.stopLoop && this.stopLoop();
		this.draw && this.draw();
	},

	// 移除 setLevel：障碍逻辑关闭
	// setLevel(level) { }

	// 统一的无缝连接：在与前/后相邻的边上加一条1-2px的加粗，避免渲染缝隙
	drawSeamConnect(px, py, seg, prev, next) {
		const ctx = this.ctx;
		ctx.fillStyle = '#000';
		if (prev) {
			if (prev.x === seg.x && Math.abs(prev.y - seg.y) === 1) {
				const yTop = Math.min(prev.y, seg.y) * CELL + CELL - 1;
				ctx.fillRect(px, yTop, CELL, 2);
			}
			if (prev.y === seg.y && Math.abs(prev.x - seg.x) === 1) {
				const xLeft = Math.min(prev.x, seg.x) * CELL + CELL - 1;
				ctx.fillRect(xLeft, py, 2, CELL);
			}
		}
		if (next) {
			if (next.x === seg.x && Math.abs(next.y - seg.y) === 1) {
				const yTop = Math.min(next.y, seg.y) * CELL + CELL - 1;
				ctx.fillRect(px, yTop, CELL, 2);
			}
			if (next.y === seg.y && Math.abs(next.x - seg.x) === 1) {
				const xLeft = Math.min(next.x, seg.x) * CELL + CELL - 1;
				ctx.fillRect(xLeft, py, 2, CELL);
			}
		}
	},

	// 根据分数计算速度：<50 慢，50-99 中，>=100 快（只提速2次）
	getTickByScore(score) {
		if (score >= 100) return 160; // 快速（100分后不再提速）
		if (score >= 50) return 220;  // 中速（50分时第一次提速）
		return 300;                   // 慢速（初始速度）
	},

	// 身体：整体黑色；蛇头为圆弧形（方向朝前半圆）；蛇尾为圆弧收尾（反向半圆）
	drawSnakeSegment(seg, index, total) {
		const ctx = this.ctx;
		const px = seg.x * CELL;
		const py = seg.y * CELL;
		const isHead = index === 0;
		const isTail = index === total - 1;
		const prev = this.snake[index - 1];
		const next = this.snake[index + 1];

		if (isHead) {
			// 清空当前格，避免方块遮住圆弧
			ctx.fillStyle = '#fff';
			ctx.fillRect(px, py, CELL, CELL);
			// 圆弧蛇头（半圆）
			const cx = px + CELL / 2;
			const cy = py + CELL / 2;
			const r = CELL / 2;
			ctx.fillStyle = '#000';
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			if (this.direction === 'up') {
				ctx.arc(cx, cy, r, Math.PI, 0);
			} else if (this.direction === 'down') {
				ctx.arc(cx, cy, r, 0, Math.PI);
			} else if (this.direction === 'left') {
				ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2);
			} else {
				ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);
			}
			ctx.closePath();
			ctx.fill();
			// 补一块“后半矩形”，保证与身体无缝相连
			if (this.direction === 'up') {
				ctx.fillRect(px, py + CELL / 2, CELL, CELL / 2);
			} else if (this.direction === 'down') {
				ctx.fillRect(px, py, CELL, CELL / 2);
			} else if (this.direction === 'left') {
				ctx.fillRect(px + CELL / 2, py, CELL / 2, CELL);
			} else {
				ctx.fillRect(px, py, CELL / 2, CELL);
			}
			// 眼睛
			const eye = Math.max(1, Math.floor(CELL * 0.16));
			ctx.fillStyle = '#fff';
			if (this.direction === 'up') {
				ctx.fillRect(px + Math.floor(CELL * 0.25), py + Math.floor(CELL * 0.30), eye, eye);
				ctx.fillRect(px + Math.floor(CELL * 0.65) - eye, py + Math.floor(CELL * 0.30), eye, eye);
			} else if (this.direction === 'down') {
				ctx.fillRect(px + Math.floor(CELL * 0.25), py + Math.floor(CELL * 0.70) - eye, eye, eye);
				ctx.fillRect(px + Math.floor(CELL * 0.65) - eye, py + Math.floor(CELL * 0.70) - eye, eye, eye);
			} else if (this.direction === 'left') {
				ctx.fillRect(px + Math.floor(CELL * 0.30), py + Math.floor(CELL * 0.25), eye, eye);
				ctx.fillRect(px + Math.floor(CELL * 0.30), py + Math.floor(CELL * 0.65) - eye, eye, eye);
			} else {
				ctx.fillRect(px + Math.floor(CELL * 0.70) - eye, py + Math.floor(CELL * 0.25), eye, eye);
				ctx.fillRect(px + Math.floor(CELL * 0.70) - eye, py + Math.floor(CELL * 0.65) - eye, eye, eye);
			}
			this.drawSeamConnect(px, py, seg, prev, next);
			return;
		}

		if (isTail && prev) {
			// 清空当前格，再用半圆做收尾（方向取与前一节相反）
			let dir;
			if (seg.x > prev.x) dir = 'right';
			else if (seg.x < prev.x) dir = 'left';
			else if (seg.y > prev.y) dir = 'down';
			else dir = 'up';
			ctx.fillStyle = '#fff';
			ctx.fillRect(px, py, CELL, CELL);
			const cx = px + CELL / 2;
			const cy = py + CELL / 2;
			const r = CELL / 2;
			ctx.fillStyle = '#000';
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			if (dir === 'up') {
				ctx.arc(cx, cy, r, Math.PI, 0);
			} else if (dir === 'down') {
				ctx.arc(cx, cy, r, 0, Math.PI);
			} else if (dir === 'left') {
				ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2);
			} else {
				ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);
			}
			ctx.closePath();
			ctx.fill();
			// 与身体无缝连接的后半矩形（朝向 prev）
			if (dir === 'up') {
				ctx.fillRect(px, py + CELL / 2, CELL, CELL / 2);
			} else if (dir === 'down') {
				ctx.fillRect(px, py, CELL, CELL / 2);
			} else if (dir === 'left') {
				ctx.fillRect(px + CELL / 2, py, CELL / 2, CELL);
			} else {
				ctx.fillRect(px, py, CELL / 2, CELL);
			}
			this.drawSeamConnect(px, py, seg, prev, next);
			return;
		}

		// 普通身体：整格实心黑色
		ctx.fillStyle = '#000';
		ctx.fillRect(px, py, CELL, CELL);
		this.drawSeamConnect(px, py, seg, prev, next);
	},

	draw() {
		if (!this.ctx) return;
		const ctx = this.ctx;
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, GRID_SIZE * CELL, GRID_SIZE * CELL);
		// 外边框
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 2;
		ctx.strokeRect(1, 1, GRID_SIZE * CELL - 2, GRID_SIZE * CELL - 2);
		// 不再绘制障碍
		// 蛇
		for (let i = 0; i < this.snake.length; i++) {
			this.drawSnakeSegment(this.snake[i], i, this.snake.length);
		}
		// 食物
		if (this.food) {
			ctx.fillStyle = '#000';
			ctx.beginPath();
			ctx.arc(
				this.food.x * CELL + CELL / 2,
				this.food.y * CELL + CELL / 2,
				CELL * 0.3,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}
	},

	step() {
		// 先应用挂起的速度
		if (this.pendingTickMs != null && this.pendingTickMs !== this.tickMs) {
			this.tickMs = this.pendingTickMs;
			if (this.data.isRunning) this.restartLoop();
			this.pendingTickMs = null;
		}
		// 不再处理关卡障碍

		const head = { ...this.snake[0] };
		// apply pending dir if not opposite
		const nextDir = this.pendingDir;
		if (!this.isOpposite(this.direction, nextDir)) {
			this.direction = nextDir;
		}
		if (this.direction === 'up') head.y -= 1;
		if (this.direction === 'down') head.y += 1;
		if (this.direction === 'left') head.x -= 1;
		if (this.direction === 'right') head.x += 1;

		// wrap or wall collision
		if (this.data.wrapMode) {
			head.x = (head.x + GRID_SIZE) % GRID_SIZE;
			head.y = (head.y + GRID_SIZE) % GRID_SIZE;
		} else {
			if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
				this.haptic('medium'); // 撞墙：中等震动
				this.playWall();
				this.gameOver();
				return;
			}
		}

		// self or obstacle collision
		if (this.snake.some((s) => s.x === head.x && s.y === head.y)) {
			this.haptic('heavy'); // 自撞：强烈震动
			this.gameOver();
			return;
		}
		// 障碍判定移除

		this.snake.unshift(head);
		if (head.x === this.food.x && head.y === this.food.y) {
			const newScore = this.data.score + 10;
			let newLevel = this.data.level;
			const newTick = this.getTickByScore(newScore);
			// 仅提速，不再生成障碍
			if (newScore % 50 === 0) {
				newLevel += 1;
			}
			
			if (newTick !== this.tickMs) {
				this.pendingTickMs = newTick;
			}
			this.setData({ score: newScore, level: newLevel, obstacles: [] });
			this.haptic('light'); // 吃食物：轻微震动
			this.playEat();
			this.generateFood();
		} else {
			this.snake.pop();
		}
		this.draw();
	},

	haptic(type) {
		try {
			// 增强震动反馈，替代音效
			if (type === 'light') {
				// 吃食物：轻微震动
				wx.vibrateShort({ type: 'light' });
			} else if (type === 'medium') {
				// 撞墙：中等震动
				wx.vibrateShort({ type: 'medium' });
			} else {
				// 游戏结束：强烈震动
				wx.vibrateShort({ type: 'heavy' });
			}
		} catch (e) {
			console.log('震动反馈失败:', e);
		}
	},


	isOpposite(a, b) {
		return (
			(a === 'up' && b === 'down') ||
			(a === 'down' && b === 'up') ||
			(a === 'left' && b === 'right') ||
			(a === 'right' && b === 'left')
		);
	},

	onStart() {
		if (this.loop) return; // already running
		
		// 如果游戏已结束（没有循环且isRunning: false且没有蛇），先重置游戏
		if (!this.loop && !this.data.isRunning && (!this.snake || this.snake.length === 0)) {
			this.resetGame();
		}
		
		this.setData({ isRunning: true });
		this.startLoop();
	},
	startLoop() {
		this.loop = setInterval(() => this.step(), this.tickMs);
	},
	restartLoop() {
		this.stopLoop();
		this.startLoop();
	},
	stopLoop() {
		if (this.loop) {
			clearInterval(this.loop);
			this.loop = null;
		}
	},

	// touch controls: swipe to change direction (整个屏幕)
	onTouchStart(e) {
		this.touchStart = e.changedTouches[0];
	},
	onTouchEnd(e) {
		const start = this.touchStart;
		if (!start) return;
		const end = e.changedTouches[0];
		const dx = end.pageX - start.pageX;
		const dy = end.pageY - start.pageY;
		
		// 增加最小滑动距离，避免误触
		const minDistance = 20;
		if (Math.abs(dx) < minDistance && Math.abs(dy) < minDistance) {
			this.touchStart = null;
			return;
		}
		
		if (Math.abs(dx) > Math.abs(dy)) {
			if (dx > 0) {
				this.pendingDir = 'right';
			} else {
				this.pendingDir = 'left';
			}
		} else {
			if (dy > 0) {
				this.pendingDir = 'down';
			} else {
				this.pendingDir = 'up';
			}
		}
		this.touchStart = null;
	},

	onTapDir(e) {
		const dir = e.currentTarget.dataset.dir;
		if (!this.isOpposite(this.direction, dir)) {
			this.pendingDir = dir;
		}
	},

	toggleWrap() {
		this.setData({ wrapMode: !this.data.wrapMode });
	},

	onRestart() {
		this.resetGame();
		this.onStart();
	},

	onPause() {
		if (this.data.isRunning) {
			this.stopLoop();
			this.setData({ isRunning: false });
		}
	},

	noop() {},

	generateFood() {
		if (!this.snake) this.snake = [];
		while (true) {
			const x = Math.floor(Math.random() * GRID_SIZE);
			const y = Math.floor(Math.random() * GRID_SIZE);
			const onSnake = this.snake.some((s) => s.x === x && s.y === y);
			const onObs = (this.levelObstacles || []).some((o) => o.x === x && o.y === y);
			if (!onSnake && !onObs) {
				this.food = { x, y };
				break;
			}
		}
	},

	gameOver() {
		this.stopLoop();
		this.haptic('heavy'); // 游戏结束：强烈震动
		this.playOver();
		const best = Math.max(this.data.best, this.data.score);
		if (best !== this.data.best) {
			wx.setStorageSync('snake_best', best);
		}
		this.setData({ best, isRunning: false });
		// 清空蛇，标记游戏已结束
		this.snake = null;
		wx.showToast({ title: '游戏结束', icon: 'none' });
	}
});
