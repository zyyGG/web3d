# Project Guidelines

## Build / Dev Server / Tests — 必须先获得同意

不要主动运行构建、开发服务器或测试命令。只有用户在**当前对话中明确要求**时才运行。

以下命令一律禁止自动执行：

- `npm run dev`、`npm run build`、`npm run preview`
- `npx vite`、`npx vite build`、`npx vite preview`、`vite --host`
- 任何测试运行器：`npm test`、`vitest`、`jest`、`playwright`、`node --test` 及同类的 `test:*` 脚本
- 任何 watch / 长驻进程（`--watch`、`--host`、dev server）

任何时候都允许：

- 读文件、`grep` / `glob` / `view` 等只读工具
- `node --check <file>` 这类纯语法检查
- 在回答里**告诉用户**该运行什么命令，由用户自己执行
- 通过阅读代码做静态推断

需要验证时，先问（给出确切命令、目的、预计耗时），等待用户同意；同意后只运行被批准的那一条命令，不要顺带跑别的。完整流程见 [.github/skills/no-auto-build-test/SKILL.md](./skills/no-auto-build-test/SKILL.md)。

补充事实：

- 本仓库 `package.json` 目前**没有** test 脚本。
- `npm run build` 当前会因 `src/main.js` 的顶层 `await` 在默认 target 下报 `Top-level await is not available`；这是既有问题，未经要求不要去修、也不要去跑。
