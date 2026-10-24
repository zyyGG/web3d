---
name: no-auto-build-test
description: 'Run build, dev server, or tests only after explicit user approval. Use when about to run npm run dev / npm run build / vite / vitest / playwright, when verifying a change, or when tempted to "just check that it works" in this project.'
---

# 不自动构建 / 启服务 / 跑测试

本仓库的硬规则：**构建、开发服务器、测试命令只能由用户明确要求后运行**。本技能把这条规则落成可执行的自检流程。

## 触发时机

出现以下任一念头时，先停下来读本文件：

- "改完了，跑一下 `npm run dev` 看看"
- "跑个 `npm run build` 验证一下没写错"
- "启动 dev server 截个图确认效果"
- "跑一下测试 / lint / 类型检查确认没破坏东西"
- 想用 Playwright / 浏览器工具打开本地服务做验证

## 硬性规则

| 判定 | 命令 |
| --- | --- |
| ❌ 禁止自动执行 | `npm run dev`、`npm run build`、`npm run preview` |
| ❌ 禁止自动执行 | `npx vite`、`npx vite build`、`npx vite preview`、`vite --host` |
| ❌ 禁止自动执行 | `npm test`、`vitest`、`jest`、`playwright test`、`node --test`、任何 `test:*` 脚本 |
| ❌ 禁止自动执行 | 任何 `--watch` / 长驻进程 / 后台服务（包括以 `mode="async", detach: true` 启动的） |
| ✅ 随时允许 | 读文件、`grep` / `glob` / `view`、`git status` / `git diff` 等只读操作 |
| ✅ 随时允许 | `node --check <file>` 这类纯语法检查（不产出构建产物、不启服务） |
| ✅ 随时允许 | 在回答里给出建议命令，让用户自己执行 |

补充：

- 若仓库里出现 lint / 类型检查脚本，同样属于"验证类"命令，按同一规则先申请授权。

- "顺手验证一下"也算违规——判断标准是**有没有得到用户明确指令**，不是耗时长短。
- 子代理（subagent / `task` 工具）同样受限；不要让子代理替你跑这些命令。
- 用户问"能不能跑"、"为什么跑不起来"属于**咨询**，不是授权；此时只做静态分析并给出命令。

## 正确流程

1. **先静态检查**：读被改的文件、`node --check`（纯语法）、`git diff` 复核改动。
2. **需要运行时验证时**：用 ask_user（或直接提问）请求授权，必须包含：
   - 确切命令（可复制执行的那种）
   - 目的（想验证什么）
   - 预计耗时 / 是否需要长驻
3. **等待明确同意**。用户没有正面回答、只说"你看着办"以外的模糊话 → 视为未授权，继续静态工作。
4. **获批后只跑那一条命令**，不追加 build、不追加测试、不自行启动第二个进程。
5. 命令失败时**报告错误原文**，不要为了"让它过"而修改无关代码；修复前先说明计划并征求同意。

## 请求授权的话术模板

```text
要验证这次改动需要运行：npm run build
目的：确认 vite 能正常打包（会顺带检查 import 路径）
预计：约 20s，一次性命令，非常驻
是否执行？
```

## 本仓库命令清单（仅供回答中引用，不自动执行）

| 场景 | 命令 | 备注 |
| --- | --- | --- |
| 开发服务器 | `npm run dev` | 即 `vite --host`，长驻进程 |
| 生产构建 | `npm run build` | 默认 target 下会被 `src/main.js` 顶层 `await` 卡住 |
| 预览构建产物 | `npm run preview` | 需先有 build 产物 |
| 测试 | —— | `package.json` 中尚未定义 test 脚本 |

## 自检清单

在发出任何 shell 命令前问自己三句：

1. 这条命令会不会启动服务、打包、或跑测试？
2. 用户在这次对话里**明确要求**过吗（不是暗示、不是"顺便"）？
3. 如果没要求 —— 我是不是应该改成"给出命令 + 请求授权"？

第 3 条命中时，直接按话术模板提问，不要执行。
