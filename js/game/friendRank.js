// friendRank.js - 好友排行榜管理
class FriendRank {
  constructor() {
    this.userInfo = null;
    this.friendList = [];
  }

  // 初始化用户信息
  initUserInfo() {
    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        success: (res) => {
          this.userInfo = res.userInfo;
          console.log('用户信息获取成功:', res.userInfo);
          
          // 保存用户信息到本地
          wx.setStorageSync('userInfo', res.userInfo);
          
          resolve(res.userInfo);
        },
        fail: (error) => {
          console.error('获取用户信息失败:', error);
          reject(error);
        }
      });
    });
  }

  // 保存用户最高分到云端
  saveUserScore(score) {
    if (!this.userInfo) {
      console.log('用户信息未初始化，跳过云端保存');
      return;
    }

    wx.setUserCloudStorage({
      KVDataList: [{
        key: 'bestScore',
        value: score.toString()
      }],
      success: () => {
        console.log('云端数据保存成功，分数:', score);
      },
      fail: (error) => {
        console.error('云端数据保存失败:', error);
      }
    });
  }

  // 获取好友排行榜
  getFriendRank() {
    return new Promise((resolve, reject) => {
      const key = 'bestScore';
      
      wx.getFriendCloudStorage({
        keyList: [key],
        success: (res) => {
          console.log('获取好友数据成功:', res);
          
          // 处理好友数据
          const friendList = res.data || [];
          
          // 格式化好友数据
          this.friendList = friendList.map(friend => {
            return {
              avatarUrl: friend.avatarUrl || '',
              nickName: friend.nickName || '匿名用户',
              score: friend.KVDataList && friend.KVDataList[0] 
                ? parseInt(friend.KVDataList[0].value) || 0 
                : 0
            };
          });
          
          // 按分数排序
          this.friendList.sort((a, b) => b.score - a.score);
          
          console.log('好友排行榜:', this.friendList);
          resolve(this.friendList);
        },
        fail: (error) => {
          console.error('获取好友数据失败:', error);
          reject(error);
        }
      });
    });
  }

  // 获取好友数量
  getFriendCount() {
    return this.friendList.length;
  }

  // 获取好友列表
  getFriendList() {
    return this.friendList;
  }
}

module.exports = FriendRank;

