# AIMistakeLib

一个基于 Next.js 和 Supabase 的 AI 错题管理应用。用户可以上传题目图片，通过阿里云视觉模型识别题目，并进行错因分析、复习统计和练习卷生成。

## 功能

- 阿里云 DashScope 图片识别与题目解析
- 邮箱、匿名用户及可选的微信/Apple 登录
- 私有图片存储和基于 RLS 的用户数据隔离
- 错因分析、举一反三、复习状态和学习统计
- 练习卷创建、保存与打印
- 异步识别任务、失败重试和任务历史

## 技术栈

- Next.js 15、React 19、TypeScript
- Supabase Auth、PostgreSQL、Storage
- Tailwind CSS、Radix UI、TanStack Query
- Alibaba DashScope；可选 DeepSeek 非 OCR 功能

## 快速开始

要求：Node.js 20.19+、npm、一个 Supabase 项目和一个阿里云 DashScope API Key。

```bash
git clone <your-fork-or-repository-url>
cd AIMistakeLib
npm ci
cp .env.example .env.local
```

编辑 `.env.local`，至少设置：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALIBABA_API_KEY=your-dashscope-key
APP_URL=http://localhost:4001
```

然后初始化数据库并启动：

```bash
npx supabase@latest login
npx supabase@latest link --project-ref <your-project-ref>
npx supabase@latest db push --dry-run
npx supabase@latest db push
npm run dev
```

访问 `http://localhost:4001`。生产环境推荐部署到 Railway，也支持使用 Docker 自托管。完整的 Supabase Auth、环境变量及部署步骤见 [部署指南](docs/DEPLOYMENT.md)。

## 环境变量

| 变量 | 必需 | 可公开 | 用途 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | 是 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是 | 是 | 受 RLS 保护的浏览器端 Key |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | 否 | 服务端管理操作，会绕过 RLS |
| `ALIBABA_API_KEY` | 是 | 否 | 图片识别 |
| `APP_URL` | 生产环境是 | 是 | 后台识别任务回调地址 |
| `CRON_SECRET` | 建议 | 否 | 维护任务 Bearer Token |
| `DEEPSEEK_API_KEY` | 否 | 否 | 错因分析和举一反三 |
| `WECHAT_APP_ID` / `WECHAT_APP_SECRET` | 否 | App ID 可公开，Secret 不可 | 微信登录 |

所有变量均在 `.env.example` 中列出。不要提交 `.env.local` 或生产密钥。

## 常用命令

```bash
npm run dev        # 本地开发，端口 4001
npm run lint       # ESLint
npm run typecheck  # TypeScript 严格检查
npm run build      # 生产构建
npm run start      # 启动生产构建
npm run check      # 依次执行 lint、typecheck、build
```

AI Provider 的真实调用不属于离线验收，可能产生费用。

## 项目结构

- `app/`：页面和 API 路由
- `components/`、`hooks/`：可复用 UI 和客户端逻辑
- `server/`：认证、限流及 AI Provider 等服务端代码
- `contracts/`：请求校验和共享类型
- `supabase/migrations/`：可从空项目重建数据库的有序迁移
- `docs/DEPLOYMENT.md`：本地与生产部署说明

更多边界约定见 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 参与贡献与支持

提交代码前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。一般使用问题见 [SUPPORT.md](SUPPORT.md)；安全问题请按 [SECURITY.md](SECURITY.md) 私下报告。

## 许可证

[MIT](LICENSE)
