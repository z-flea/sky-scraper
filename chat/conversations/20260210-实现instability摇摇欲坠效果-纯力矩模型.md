# 实现基于 instability 的摇摇欲坠效果 + 纯力矩模型

**日期**：2026-02-10
**参与者**：用户、AI Assistant
**相关提交**：`50662da`

---

## 问题背景

用户反馈：**落下的建筑没有根据着陆准确度实现"摇摇欲坠"的效果**

### 深度分析发现的根本原因

通过 Explore agents 深度分析，发现了核心问题：

**instability 值被追踪但完全没有用于视觉效果**

1. **instability 值系统**：已实现但未使用
   - 每次判定后更新：Perfect (-10), Great (+5), Okay (+20)
   - 反映玩家的累积表现
   - **问题**：这个值被追踪但完全没有用于任何视觉效果

2. **着陆旋转系统**：已实现且工作正常
   - 基于着陆偏移量（offset）产生旋转冲击
   - **问题**：不考虑 instability 值，只基于几何偏移

3. **塔楼摆动系统**：已实现且工作正常
   - 基于重心偏移（CoM offset）产生整体倾斜
   - **问题**：不考虑 instability 值，只基于重心位置

### 用户期望

- 多次坏着陆（Okay） → instability 累积 → 塔楼应该看起来摇摇欲坠、危险
- 多次好着陆（Perfect） → instability 降低 → 塔楼应该看起来稳固、安全

---

## 解决方案设计

### Phase 1: 用户选择参数

通过 AskUserQuestion 工具收集用户偏好：

1. **放大强度**：保守（1.5倍）
   - instability=100 时效果放大50%
   - 变化较温和，适合渐进式体验

2. **抖动阈值**：中期（60）
   - instability 达到60开始抖动
   - 平衡警告和游戏体验

3. **计算方式**：顶部5层平均值
   - 使用顶部5层楼的平均 instability
   - 反映整体稳定性，变化平滑

### Phase 2: Instability Factor 系统

引入影响因子系统，让 instability 值放大现有的视觉效果。

#### 三级效果系统

| instability 范围 | 影响因子 | 视觉效果 |
|-----------------|---------|---------|
| 0-30 (低) | 1.0-1.15 | 正常，轻微放大 |
| 30-60 (中) | 1.15-1.30 | 明显放大，摆动更持久 |
| 60+ (高) | 1.30-1.5 | 强烈放大 + 随机抖动 |

---

## 物理模型演进

### 发现：混合模型问题

用户提出关键问题：**"大楼就像一根插在地上的弹簧钢条，当楼层落在左边，产生向左的力矩，大楼向左弯曲，然后因为弹性弹回右边，来回摆动并逐渐静止。这和重心是两回事吗？"**

#### 当前实现（混合模型）

```javascript
// 1. 楼层落地产生冲击
const impactForce = offset * IMPACT_FORCE.MULTIPLIER;
this.towerSwayVelocity += impactForce;  // ✅ 增加角速度

// 2. 但目标角度基于重心偏移
const targetAngle = Physics.calculateTargetSwayAngle(comOffset, floorCount);

// 3. 弹簧力将大楼拉向重心位置
const springForce = (targetAngle - currentAngle) * stiffness;
```

**行为**：
- 振荡中心 = 重心位置
- 大楼围绕重心位置振荡，而不是垂直位置

#### 用户期望（纯力矩模型）

```javascript
// 1. 楼层落地产生冲击力矩
const torque = offset * sensitivity;
this.towerSwayVelocity += torque;

// 2. 目标角度永远是0（垂直）
const targetAngle = 0;  // ⚠️ 关键区别！

// 3. 弹性恢复力将大楼拉回垂直位置
const springForce = (0 - currentAngle) * stiffness;
```

**行为**：
- 振荡中心 = 垂直位置（0度）
- 大楼像插在地上的弹簧钢条
- 弯曲后弹回，来回摆动，逐渐静止

