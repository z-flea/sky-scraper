# Git 分支开发完整流程（命令行版）

## 场景：开发一个新功能（音效系统）

### 1. 创建并切换到新分支

```bash
# 方法一：分两步
git branch feature-audio-system      # 创建分支
git checkout feature-audio-system    # 切换到分支

# 方法二：一步完成（推荐）
git checkout -b feature-audio-system
```

### 2. 查看当前分支

```bash
git branch
# 输出：
#   master
# * feature-audio-system    ← 星号表示当前分支
```

### 3. 在新分支上开发

正常写代码，然后提交：

```bash
# 第一次提交
git add src/assets/audio_manager.js
git commit -m "添加音效管理器"
git push -u origin feature-audio-system    # 第一次推送需要 -u

# 第二次提交
git add src/assets/audio_player.js
git commit -m "添加音效播放功能"
git push    # 之后直接 push 就行

# 第三次提交
git add tests/audio_test.js
git commit -m "完成音效系统测试"
git push
```

### 4. 切换回主分支

```bash
git checkout master
```

### 5. 合并功能分支

```bash
git merge feature-audio-system
```

### 6. 推送到 GitHub

```bash
git push
```

### 7. 删除本地分支（可选）

```bash
git branch -d feature-audio-system
```

### 8. 删除远程分支（可选）

```bash
git push origin --delete feature-audio-system
```

---

## 常用分支命令

### 查看分支

```bash
git branch              # 查看本地分支
git branch -a           # 查看所有分支（包括远程）
git branch -v           # 查看分支及最后一次提交
```

### 创建分支

```bash
git branch 分支名                    # 只创建，不切换
git checkout -b 分支名               # 创建并切换（推荐）
git switch -c 分支名                 # 新版 Git 的方式
```

### 切换分支

```bash
git checkout 分支名                  # 传统方式
git switch 分支名                    # 新版 Git 的方式（推荐）
```

### 合并分支

```bash
git checkout master                  # 先切换到目标分支
git merge 功能分支名                 # 合并功能分支
```

### 删除分支

```bash
git branch -d 分支名                 # 删除已合并的分支
git branch -D 分支名                 # 强制删除（未合并也删除）
```

### 查看分支差异

```bash
git diff master..feature-audio       # 查看两个分支的差异
```

---

## 分支命名规范

### 功能分支
```
feature-音效系统
feature-连击系统
feature-phase-progression
```

### 修复分支
```
fix-crane-swing-bug
fix-collision-detection
fix-memory-leak
```

### 实验分支
```
experiment-new-physics
experiment-webgl-renderer
```

### 重构分支
```
refactor-game-loop
refactor-ui-components
```

---

## 常见场景

### 场景 1：在分支上开发时，发现主分支有更新

```bash
# 在功能分支上
git checkout master
git pull                             # 拉取主分支最新代码
git checkout feature-audio-system
git merge master                     # 将主分支的更新合并到功能分支
# 或者使用 rebase（更干净）
git rebase master
```

### 场景 2：开发到一半，需要紧急修复主分支的 bug

```bash
# 当前在 feature-audio-system 分支
git stash                            # 暂存当前修改
git checkout master                  # 切换到主分支
git checkout -b fix-urgent-bug       # 创建修复分支
# 修复 bug
git add .
git commit -m "修复紧急 bug"
git checkout master
git merge fix-urgent-bug
git push
git checkout feature-audio-system    # 切回功能分支
git stash pop                        # 恢复之前的修改
```

### 场景 3：想放弃分支上的所有修改

```bash
git checkout master                  # 切回主分支
git branch -D feature-audio-system   # 强制删除功能分支
```

### 场景 4：查看分支历史

```bash
git log --oneline --graph --all      # 图形化显示所有分支的提交历史
```

---

## 分支工作流程图

```
master:     A---B---C---D---E---F---G
                 \           /
feature:          X---Y---Z
```

说明：
- A, B, C... 是主分支的提交
- 在 B 点创建了 feature 分支
- X, Y, Z 是功能分支的提交
- 在 F 点将功能分支合并回主分支

---

## 提示

1. **分支名要有意义**：一看就知道这个分支是做什么的
2. **经常提交**：在分支上也要经常提交，不要攒太多
3. **及时合并**：功能开发完就合并，不要拖太久
4. **删除已合并的分支**：保持分支列表整洁
5. **推送分支到 GitHub**：方便备份和协作
