# 部署指南

本文说明如何从全新克隆完成本地运行和生产部署。命令默认在项目根目录执行。

## 1. 前置条件

- Node.js 20.19 或更高版本
- npm
- Supabase 项目
- 阿里云 DashScope API Key
- 可选：Supabase CLI、Docker、DeepSeek API Key

仓库已经包含 `supabase/config.toml` 和完整迁移；不需要再次运行 `supabase init`。

## 2. 配置 Supabase

在 Supabase Dashboard 创建项目，并从 **Project Settings → API** 获取项目 URL、Anon Key 和 Service Role Key。Service Role Key 会绕过 RLS，只能配置在服务端环境变量中。

使用 CLI 应用仓库中的有序迁移：

```bash
npx supabase@latest login
npx supabase@latest link --project-ref <project-ref>
npx supabase@latest db push --dry-run
npx supabase@latest db push
```

`--dry-run` 应先成功，再执行实际迁移。不要对生产项目运行 `db reset --linked`。

在 **Authentication** 中：

1. 启用 Email Provider。
2. 如需游客体验，启用 Anonymous Sign-Ins。
3. 在 URL Configuration 中把 Site URL 设为 `APP_URL`，并添加需要的 Redirect URL。

迁移会创建私有 Storage Bucket `mistake-private-images`，无需手工创建公开 Bucket。

## 3. 配置环境变量

本地开发把 `.env.example` 复制为 `.env.local`；生产环境使用托管平台的 Secret/Environment Variables 页面。不要把生产值写入仓库。

| 变量 | 环境 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 构建时、运行时 | 可公开的 Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 构建时、运行时 | 可公开，但必须配合 RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | 运行时 | 高权限密钥，禁止使用 `NEXT_PUBLIC_` 前缀 |
| `ALIBABA_API_KEY` | 运行时 | DashScope 图片识别密钥 |
| `APP_URL` | 运行时 | 完整站点地址，如 `https://example.com` |
| `CRON_SECRET` | 运行时 | 维护接口密钥，可用 `openssl rand -hex 32` 生成 |
| `DEEPSEEK_API_KEY` | 运行时、可选 | 启用错因分析和举一反三 |

更换 `NEXT_PUBLIC_*` 后必须重新构建前端。

## 4. 本地运行

```bash
npm ci
cp .env.example .env.local
npm run dev
```

访问 `http://localhost:4001`。首次验收至少检查注册/游客登录、上传图片、阿里识别、题目列表、统计和练习卷。

## 5. 部署到 Railway（推荐）

本项目包含 `Dockerfile`，并有约 100 秒的模型请求和进程内后台任务，优先推荐使用 Railway 的持续运行服务。

1. 把仓库推送到 GitHub，在 Railway 选择 **New Project → Deploy from GitHub repo**。
2. Railway 会自动识别根目录的 `Dockerfile`。在服务的 **Variables** 页面配置第 3 节变量。
3. 在 **Settings → Networking** 生成公网域名，将 `APP_URL` 设为该 HTTPS 地址后重新部署。
4. 将 Healthcheck Path 设为 `/api/health`；应用会读取 Railway 自动注入的 `PORT`。
5. 部署完成后访问 `/api/health`，应返回 `status: ok`。

Railway 对无数据传输的 HTTP 请求允许最多 5 分钟，持续传输时最多 15 分钟。项目内阿里请求超时为 180 秒，因此约 100 秒的识别通常在限制内；仍应监控第三方接口波动和服务重启。

## 6. 使用 Docker 部署

`NEXT_PUBLIC_*` 会写入浏览器 Bundle，因此构建和运行阶段都应提供一致的值：

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -t ai-mistake-lib .

docker run --rm -p 3000:3000 --env-file .env.production ai-mistake-lib
```

`.env.production` 必须位于仓库外或保持被 Git 忽略。生产环境应在容器前配置 HTTPS 反向代理、请求大小限制和访问日志。

## 7. 定时维护

维护接口会标记超时识别任务并清理孤立图片。用支持 POST 和自定义 Header 的调度器定期调用：

```bash
APP_URL=https://example.com CRON_SECRET=<secret> node scripts/run-maintenance.mjs
```

建议每小时运行一次。切勿把 `CRON_SECRET` 放入 URL。

在 Railway 中可从同一仓库新建 Cron Service，将 Start Command 设为 `node scripts/run-maintenance.mjs`，配置 `APP_URL` 和 `CRON_SECRET`，并使用 UTC Cron 表达式（例如 `0 * * * *`）。

## 8. 发布验收

```bash
npm ci
npm run check
npx supabase@latest db push --dry-run
```

部署后检查：

- `/api/health` 返回 200。
- 未登录用户不能读取其他用户的数据。
- 图片存储 Bucket 保持私有。
- 浏览器 Bundle 中不存在 Service Role 或 Provider 密钥。
- 阿里识别和失败重试正常。
- 维护任务携带错误密钥时返回 401。

## 9. 升级

```bash
git pull --ff-only
npm ci
npx supabase@latest db push --dry-run
npx supabase@latest db push
npm run check
```

先在独立的开发或预发布 Supabase 项目验证迁移。数据库迁移通常不可通过回退 Git 自动撤销，生产操作前应创建备份。

## 官方参考

- [GitHub 社区健康文件](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions)
- [Next.js 自托管指南](https://nextjs.org/docs/app/guides/self-hosting)
- [Supabase 本地开发工作流](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase 数据库迁移](https://supabase.com/docs/guides/deployment/database-migrations)
- [Railway Dockerfile 部署](https://docs.railway.com/builds/dockerfiles)
- [Railway 公网请求限制](https://docs.railway.com/networking/public-networking/specs-and-limits)
- [Railway 定时任务](https://docs.railway.com/cron-jobs)
