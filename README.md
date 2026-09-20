# 积木平台资源仓库

存放 Skills（技能）、Agents（子代理）、MCPs（MCP 工具）、Teams（团队）的资源文件和注册表。

## 目录结构

```
skills/          # 技能目录，每个技能一个子文件夹（含 SKILL.md）
agents/          # 子代理目录，每个代理一个 .yaml 文件
mcps/            # MCP 工具目录，每个 MCP 一个 .json 文件
teams/           # 团队目录，每个团队一个 .yaml 文件
registry/        # 注册表（由构建脚本自动生成，不要手动编辑）
scripts/         # 构建和校验脚本
docs/            # 文档和模板
```

## 开发流程

### 新增 / 修改资源

1. 把文件放到对应目录：
   - 技能 → `skills/你的技能名/SKILL.md`
   - 子代理 → `agents/你的代理名.yaml`
   - MCP → `mcps/你的mcp名.json`
   - 团队 → `teams/你的团队名.yaml`

2. 构建注册表：

```bash
npm run build
```

脚本会自动：
- 发现新文件，加入注册表（版本 1.0.0）
- 检测已有文件的内容变更，自动递增版本号（1.0.0 → 1.0.1 → 1.0.2...）
- 移除已删除的文件
- 校验注册表完整性

3. 提交推送：

```bash
git add -A
git commit -m "你的提交说明"
git push
```

### 其他命令

| 命令 | 说明 |
|------|------|
| `npm run build` | 构建全部注册表 + 校验 |
| `npm run validate` | 仅校验注册表（不重新构建） |
| `npm run reset` | 强制重置所有版本号为 1.0.0 |

## 注意事项

- `registry/` 目录下的 JSON 文件由脚本自动生成，不要手动编辑
- 版本号由脚本根据文件内容变更自动管理，不需要手动修改
- 更新资源内容时，请保持文件名不变。脚本通过文件名追踪版本历史，改名会导致旧条目被移除、新条目从 1.0.0 重新开始，版本记录会断掉
- 构建前不需要安装依赖（无 node_modules），只需要 Node.js 环境

## 贡献

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。


## 🏢 关于我们

- 官网：[积木科技](https://jimu.chat)
- GitHub：[@JiMu-cn](https://github.com/JiMu-cn)