### 关键区别对比

| 特性 | 混合模型（修改前） | 纯力矩模型（修改后） |
|------|----------------|------------------|
| 振荡中心 | 重心位置 | 垂直位置（0度） |
| 物理意义 | 大楼追踪质量分布 | 大楼像弹簧钢条 |
| 交替落地 | 重心回正 → 大楼回正 | 力矩抵消 → 继续振荡 |
| 视觉效果 | 倾斜 + 小幅振荡 | 大幅来回摆动 |

---

## 实施方案

### 1. 添加 Instability Factor 计算

**文件**: `src/core/physics.js:17-30`

```javascript
static calculateInstabilityFactor(instability) {
  // Normalize instability to 0-1 range (assuming max 100)
  // 0 → 1.0 (normal)
  // 50 → 1.25 (amplify 25%)
  // 100+ → 1.5 (amplify 50%, conservative)
  const normalizedInstability = Math.min(instability / 100, 1.0);
  return 1.0 + normalizedInstability * 0.5;
}
```

### 2. 改为纯力矩模型

**文件**: `src/core/game.js:603-639`

**关键修改**：
```javascript
// 移除重心追踪
// const comOffset = Physics.calculateTowerCenterOfMassOffset(this.floors);
// const targetAngle = Physics.calculateTargetSwayAngle(comOffset, this.floors.length);

// 改为固定目标角度 0（垂直）
const targetAngle = 0;  // Always return to vertical, not center of mass
```

### 3. Instability 放大效果

#### 3.1 塔楼摆动放大

```javascript
// 计算 instability 影响因子
const instabilityFactor = Physics.calculateInstabilityFactor(avgInstability);

// 传递给摆动系统
const swayResult = Physics.updateTowerSway(
  this.towerSwayAngle,
  this.towerSwayVelocity,
  targetAngle,
  deltaTime,
  this.floors.length,
  instabilityFactor  // 放大效果
);
```

在 `updateTowerSway()` 中：
```javascript
const damping = TOWER_SWAY.DAMPING / instabilityFactor;  // 降低阻尼，摆动更持久
```

#### 3.2 着陆旋转放大

```javascript
const prevInstability = prevFloor ? (prevFloor.instability || 0) : 0;
const instabilityFactor = Physics.calculateInstabilityFactor(prevInstability);

floor.landingRotationVelocity = offset * LANDING_ROTATION.SENSITIVITY * instabilityFactor;
```

#### 3.3 高 instability 抖动效果

**文件**: `src/core/game.js:537-565`

```javascript
updateInstabilityJitter(deltaTime) {
  this.jitterTime += deltaTime;

  if (this.jitterTime >= 0.1) {
    this.jitterTime = 0;

    // 计算平均 instability（顶部5层）
    const topFloors = this.floors.slice(-5);
    const avgInstability = topFloors.reduce((sum, f) => sum + (f.instability || 0), 0) / topFloors.length;

    // 只在 instability > 60 时产生抖动
    if (avgInstability > 60) {
      const jitterIntensity = (avgInstability - 60) / 40;

      this.jitterOffset.x = (Math.random() - 0.5) * 0.04 * jitterIntensity;
      this.jitterOffset.y = (Math.random() - 0.5) * 0.02 * jitterIntensity;
      this.jitterOffset.rotation = (Math.random() - 0.5) * 0.02 * jitterIntensity;
    } else {
      this.jitterOffset.x = 0;
      this.jitterOffset.y = 0;
      this.jitterOffset.rotation = 0;
    }
  }
}
```

应用抖动（只影响顶部5层）：
```javascript
if (index >= this.floors.length - 5) {
  floor.sprite.position.x += this.jitterOffset.x;
  floor.sprite.position.y += this.jitterOffset.y;
  floor.sprite.rotation.z += this.jitterOffset.rotation;
}
```

### 4. 配置参数

**文件**: `config/physics_params.js:269-308`

