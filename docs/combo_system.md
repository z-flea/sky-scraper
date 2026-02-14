# 连击功能实现文档

## 功能概述

连击系统采用 **Perfect 时间窗口机制**，提供更流畅的连击体验。

### 核心机制：Perfect 时间窗口

#### 触发条件
- 获得 **Perfect** 判定时，激活 5 秒时间窗口
- 时间窗口显示为屏幕右上角的金色进度条

#### 时间窗口内的效果
1. **判定覆盖**：任何非 Miss 判定（Great、Okay）都被视为 Perfect
2. **分数统一**：所有判定按 Perfect 分数计算
3. **无特效显示**：不显示判定等级特效（避免视觉干扰）
4. **时间重置**：每次下落重置时间窗口为 5 秒
5. **连击累积**：连击数持续增加

#### 中断条件
- **Miss 判定**：立即打破连击和时间窗口
- **超时**：5 秒内没有下落，时间窗口自动失效

### 连击里程碑

#### 3 Combo - Steady（稳固）
- **效果**：减少顶部 5 层楼的不稳定性 50%
- **视觉**：蓝色里程碑提示 + 粒子效果

#### 5 Combo - Reinforced（加固）
- **效果**：下一层楼宽度 +10%
- **视觉**：紫色里程碑提示 + 粒子效果

#### 10 Combo - Architect（建筑师）
- **效果**：奇迹修复 - 将最后 10 层楼对齐到中心，清零不稳定性
- **视觉**：金色里程碑提示 + 粒子效果

## 实现细节

### 文件结构

```
src/
├── systems/
│   └── combo.js          # 连击系统逻辑（时间窗口机制）
└── ui/
    └── combo_display.js  # 连击 UI 显示（含时间条）
```

### 核心代码

#### ComboSystem (src/systems/combo.js)

**时间窗口状态**
```javascript
this.perfectWindowActive = false;      // 时间窗口是否激活
this.perfectWindowTimeLeft = 0;        // 剩余时间
this.perfectWindowDuration = 5.0;      // 窗口持续时间（5秒）
```

**关键方法**
- `update(grade, deltaTime)` - 更新连击状态和时间窗口
  - `grade = null` 时仅更新时间倒计时
  - `grade != null` 时处理判定逻辑
- `activatePerfectWindow()` - 激活时间窗口
- `deactivatePerfectWindow()` - 停用时间窗口
- `getPerfectWindowStatus()` - 获取时间窗口状态（用于 UI 显示）

**判定覆盖逻辑**
```javascript
// 如果时间窗口激活，任何非 Miss 判定都算 Perfect
if (this.perfectWindowActive) {
  this.comboCount++;
  this.perfectWindowTimeLeft = this.perfectWindowDuration; // 重置时间
  return {
    overrideGrade: 'Perfect' // 覆盖原判定
  };
}
```

#### ComboDisplay (src/ui/combo_display.js)

**时间条 UI**
```javascript
// 时间条容器
this.perfectTimerContainer = document.createElement('div');
// 时间条进度
this.perfectTimerBar = document.createElement('div');
```

**关键方法**
- `updatePerfectTimer(windowStatus)` - 更新时间条显示
  - 根据剩余时间更新进度条宽度
  - 时间 < 30% 时变红色警告

### Game.js 集成

#### 1. 判定处理（releaseFloor）
```javascript
// 更新连击（传入 deltaTime = 0，因为这里只是判定时刻）
const comboResult = this.comboSystem.update(judgment.grade, 0);

// 判定覆盖逻辑
let displayGrade = judgment.grade;
let displayPoints = judgment.points;

if (comboResult.overrideGrade === 'Perfect') {
  displayGrade = 'Perfect';
  displayPoints = this.judgmentSystem.judgmentRules.Perfect.points;
}

// 如果在 Perfect 窗口内且判定被覆盖，不显示判定特效
if (floor.id !== 1 && !comboResult.overrideGrade) {
  this.judgmentFeedback.show(displayGrade, null, displayPoints);
}
```

