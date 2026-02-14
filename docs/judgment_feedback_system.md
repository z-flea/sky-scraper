# 判定反馈系统说明文档

## 概述

判定反馈系统为游戏提供视觉和动画反馈，根据玩家放置楼层的精准度显示不同等级的判定文字和特效。

## 判定等级

### Perfect（完美）
- **触发条件**：偏移 < 5% 楼层宽度
- **分数**：+10
- **文字**：PERFECT!
- **颜色**：金色渐变 (#FFD700 → #FFA500)
- **动画效果**：
  - 从小到大弹出（0.5x → 1.3x → 1.2x → 1.0x）
  - 轻微旋转（-10° → 5° → -2° → 0°）
  - 向上飘动并淡出
  - 持续时间：1.5秒
- **粒子效果**：20个金色粒子向四周爆发
- **特殊效果**：磁吸校正（自动对齐到上一层中心）

### Great（很好）
- **触发条件**：偏移 5-20% 楼层宽度
- **分数**：+5
- **文字**：GREAT!
- **颜色**：蓝色 (#4A90E2)
- **动画效果**：
  - 弹跳放大（0.8x → 1.2x → 1.0x）
  - 向上飘动并淡出
  - 持续时间：1.5秒
- **粒子效果**：10个蓝色粒子向四周扩散

### Okay（还行）
- **触发条件**：偏移 20-50% 楼层宽度
- **分数**：+3
- **文字**：OKAY
- **颜色**：橙色 (#FFA500)
- **动画效果**：
  - 轻微左右抖动
  - 向上飘动并淡出
  - 持续时间：1.5秒
- **粒子效果**：无

### Miss（失误）
- **触发条件**：偏移 ≥ 50% 楼层宽度
- **分数**：0（扣除 1 HP）
- **文字**：MISS!
- **颜色**：红色 (#FF4444)
- **动画效果**：
  - 快速震动（多方向抖动）
  - 向下坠落并淡出
  - 持续时间：1.5秒
- **粒子效果**：15个红色粒子向下坠落
- **特殊效果**：屏幕震动 0.5秒

## 附加功能

### 分数飘字
- 在判定文字下方显示获得的分数（+10、+5、+3）
- 使用与判定文字相同的颜色
- 淡入淡出效果（无飘动）
- 持续时间：1.5秒（与判定文字同步）

### 屏幕震动
- 仅在 Miss 判定时触发
- 画布在 0.5秒内进行随机方向的震动
- 震动幅度逐渐衰减（10px → 1px）

## 技术实现

### 文件结构
```
src/ui/judgment_feedback.js  # 判定反馈系统主文件
```

### 核心类：JudgmentFeedback

#### 方法

**show(grade, position, points)**
- 显示判定反馈
- 参数：
  - `grade`: 判定等级 ('Perfect', 'Great', 'Okay', 'Miss')
  - `position`: 屏幕位置 {x, y}（可选，默认居中）
  - `points`: 获得的分数（可选）

**showPoints(points, x, y, color)**
- 显示分数飘字
- 参数：
  - `points`: 分数值
  - `x, y`: 屏幕位置
  - `color`: 文字颜色

**createParticles(grade, x, y)**
- 创建粒子爆发效果
- 参数：
  - `grade`: 判定等级
  - `x, y`: 粒子起始位置

**shakeScreen()**
- 触发屏幕震动效果

**clear()**
- 清除所有活动的判定元素

### CSS 动画

所有动画使用 CSS @keyframes 实现，包括：
- `judgment-perfect`: Perfect 判定动画
- `judgment-great`: Great 判定动画
- `judgment-okay`: Okay 判定动画
- `judgment-miss`: Miss 判定动画
- `particle-burst-perfect`: Perfect 粒子动画
- `particle-burst-great`: Great 粒子动画
- `particle-burst-miss`: Miss 粒子动画
- `points-float`: 分数飘字动画
- `screen-shake`: 屏幕震动动画

## 集成方式

### 在 Game 类中初始化
```javascript
import { JudgmentFeedback } from '../ui/judgment_feedback.js';

// 构造函数中
this.judgmentFeedback = new JudgmentFeedback();
```

### 在判定时调用
```javascript
const judgment = this.judgmentSystem.judge(finalGrade, floor, prevFloor);
this.judgmentFeedback.show(judgment.grade, null, judgment.points);
```

## 设计资源需求

### 当前实现（纯代码）
当前版本使用纯 CSS 和 JavaScript 实现，**不需要任何图片资源**。

### 可选的增强资源

如果你想要更精致的视觉效果，可以准备以下资源：

#### 1. 判定图标（可选）
- `perfect_star.png` - 金色星星图标
  - 尺寸：128x128px
  - 格式：PNG（透明背景）
  - 用途：Perfect 判定时显示在文字旁边

- `great_check.png` - 青色对勾图标
  - 尺寸：128x128px
  - 格式：PNG（透明背景）
  - 用途：Great 判定时显示

- `okay_warning.png` - 橙色警告图标
  - 尺寸：128x128px
  - 格式：PNG（透明背景）
  - 用途：Okay 判定时显示

- `miss_cross.png` - 红色叉号图标
  - 尺寸：128x128px
  - 格式：PNG（透明背景）
  - 用途：Miss 判定时显示

#### 2. 粒子纹理（可选）
- `particle_glow.png` - 发光粒子
  - 尺寸：32x32px
  - 格式：PNG（透明背景）
  - 颜色：白色（可通过代码着色）
  - 用途：替代当前的纯色圆形粒子

- `particle_spark.png` - 火花粒子
  - 尺寸：32x32px
  - 格式：PNG（透明背景）
  - 用途：Perfect 判定的特殊粒子效果

#### 3. 光效纹理（可选）
- `glow_ring.png` - 光环纹理
  - 尺寸：256x256px
  - 格式：PNG（透明背景）
  - 用途：判定文字背景光效

- `light_ray.png` - 光线纹理
  - 尺寸：512x128px
  - 格式：PNG（透明背景）
  - 用途：Perfect 判定的放射光线

### 资源使用建议

1. **如果不提供图片资源**：系统将使用当前的纯代码实现，效果已经足够好
2. **如果提供图片资源**：需要修改 `judgment_feedback.js` 中的相关代码来加载和使用这些资源

## 性能优化

### 已实现的优化
- 使用 CSS 动画而非 JavaScript 动画（GPU 加速）
- 自动清理过期的 DOM 元素
- 粒子数量根据判定等级调整（Perfect: 20, Great: 10, Miss: 15, Okay: 0）

### 建议的优化
- 如果游戏运行在低性能设备上，可以：
  - 减少粒子数量
  - 禁用屏幕震动
  - 简化动画效果

## 自定义配置

### 修改判定文字
在 `getGradeConfig()` 方法中修改 `text` 属性：
```javascript
Perfect: {
  text: '完美！',  // 改为中文
  // ...
}
```

### 修改颜色
在 `getGradeConfig()` 方法中修改 `color` 和 `glowColor` 属性。

### 修改动画时长
在 `getGradeConfig()` 方法中修改 `duration` 属性（单位：秒）。

### 修改粒子数量
在 `createParticles()` 方法中修改 `particleCount` 变量。

## 测试建议

1. **测试所有判定等级**：
   - 使用游戏的测试模式（按 T 键）快速添加楼层
   - 故意制造不同精度的放置来触发各种判定

2. **测试性能**：
   - 连续快速放置楼层，观察是否有卡顿
   - 检查 DOM 元素是否正确清理（使用浏览器开发者工具）

3. **测试视觉效果**：
   - 在不同分辨率下测试
   - 检查文字是否清晰可读
   - 确认动画流畅度

## 未来扩展

### 可能的增强功能
1. **连击（Combo）显示**：
   - 在判定文字旁边显示连击数
   - 连击数越高，效果越华丽

2. **音效集成**：
   - 为每个判定等级添加独特的音效
   - Perfect 判定播放特殊的"完美"音效

3. **成就提示**：
   - 达成特定条件时显示成就解锁动画
   - 例如："连续 10 次 Perfect！"

4. **自定义主题**：
   - 允许玩家选择不同的判定文字样式
   - 提供多种颜色主题

## 故障排除

### 判定文字不显示
- 检查 `judgment_feedback.js` 是否正确导入
- 检查浏览器控制台是否有错误
- 确认 `JudgmentFeedback` 已在 Game 类中初始化

### 动画不流畅
- 检查 CSS 动画是否正确注入到 `<head>` 中
- 尝试减少粒子数量
- 检查浏览器是否支持 CSS 动画

### 屏幕震动不工作
- 确认 `game-canvas` 元素存在
- 检查 CSS 动画 `screen-shake` 是否正确定义

## 总结

判定反馈系统为游戏提供了丰富的视觉反馈，增强了玩家的游戏体验。当前实现使用纯代码，无需额外的设计资源即可运行。如果需要更精致的效果，可以根据上述建议准备相应的图片资源。
