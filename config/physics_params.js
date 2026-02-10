/**
 * Physics Parameters Configuration
 *
 * 集中管理所有物理参数，避免硬编码魔法数字
 *
 * 使用规范：
 * 1. 所有物理参数必须在此文件中定义
 * 2. 参数必须有清晰的注释说明（单位、范围、物理意义）
 * 3. 修改参数后必须在 docs/parameter_history.md 中记录
 * 4. 使用 PARAM: 标记重要参数，便于搜索
 */

// ============================================================================
// 建筑摆动系统（Tower Sway System）
// ============================================================================

export const TOWER_SWAY = {
  // PARAM: 刚度系数（Stiffness）
  // 作用：控制建筑"回正"的速度
  // 单位：无量纲
  // 范围：0.1 - 20.0
  // 物理意义：弹簧刚度，值越大摆动越快
  STIFFNESS_MIN: 3.0,        // 高层建筑（100+层）的最小刚度
  STIFFNESS_MAX: 10.0,       // 低层建筑（1-20层）的最大刚度
  STIFFNESS_TRANSITION_START: 20,   // 开始降低刚度的楼层数
  STIFFNESS_TRANSITION_END: 100,    // 达到最小刚度的楼层数

  // PARAM: 阻尼系数（Damping）
  // 作用：控制摆动衰减速度
  // 单位：无量纲
  // 范围：0.05 - 5.0
  // 物理意义：能量耗散速度，值越大摆动停止越快
  DAMPING: 2.5,

  // PARAM: 敏感度（Sensitivity）
  // 作用：质心偏移转换为倾斜角度的系数
  // 单位：弧度/单位偏移
  // 范围：0.1 - 1.0
  // 物理意义：建筑对质心偏移的响应程度
  // 修改：2026-02-09 固定为 0.4（用户要求）
  SENSITIVITY_BASE: 0.4,     // 固定敏感度（所有楼层）
  SENSITIVITY_MAX: 0.4,      // 固定敏感度（所有楼层）
  SENSITIVITY_INCREMENT: 0.0,  // 不再随楼层增加

  // PARAM: 倒塌阈值（Collapse Threshold）
  // 作用：超过此角度建筑倒塌
  // 单位：弧度
  // 范围：0.12 - 0.26（约7° - 15°）
  COLLAPSE_ANGLE_MAX: 0.26,  // 15° (低层建筑)
  COLLAPSE_ANGLE_MIN: 0.12,  // 7° (高层建筑)
  COLLAPSE_TRANSITION_START: 20,
  COLLAPSE_TRANSITION_END: 100,

  // PARAM: 滑动窗口大小（Sliding Window Size）
  // 作用：计算重心时考虑的楼层数
  // 单位：层
  // 范围：5 - 15
  // 性能影响：值越大计算量越大，但物理模拟更准确
  WINDOW_SIZE: 5,

  // PARAM: 枢轴点位置（Pivot Point）
  // 作用：视觉弯曲效果的枢轴位置
  // 单位：层（从顶部往下数）
  // 范围：3 - 10
  PIVOT_OFFSET: 5,

  // PARAM: 视觉弯曲系数（Visual Bend Coefficient）
  // 作用：放大视觉弯曲效果
  // 单位：无量纲
  // 范围：0.5 - 5.0
  // 视觉影响：值越大建筑看起来越"柔软"
  BEND_COEFFICIENT: 4.5,
};

// ============================================================================
// 垂直振荡系统（Vertical Oscillation System）
// ============================================================================

export const VERTICAL_OSCILLATION = {
  // PARAM: 垂直刚度（Vertical Stiffness）
  // 作用：控制楼层弹跳速度
  // 单位：无量纲
  // 范围：10.0 - 30.0
  STIFFNESS: 20.0,

  // PARAM: 垂直阻尼（Vertical Damping）
  // 作用：控制弹跳衰减速度
  // 单位：无量纲
  // 范围：2.0 - 6.0
  DAMPING: 4.0,

  // PARAM: 初始冲击力（Initial Impact）
  // 作用：楼层落地时的初始向下冲击
  // 单位：单位/秒（速度）
  // 范围：-0.3 - -0.05
  // 修改：2026-02-09 设置为 0 禁用垂直弹跳（用户要求）
  INITIAL_IMPACT: 0,

  // PARAM: 冲击传播强度（Impact Propagation Strength）
  // 作用：冲击向下传播的强度系数
  // 单位：无量纲
  // 范围：0.1 - 0.5
  PROPAGATION_STRENGTH: 0.3,

  // PARAM: 冲击传播层数（Impact Propagation Layers）
  // 作用：冲击向下传播的楼层数
  // 单位：层
  // 范围：3 - 10
  PROPAGATION_LAYERS: 5,

  // PARAM: 稳定阈值（Stability Threshold）
  // 作用：振荡幅度小于此值时视为稳定
  // 单位：位置单位 / 速度单位
  STABILITY_OFFSET_THRESHOLD: 0.001,
  STABILITY_VELOCITY_THRESHOLD: 0.01,
};