```javascript
export const INSTABILITY_EFFECTS = {
  MAX_FACTOR: 1.5,              // 保守放大（用户选择）
  NORMALIZATION_BASE: 100,      // 归一化基准
  JITTER_THRESHOLD: 60,         // 中期阈值（用户选择）
  JITTER_UPDATE_INTERVAL: 0.1,  // 抖动更新间隔
  JITTER_POSITION_X: 0.04,      // 水平抖动幅度
  JITTER_POSITION_Y: 0.02,      // 垂直抖动幅度
  JITTER_ROTATION: 0.02,        // 旋转抖动幅度
  CALCULATION_WINDOW_SIZE: 5,   // 顶部5层（用户选择）
};
```

更新 IMPACT_FORCE 注释：
```javascript
export const IMPACT_FORCE = {
  // 作用：楼层落地时产生的力矩，增加塔楼的角速度
  // 物理意义：在纯力矩模型中，这是产生振荡的核心参数
  // 修改：2026-02-10 改为纯力矩模型，此参数是核心
  MULTIPLIER: 3.0,
};
```

---

## 纯力矩模型物理行为

### 运动过程

```
楼层落在左边（offset = -0.5）
  ↓
产生向左的力矩（torque = -0.5 × 3.0 = -1.5 rad/s）
  ↓
角速度增加（velocity += -1.5）
  ↓
大楼向左弯曲（angle 变负）
  ↓
弹性恢复力产生反向力矩（springForce = (0 - angle) × stiffness）
  ↓
大楼减速、停止、反向
  ↓
大楼向右摆动
  ↓
来回振荡，逐渐衰减（阻尼作用）
  ↓
最终静止在垂直位置（0°）
```

### 关键特性

1. **振荡中心**：垂直位置（0°），不是重心位置
2. **持续振荡**：即使交替方向落地，大楼仍会振荡
3. **弹簧钢条**：像插在地上的弹簧钢条，弯曲后弹回
4. **逐渐静止**：阻尼作用让振荡逐渐衰减

---

## 测试验证

### 测试场景

#### 场景 1：低 instability
1. 连续放置5层楼，都获得 Perfect 判定
2. **预期**：塔楼稳定，摆动和旋转都很小，无抖动

#### 场景 2：中 instability
1. 故意让前5层楼都获得 Great 判定（instability 累积到 25）
2. **预期**：摆动和旋转效果比场景1明显，但无抖动

#### 场景 3：高 instability
1. 故意让前10层楼都获得 Okay 判定（instability 累积到 200）
2. **预期**：
   - 摆动非常明显且持久
   - 着陆旋转剧烈
   - 顶部5层楼产生明显的随机抖动
   - 整体看起来"摇摇欲坠"

#### 场景 4：纯力矩模型验证
1. **单侧连续落地**：连续3层都落在左边
   - **预期**：大楼向左弯曲，然后弹回右边，来回振荡

2. **交替落地**：左-右-左-右交替
   - **预期**：每次落地都产生力矩，大楼持续振荡（不会像重心模型那样回正）

3. **大偏移落地**：故意让楼层偏移很大（offset ≈ 1.0）
   - **预期**：产生强烈的力矩冲击，大楼大幅度振荡

---

## 参数微调指南

### Instability 效果调整

| 问题 | 调整参数 | 方向 | 新值建议 |
|------|----------|------|----------|
| 放大效果不明显 | MAX_FACTOR | 增加 | 1.5 → 2.0 |
| 放大效果太强 | MAX_FACTOR | 减少 | 1.5 → 1.2 |
| 抖动出现太早 | JITTER_THRESHOLD | 增加 | 60 → 80 |
| 抖动出现太晚 | JITTER_THRESHOLD | 减少 | 60 → 40 |
| 抖动太剧烈 | JITTER_* 系数 | 减少 | ×0.5 |
| 抖动不明显 | JITTER_* 系数 | 增加 | ×2.0 |

### 力矩模型调整

