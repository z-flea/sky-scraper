# 开发工作流程（Development Workflow）

## 快速参考

### 参数调整流程
```
发现问题 → 查阅文档 → 修改参数 → 测试验证 → 记录调整 → 提交代码
```

### 代码提交流程
```
修改代码 → 自查清单 → 测试功能 → 提交代码 → 推送远程
```

---

## 一、参数调整流程

### 1. 修改参数

在 `config/physics_params.js` 中修改：

```javascript
// ✅ 正确：添加修改记录注释
// PARAM: 阻尼系数（Damping）
// 修改：2026-02-09 从 2.5 → 0.08
// 原因：摆动衰减过快
// 参考：docs/parameter_history.md #2026-02-09-002
DAMPING: 0.08,
```

### 2. 测试验证

测试不同楼层数的表现：
- [ ] 低层建筑（1-20层）
- [ ] 中层建筑（20-50层）
- [ ] 高层建筑（50-100层）

### 3. 记录调整

在 `docs/parameter_history.md` 中添加记录（使用模板）。

### 4. 提交代码

```bash
git add config/physics_params.js docs/parameter_history.md
git commit
# 按照 .gitmessage 模板填写
```

---

## 二、代码审查流程

### 提交前自查

打开 `docs/code_review_checklist.md`，检查：

**必查项：**
- [ ] 代码符合命名规范
- [ ] 没有硬编码魔法数字
- [ ] 复杂逻辑有注释
- [ ] 手动测试通过
- [ ] 没有控制台错误

**物理参数修改专项：**
- [ ] 参数在 `config/physics_params.js` 中定义
- [ ] 在 `docs/parameter_history.md` 中记录
- [ ] 测试了多个楼层数场景

---

## 三、Git提交规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**常用Type：**
- `feat`: 新功能
- `fix`: Bug修复
- `param`: 参数调整
- `refactor`: 重构
- `docs`: 文档更新

**示例：**
```
param(physics): 调整建筑摆动阻尼系数

将阻尼系数从2.5降低到0.08，使摆动持续时间更长。

测试结果：
- 20层：摆动持续8秒
- 50层：摆动持续12秒

Param: docs/parameter_history.md #2026-02-09-002
```

---

## 四、文档更新规则

| 修改类型 | 需要更新的文档 |
|---------|---------------|
| 修改参数 | parameter_history.md, physics_params.js |
| 重大决策 | design_decisions.md |
| 新增功能 | CLAUDE.md |

---

## 五、问题排查流程

### 1. 收集信息
```bash
# 查看最近提交
git log --oneline -10

# 查看参数修改历史
git log --oneline --grep="param" -5
```

### 2. 对比设计
```bash
# 查看设计文档
open docs/design_decisions.md
open docs/parameter_history.md
```

### 3. 添加调试
```javascript
console.log('[DEBUG] 当前摆动角度:', this.towerSwayAngle);
console.log('[DEBUG] 重心偏移:', comOffset);
```

---

## 六、最佳实践

### ✅ 推荐
- 小步提交（每完成一个小功能）
- 参数集中管理（使用 config/physics_params.js）
- 记录重要决策（使用 design_decisions.md）
- 充分测试（多个楼层数场景）

### ❌ 避免
- 硬编码参数（直接在代码中写数字）
- 跳过文档（不记录参数调整）
- 批量提交（积累大量修改）
- 盲目调参（没有理论依据）

---

## 七、快速命令

```bash
# 配置Git提交模板
git config commit.template .gitmessage

# 查看当前参数
cat config/physics_params.js | grep "PARAM:"

# 查看参数历史
open docs/parameter_history.md

# 提交参数调整
git add config/physics_params.js docs/parameter_history.md
git commit
```

---

**文档版本：** 1.0
**最后更新：** 2026-02-09