// ============================================================================
// 冲击力系统（Impact Force System）
// ============================================================================

export const IMPACT_FORCE = {
  // PARAM: 冲击力倍数（Impact Multiplier）
  // 作用：楼层落地时产生的力矩，增加塔楼的角速度
  // 物理意义：在纯力矩模型中，这是产生振荡的核心参数
  // 单位：(rad/s) / 单位偏移
  // 范围：1.0 - 10.0
  // 当前值：3.0（产生明显但不过度的振荡）
  // 修改：2026-02-10 改为纯力矩模型，此参数是核心
  MULTIPLIER: 3.0,
};

// ============================================================================
// 着陆旋转系统（Landing Rotation System）
// ============================================================================

export const LANDING_ROTATION = {
  // PARAM: 旋转敏感度（Rotation Sensitivity）
  // 作用：偏移量转换为初始旋转速度的系数（注意：现在用于速度，不是角度）
  // 单位：(rad/s) / 单位偏移
  // 范围：1.5 - 3.5
  // 物理意义：偏移越大，初始旋转速度越大，冲击感越强
  // 修改：2026-02-10 从用于角度改为用于速度，数值从 1.5 → 2.5
  SENSITIVITY: 2.5,

  // PARAM: 旋转刚度（Rotation Stiffness）
  // 作用：控制回正速度
  // 单位：无量纲
  // 范围：30.0 - 50.0
  // 修改：2026-02-10 从 12.0 → 40.0（大幅增加，让回正更快，产生"重物砸下"效果）
  STIFFNESS: 40.0,

  // PARAM: 旋转阻尼（Rotation Damping）
  // 作用：控制旋转衰减速度
  // 单位：无量纲
  // 范围：6.0 - 10.0
  // 修改：2026-02-10 从 3.0 → 8.0（大幅增加，让振荡快速衰减）
  DAMPING: 8.0,

  // PARAM: 稳定阈值（Stability Threshold）
  // 作用：旋转角度小于此值时视为稳定
  // 单位：弧度
  STABILITY_ANGLE_THRESHOLD: 0.001,
  STABILITY_VELOCITY_THRESHOLD: 0.01,
};

// ============================================================================
// 辅助函数（Helper Functions）
// ============================================================================

/**
 * 计算当前楼层数对应的刚度
 * @param {number} floorCount - 楼层数
 * @returns {number} 刚度值
 */
export function calculateStiffness(floorCount) {
  const { STIFFNESS_MIN, STIFFNESS_MAX, STIFFNESS_TRANSITION_START, STIFFNESS_TRANSITION_END } = TOWER_SWAY;

  if (floorCount <= STIFFNESS_TRANSITION_START) {
    return STIFFNESS_MAX;
  }
  if (floorCount >= STIFFNESS_TRANSITION_END) {
    return STIFFNESS_MIN;
  }

  // 线性插值
  const progress = (floorCount - STIFFNESS_TRANSITION_START) /
                   (STIFFNESS_TRANSITION_END - STIFFNESS_TRANSITION_START);
  return STIFFNESS_MAX - (STIFFNESS_MAX - STIFFNESS_MIN) * progress;
}

/**
 * 计算当前楼层数对应的敏感度
 * @param {number} floorCount - 楼层数
 * @returns {number} 敏感度值
 */
export function calculateSensitivity(floorCount) {
  const { SENSITIVITY_BASE, SENSITIVITY_MAX, SENSITIVITY_INCREMENT, STIFFNESS_TRANSITION_START } = TOWER_SWAY;

  if (floorCount <= STIFFNESS_TRANSITION_START) {
    return SENSITIVITY_BASE;
  }

  const sensitivity = SENSITIVITY_BASE + (floorCount - STIFFNESS_TRANSITION_START) * SENSITIVITY_INCREMENT;
  return Math.min(sensitivity, SENSITIVITY_MAX);
}

