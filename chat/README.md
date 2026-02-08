# Chat 目录

> 存放与 AI 交互的提示词、对话记录和技术决策

## 目录用途

本目录用于存储项目开发过程中与 AI 的所有交互记录，包括：

1. **提示词模板**：可复用的结构化提示词
2. **对话记录**：与 AI 的完整对话导出
3. **技术决策**：通过 AI 对话做出的重要技术决策

## 目录结构

```
chat/
├── prompts/              # 提示词模板
│   ├── feature-*.md      # 功能开发提示词
│   ├── debug-*.md        # 调试问题提示词
│   ├── refactor-*.md     # 重构代码提示词
│   ├── optimize-*.md     # 性能优化提示词
│   ├── test-*.md         # 测试相关提示词
│   └── docs-*.md         # 文档编写提示词
├── conversations/        # 对话记录
│   ├── YYYYMMDD-*.md     # 按日期命名的对话
│   └── archived/         # 归档的旧对话
├── decisions/            # 技术决策记录
│   └── *.md              # 重要决策文档
└── README.md             # 本文件
```

## 文件命名规范

### 提示词文件
```
prompts/[类型]-[功能]-[日期].md

示例：
- prompts/feature-user-auth-20260203.md
- prompts/debug-api-error-20260203.md
- prompts/refactor-database-20260203.md
```

### 对话记录文件
```
conversations/YYYYMMDD-[主题].md

示例：
- conversations/20260203-implement-login.md
- conversations/20260203-fix-performance-issue.md
- conversations/20260203-design-database-schema.md
```

### 技术决策文件
```
decisions/[决策主题]-[日期].md

示例：
- decisions/choose-auth-library-20260203.md
- decisions/database-migration-strategy-20260203.md
```

## 使用建议

### 1. 及时记录

- ✅ **立即记录**：对话结束后立即保存记录
- ✅ **完整导出**：使用 Claude Code 的导出功能保存完整对话
- ✅ **标注重点**：在对话中标注关键决策和重要代码

### 2. 定期整理

- 📅 **每周整理**：将零散的对话归档到对应目录
- 📅 **每月回顾**：回顾重要决策，更新文档
- 📅 **季度清理**：归档过时的对话记录到 archived/ 目录

### 3. 知识沉淀

- 📝 **提取模式**：从对话中提取可复用的提示词模板
- 📝 **总结经验**：将成功的对话模式文档化
- 📝 **更新技能**：将常用提示词转化为 Claude Code 技能

### 4. 团队协作

- 👥 **分享提示词**：将有效的提示词分享给团队
- 👥 **记录决策**：重要技术决策要有完整的对话记录
- 👥 **知识传承**：新成员可以通过对话记录快速了解项目

## 导出对话的方法

### Claude Code

1. 在对话窗口中，点击右上角的菜单
2. 选择 "Export Conversation"
3. 保存为 Markdown 格式
4. 移动到 `chat/conversations/` 目录

### Claude Web

1. 点击对话右上角的 "..." 菜单
2. 选择 "Export"
3. 选择 Markdown 格式
4. 保存到 `chat/conversations/` 目录

### 使用技能命令

当您想要保存对话记录时，可以使用：
- `/save-conversation` - 保存当前对话
- `/extract-prompt` - 从对话中提取提示词
- `/record-decision` - 记录技术决策

## 注意事项

### ⚠️ 隐私和安全

- ❌ **不要提交敏感信息**：API密钥、密码、个人信息
- ❌ **不要提交商业机密**：未公开的商业计划、客户数据
- ✅ **脱敏处理**：对话中的敏感信息要脱敏后再保存
- ✅ **检查 .gitignore**：确保敏感对话不会被提交到版本控制

### 📋 版本控制建议

项目的 `.gitignore` 已包含以下规则：

```gitignore
# 排除包含敏感信息的对话
chat/conversations/*-sensitive.md
chat/conversations/*-private.md

# 排除临时对话草稿
chat/conversations/draft-*.md
chat/conversations/temp-*.md
```

### 🔍 搜索和检索

- 使用清晰的文件名，便于搜索
- 在对话记录中添加标签：`#feature` `#bug` `#refactor`
- 使用 `grep` 或编辑器的全局搜索功能查找历史对话

## 最佳实践

### ✅ 推荐做法

1. **每次重要对话都导出保存**
2. **使用清晰的文件命名**
3. **在对话中添加上下文链接**
4. **定期回顾和整理对话**
5. **将成功的提示词模板化**
6. **重要决策单独记录**

### ❌ 避免做法

1. ❌ 不保存对话记录（丢失宝贵经验）
2. ❌ 文件命名混乱（难以检索）
3. ❌ 提交敏感信息（安全风险）
4. ❌ 从不整理归档（目录混乱）
5. ❌ 对话缺少上下文（难以理解）
