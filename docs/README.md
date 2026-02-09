# 代码审查与参数管理系统

## 系统概述

本系统提供了一套完整的代码审查和参数迭代管理方案，包括：

1. **代码审查清单** - 提交前的自查标准
2. **参数历史记录** - 系统化的参数调整追踪
3. **集中参数配置** - 避免硬编码魔法数字
4. **设计决策记录** - 重要技术决策的文档化
5. **Git提交规范** - 统一的提交信息格式
6. **工作流程指南** - 日常开发的标准流程

---

## 文件结构

```
game3/
├── docs/
│   ├── code_review_checklist.md    # 代码审查清单
│   ├── parameter_history.md        # 参数调整历史
│   ├── design_decisions.md         # 设计决策记录
│   ├── workflow.md                 # 工作流程指南
│   └── README.md                   # 本文件
├── config/
│   └── physics_params.js           # 集中的物理参数配置
└── .gitmessage                     # Git提交信息模板
```

---

## 快速开始

### 1. 配置Git提交模板

```bash
git config commit.template .gitmessage
```

### 2. 参数调整流程

```
修改参数 → 测试验证 → 记录历史 → 提交代码
```

### 3. 代码提交流程

```
修改代码 → 查看清单 → 测试功能 → 提交代码
```

---

## 核心原则

### 1. 参数集中管理

**✅ 正确做法：**
```javascript
import { TOWER_SWAY } from '../config/physics_params.js';
const damping = TOWER_SWAY.DAMPING;
```

### 2. 修改必须记录

每次修改参数后，必须在 `parameter_history.md` 中记录。

### 3. 重要决策文档化

重大技术决策记录在 `design_decisions.md` 中。

---

## 使用场景

### 调整物理参数

```bash
# 1. 修改参数
vim config/physics_params.js

# 2. 测试验证
npm start

# 3. 记录调整
vim docs/parameter_history.md

# 4. 提交代码
git add config/physics_params.js docs/parameter_history.md
git commit
```

---

## 相关文档

- [代码审查清单](code_review_checklist.md)
- [参数历史记录](parameter_history.md)
- [设计决策记录](design_decisions.md)
- [工作流程指南](workflow.md)

---

**系统版本：** 1.0  
**创建日期：** 2026-02-09
