# 移动端适配说明

## 概述

Sky Scraper 现已支持移动端设备（手机和平板）。游戏会自动检测设备类型并应用相应的优化配置。

## 主要改动

### 1. 设备检测
- 新增 `src/utils/device_detector.js` 模块
- 自动检测设备类型（桌面/平板/手机）
- 检测触摸支持和屏幕方向

### 2. 触摸控制
- 新增 `src/utils/touch_controller.js` 模块
- 单击屏幕：释放楼层
- 双击屏幕：重新开始游戏
- 自动阻止触摸事件的默认行为（防止页面滚动）

### 3. 响应式 UI
- **移动端优化（≤768px）**：
  - 分数显示：36px → 18px
  - 楼层计数：32px → 16px
  - 红心 HP：48px → 28px
  - 设置按钮：18px → 14px
  - 底部 UI 间距缩小
  - 游戏结束标题：48px → 28px

- **小屏手机优化（≤480px）**：
  - 分数显示：18px → 16px
  - 楼层计数：16px → 14px
  - 红心 HP：28px → 24px
  - 设置按钮：14px → 12px
  - 所有间距进一步缩小

- **通用优化**：
  - 按钮最小高度 40px（适合手指点击）
  - 布局自动调整为垂直排列
  - 禁用文本选择和点击高亮
  - 禁用用户缩放（防止误操作）

### 4. 性能优化
- 新增 `src/config/performance_config.js` 模块
- 移动端配置：
  - 关闭抗锯齿
  - 降低像素比（最高 2x）
  - 减少粒子数量（50 个）
  - 禁用后处理效果
  - 降低物理更新频率（30 FPS）

- 平板配置：
  - 开启抗锯齿
  - 中等粒子数量（100 个）
  - 部分后处理效果
  - 正常物理更新（60 FPS）

- 桌面配置：
  - 完整视觉效果
  - 最高粒子数量（200 个）
  - 所有后处理效果
  - 完整物理更新（60 FPS）

### 5. 难度调整
- 移动端机械臂速度降低 15%（`craneSpeedMultiplier: 0.85`）
- 移动端判定更宽松 15%（`judgmentLeniency: 1.15`）
- 平板难度介于移动端和桌面之间

## 技术细节

### 设备检测逻辑
```javascript
// 移动设备检测
/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)

// 平板检测
/ipad|android(?!.*mobile)|tablet/i.test(userAgent)

// 触摸支持检测
'ontouchstart' in window || navigator.maxTouchPoints > 0
```

### 性能配置应用
- 渲染器配置：在 `SceneManager` 初始化时应用
- 粒子配置：在粒子系统创建时应用
- 后处理配置：在效果管线初始化时应用
- 难度配置：在 `Crane` 和 `Physics` 模块中应用

### Viewport 配置
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### CSS 优化
```css
body {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

## 测试建议

### 桌面测试
1. 打开浏览器开发者工具（F12）
2. 切换到设备模拟模式（Ctrl+Shift+M 或 Cmd+Shift+M）
3. 选择移动设备（如 iPhone 14 Pro）
4. 刷新页面测试

### 真机测试
1. 确保手机和电脑在同一网络
2. 运行 `npm run dev -- --host`
3. 在手机浏览器访问显示的网络地址
4. 测试触摸控制和性能

## 已知限制

1. 游戏仍然是横屏优先设计
2. 竖屏模式下可能需要滚动查看完整游戏区域
3. 移动端性能取决于设备硬件

## 未来改进

- [ ] 添加竖屏模式优化
- [ ] 添加虚拟摇杆控制（可选）
- [ ] 添加触觉反馈（振动）
- [ ] 优化移动端资源加载
- [ ] 添加离线缓存支持

## 更新日志

### 2026-02-15
- 初始移动端支持
- 添加设备检测和触摸控制
- 实现响应式 UI 布局
- 优化移动端性能配置
- 调整移动端游戏难度

### 2026-02-15 (第二次优化)
- 进一步缩小移动端字体和元素尺寸
- 添加小屏手机专用媒体查询（≤480px）
- 优化设置面板移动端显示
- 禁用用户缩放和文本选择
- 减少所有间距以节省屏幕空间