| 问题 | 调整参数 | 方向 | 新值建议 |
|------|----------|------|----------|
| 振荡太弱 | IMPACT_FORCE.MULTIPLIER | 增加 | 3.0 → 5.0 |
| 振荡太强 | IMPACT_FORCE.MULTIPLIER | 减少 | 3.0 → 2.0 |
| 振荡衰减太快 | TOWER_SWAY.DAMPING | 降低 | 2.5 → 1.5 |
| 振荡持续太久 | TOWER_SWAY.DAMPING | 增加 | 2.5 → 3.5 |
| 振荡太快 | TOWER_SWAY.STIFFNESS | 降低 | 减少刚度 |
| 振荡太慢 | TOWER_SWAY.STIFFNESS | 增加 | 增加刚度 |

---

## 技术亮点

### 1. 深度问题分析

使用 Explore agents 并行探索：
- Agent 1: 调查着陆旋转系统实现
- Agent 2: 调查塔楼摆动系统和 instability 使用情况

发现核心问题：instability 值被追踪但未使用

### 2. 物理模型演进

从混合模型（重心追踪 + 力矩冲击）演进到纯力矩模型（弹簧钢条）：
- 用户提出关键物理概念问题
- 通过 sequential-thinking 深度分析两个模型的区别
- 明确用户期望的物理行为
- 实施纯力矩模型

### 3. 渐进式效果设计

三级效果系统：
- 低 instability：正常效果
- 中 instability：放大效果（敏感度提高，阻尼降低）
- 高 instability：放大 + 抖动效果

### 4. 用户参与设计

使用 AskUserQuestion 收集用户偏好：
- 放大强度：保守 vs 激进
- 抖动阈值：早期 vs 中期 vs 后期
- 计算方式：单层 vs 平均值

---

## 修改文件

1. **src/core/physics.js**
   - 添加 `calculateInstabilityFactor()` 方法
   - 修改 `updateTowerSway()` 支持 instabilityFactor 参数
   - 修改 `calculateTargetSwayAngle()` 支持 instabilityFactor 参数

2. **src/core/game.js**
   - 改为纯力矩模型（目标角度固定为0）
   - 添加 jitter 状态变量
   - 添加 `updateInstabilityJitter()` 方法
   - 修改 `applySwayVisuals()` 应用抖动效果
   - 修改 `releaseFloor()` 使用 instability 放大着陆旋转

3. **config/physics_params.js**
   - 添加 `INSTABILITY_EFFECTS` 配置节
   - 更新 `IMPACT_FORCE` 注释说明

---

## 相关提交

- **50662da**: feat(physics): 实现基于 instability 的摇摇欲坠效果 + 纯力矩模型

---

## 经验总结

### 关键洞察

1. **问题诊断的重要性**
   - 使用 Explore agents 深度分析现有实现
   - 发现 instability 值被追踪但未使用的核心问题

2. **物理模型的选择**
   - 混合模型 vs 纯力矩模型
   - 用户的物理直觉（"弹簧钢条"）指导了正确的模型选择

3. **渐进式设计**
   - 三级效果系统提供平滑的视觉反馈
   - 从正常 → 放大 → 抖动

4. **用户参与**
   - 通过 AskUserQuestion 收集偏好
   - 确保实现符合用户期望

### 调试方法

1. **深度分析**：使用 Explore agents 理解现有实现
2. **物理建模**：理解弹簧-阻尼系统的运动方程
3. **参数调优**：根据视觉效果微调参数
4. **用户验证**：让用户测试并反馈

---

## 后续工作

- [ ] 用户测试纯力矩模型效果
- [ ] 根据用户反馈微调参数
- [ ] 可能需要调整 IMPACT_FORCE.MULTIPLIER 以产生更明显的振荡
- [ ] 考虑添加调试日志以便观察 instability 值和影响因子

---

**对话完成时间：** 2026-02-10
**开发服务器：** http://localhost:5184/
**状态：** ✅ 实现完成，等待用户测试反馈
