// 游戏配置文件
// 用于存储游戏的各种配置参数

export const gameConfig = {
  // 游戏基础设置
  game: {
    title: 'Sky Scraper',
    version: '0.1.0',
    targetFPS: 60,
  },

  // 楼层设置
  floor: {
    initialWidth: 4.0,
    height: 0.5,
    dropSpeed: 2.0,
  },

  // 吊臂设置
  crane: {
    initialAmplitude: 3.0,
    initialAngularVelocity: 2.0,
    noiseRange: 0.2,
  },

  // 判定设置
  judgment: {
    perfect: 0.05,  // 5%
    great: 0.20,    // 20%
    okay: 0.50,     // 50%
  },

  // 连击设置
  combo: {
    steadyCombo: 3,
    reinforcedCombo: 5,
    architectCombo: 10,
  },

  // 阶段设置
  phases: [
    { id: 1, name: '城市', startFloor: 0, endFloor: 20 },
    { id: 2, name: '云层', startFloor: 21, endFloor: 50 },
    { id: 3, name: '平流层', startFloor: 51, endFloor: 100 },
    { id: 4, name: '轨道', startFloor: 101, endFloor: 200 },
    { id: 5, name: '星际', startFloor: 201, endFloor: Infinity },
  ],
};
