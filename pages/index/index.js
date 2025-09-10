// index.js - 首页逻辑：头像/昵称输入 + 进入贪吃蛇
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    motto: 'Hello World',
    // 用户信息：默认头像与昵称（昵称为空）
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    // 是否已具备用户信息（用于切换视图）
    hasUserInfo: false,
    // 首次进入引导授权弹层
    showAuthPrompt: false,
    // 能力检测：新版 getUserProfile、nickname 输入类型
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },
  onLoad() {
    // 开发版：清除可能包含时间戳的旧缓存，强制使用默认信息
    wx.removeStorageSync('userInfo')
    console.log('开发版：清除旧缓存，使用默认用户信息')
    
    const defaultUserInfo = {
      nickName: '微信用户',
      avatarUrl: defaultAvatarUrl
    }
    this.setData({
      userInfo: defaultUserInfo,
      hasUserInfo: true,
      showAuthPrompt: false,
    })
    // 缓存默认信息
    wx.setStorageSync('userInfo', defaultUserInfo)
  },
  // 预置示例：点击头像跳转到 logs
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  // 选择头像回调：更新头像，并根据当前昵称判断 hasUserInfo
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    
    console.log('选择头像:', avatarUrl)
    
    // 开发版特殊处理：检测各种可能的开发版标识
    let finalAvatarUrl = avatarUrl
    const isDevVersion = avatarUrl && (
      avatarUrl.includes('timestamp') ||
      avatarUrl.includes('dev') ||
      avatarUrl.includes('test') ||
      avatarUrl.includes('mock') ||
      avatarUrl.includes('localhost') ||
      avatarUrl.includes('127.0.0.1')
    )
    
    if (isDevVersion) {
      console.log('检测到开发版头像，使用默认头像')
      finalAvatarUrl = defaultAvatarUrl
    }
    
    const next = {
      ...this.data.userInfo,
      avatarUrl: finalAvatarUrl,
    }
    this.setData({
      userInfo: next,
      hasUserInfo: !!nickName || (finalAvatarUrl && finalAvatarUrl !== defaultAvatarUrl),
    })
    // 只要有头像就缓存（不要求昵称）
    if (next.avatarUrl && next.avatarUrl !== defaultAvatarUrl) {
      wx.setStorageSync('userInfo', next)
    }
  },
  // 昵称输入/回车：实时写入并判断 hasUserInfo
  onInputChange(e) {
    const nickName = e.detail.value
    const { avatarUrl } = this.data.userInfo
    const next = {
      ...this.data.userInfo,
      nickName,
    }
    this.setData({
      userInfo: next,
      hasUserInfo: !!nickName || (avatarUrl && avatarUrl !== defaultAvatarUrl),
    })
    // 只要有昵称就缓存（不要求头像）
    if (next.nickName) {
      wx.setStorageSync('userInfo', next)
    }
  },
  // 进入贪吃蛇页面
  onGoSnake() {
    wx.navigateTo({ url: '/pages/snake/snake' })
  },
  // 兜底：获取用户信息（开发版中禁用）
  getUserProfile(e) {
    console.log('开发版：禁用getUserProfile，使用默认信息')
    // 开发版直接使用默认信息，避免时间戳问题
    const defaultUserInfo = {
      nickName: '微信用户',
      avatarUrl: defaultAvatarUrl
    }
    this.setData({
      userInfo: defaultUserInfo,
      hasUserInfo: true,
      showAuthPrompt: false,
    })
    wx.setStorageSync('userInfo', defaultUserInfo)
  },
})