#### 2. 时间窗口更新（update 循环）
```javascript
// 更新连击系统（perfect window countdown）
this.comboSystem.update(null, deltaTime);
const windowStatus = this.comboSystem.getPerfectWindowStatus();
this.comboDisplay.updatePerfectTimer(windowStatus);
```

## 测试方法

### 手动测试步骤

1. **启动游戏**
   ```bash
   npm run dev
   ```
   访问 http://localhost:5174/

2. **测试 Perfect 时间窗口激活**
   - 放置一层楼，获得 Perfect 判定
   - 观察右上角出现金色时间条
   - 时间条应从满格开始倒计时

3. **测试时间窗口内判定覆盖**
   - 在时间窗口激活时，故意放置偏移的楼层（应该是 Great 或 Okay）
   - 观察：
     - 不显示判定特效
     - 分数按 Perfect 计算（10 分）
     - 连击数增加
     - 时间条重置为满格
   - 控制台应输出：`[Combo] Grade overridden: Great → Perfect (window active)`

4. **测试时间窗口超时**
   - 激活时间窗口后，等待 5 秒不下落
   - 观察时间条逐渐减少
   - 时间条变红（剩余 < 30%）
   - 时间条消失（超时）
   - 控制台应输出：`[Combo] Perfect window expired`

5. **测试 Miss 中断**
   - 激活时间窗口
   - 故意放置 Miss 判定
   - 观察：
     - 时间条立即消失
     - 连击数重置为 0
     - 显示 Miss 判定特效

6. **测试连击里程碑**
   - 连续获得 3 次判定（Perfect 或在窗口内）→ 蓝色 "STEADY" 提示
   - 连续获得 5 次判定 → 紫色 "REINFORCED" 提示，下一层宽度增加
   - 连续获得 10 次判定 → 金色 "ARCHITECT" 提示，楼层对齐

### 视觉效果验证

- **连击数显示**：右上角金色文字，有放大动画
- **时间条**：
  - 位置：连击数下方
  - 颜色：金色（正常）→ 红色（< 30%）
  - 动画：平滑倒计时，每次下落重置
- **里程碑提示**：屏幕中央大字提示，带旋转和缩放动画
- **判定覆盖**：时间窗口内不显示 Great/Okay 特效

### 控制台日志

```
[Combo] Perfect window activated! Duration: 5 s
[Combo] Grade overridden: Great → Perfect (window active)
[Combo] Grade overridden: Okay → Perfect (window active)
3 Combo - Steady! Instability reduced by 50%
[Combo] Steady effect applied: instability reduced by 50% for top floors
[Combo] Perfect window expired
Combo broken at 3
```

## 游戏体验优化

### 优势
1. **流畅连击**：不需要每次都打 Perfect，降低难度
2. **视觉清爽**：窗口内不显示重复的判定特效
3. **时间压力**：5 秒倒计时增加紧张感
4. **策略性**：玩家可以选择快速下落保持窗口，或等待更好的时机

### 平衡性
- **窗口时长**：5 秒（可调整 `perfectWindowDuration`）
- **触发条件**：仅 Perfect 触发（Great/Okay 不触发）
- **中断条件**：Miss 或超时
- **分数统一**：窗口内统一按 Perfect 计分

## 后续优化建议

1. **音效**：
   - 时间窗口激活音效
   - 时间窗口即将结束警告音效
   - 连击里程碑音效

2. **视觉增强**：
   - 时间窗口激活时的屏幕边框发光效果
   - 时间条脉动动画
   - 连击数字的粒子拖尾效果

3. **难度调整**：
   - 根据楼层高度动态调整窗口时长
   - Phase 1-2: 5 秒
   - Phase 3-4: 4 秒
   - Phase 5+: 3 秒

4. **统计数据**：
   - 记录最长连击数
   - 记录 Perfect 窗口激活次数
   - 记录窗口内判定覆盖次数

## 更新日志

- 2026-02-13: 初始实现连击系统和 UI
- 2026-02-13: 重构为 Perfect 时间窗口机制