/**
 * 计算当前楼层数对应的倒塌阈值
 * @param {number} floorCount - 楼层数
 * @returns {number} 倒塌角度阈值（弧度）
 */
export function calculateCollapseThreshold(floorCount) {
  const { COLLAPSE_ANGLE_MAX, COLLAPSE_ANGLE_MIN, COLLAPSE_TRANSITION_START, COLLAPSE_TRANSITION_END } = TOWER_SWAY;

  if (floorCount <= COLLAPSE_TRANSITION_START) {
    return COLLAPSE_ANGLE_MAX;
  }
  if (floorCount >= COLLAPSE_TRANSITION_END) {
    return COLLAPSE_ANGLE_MIN;
  }

  // 线性插值
  const progress = (floorCount - COLLAPSE_TRANSITION_START) /
                   (COLLAPSE_TRANSITION_END - COLLAPSE_TRANSITION_START);
  return COLLAPSE_ANGLE_MAX - (COLLAPSE_ANGLE_MAX - COLLAPSE_ANGLE_MIN) * progress;
}

// ============================================================================
// 参数验证（Parameter Validation）
// ============================================================================

/**
 * 验证所有参数是否在合理范围内
 * 开发模式下会在控制台输出警告
 */
export function validateParameters() {
  const warnings = [];

  // 验证刚度
  if (TOWER_SWAY.STIFFNESS_MIN < 0.1 || TOWER_SWAY.STIFFNESS_MIN > 20.0) {
    warnings.push(`STIFFNESS_MIN (${TOWER_SWAY.STIFFNESS_MIN}) 超出建议范围 [0.1, 20.0]`);
  }
  if (TOWER_SWAY.STIFFNESS_MAX < 0.1 || TOWER_SWAY.STIFFNESS_MAX > 20.0) {
    warnings.push(`STIFFNESS_MAX (${TOWER_SWAY.STIFFNESS_MAX}) 超出建议范围 [0.1, 20.0]`);
  }

  // 验证阻尼
  if (TOWER_SWAY.DAMPING < 0.05 || TOWER_SWAY.DAMPING > 5.0) {
    warnings.push(`DAMPING (${TOWER_SWAY.DAMPING}) 超出建议范围 [0.05, 5.0]`);
  }

  // 验证敏感度
  if (TOWER_SWAY.SENSITIVITY_BASE < 0.1 || TOWER_SWAY.SENSITIVITY_BASE > 1.0) {
    warnings.push(`SENSITIVITY_BASE (${TOWER_SWAY.SENSITIVITY_BASE}) 超出建议范围 [0.1, 1.0]`);
  }

  // 输出警告
  if (warnings.length > 0) {
    console.warn('⚠️ 物理参数警告：');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }

  return warnings.length === 0;
}

// 开发模式下自动验证
if (process.env.NODE_ENV === 'development') {
  validateParameters();
}

// ============================================================================
// Instability Effects Configuration
// ============================================================================
// 不稳定度视觉效果配置
// 用于将 instability 值转化为视觉放大效果和抖动效果
// 添加时间：2026-02-10
// ============================================================================

export const INSTABILITY_EFFECTS = {
  // instability 影响因子的最大值（用户选择：保守1.5倍）
  // 当 instability 达到 NORMALIZATION_BASE 时，效果放大到此倍数
  MAX_FACTOR: 1.5,

  // instability 归一化基准值（达到此值时 factor = MAX_FACTOR）
  // 假设 instability 正常范围是 0-100
  NORMALIZATION_BASE: 100,

  // 抖动效果的 instability 阈值（用户选择：中期60）
  // 只有当 instability 超过此值时才产生抖动效果
  JITTER_THRESHOLD: 60,

  // 抖动更新间隔（秒）
  // 每隔此时间更新一次抖动偏移，避免过于频繁导致闪烁
  JITTER_UPDATE_INTERVAL: 0.1,

  // 抖动强度系数
  JITTER_POSITION_X: 0.04,  // 水平位置抖动幅度
  JITTER_POSITION_Y: 0.02,  // 垂直位置抖动幅度
  JITTER_ROTATION: 0.02,    // 旋转角度抖动幅度（弧度）

  // 计算窗口大小（用户选择：顶部5层）
  // 使用顶部N层楼的平均 instability 来计算影响因子
  CALCULATION_WINDOW_SIZE: 5,
};
