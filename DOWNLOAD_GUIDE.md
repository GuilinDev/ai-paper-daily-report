# 📥 如何下载 Bolt 项目代码到本地

由于 Bolt 没有直接的下载按钮，这里提供几种有效的方法来获取所有代码：

## 🚀 方法1：使用项目生成脚本（推荐）

1. **运行生成脚本**：
   ```bash
   node download-project.js
   ```

2. **手动复制文件**：
   按照生成的 `SETUP_INSTRUCTIONS.md` 文件，从 Bolt 中复制所有源代码文件

## 📋 方法2：手动创建文件

### 第1步：创建项目结构
```bash
mkdir ai-research-daily
cd ai-research-daily

# 创建目录结构
mkdir -p src/{components,services,lib,types,pages/api}
mkdir -p .github/workflows
mkdir -p supabase/{functions/{send-email,test-email,arxiv-proxy},migrations}
```

### 第2步：复制文件内容

从 Bolt 项目中复制以下文件的内容：

#### 🔧 配置文件
- `package.json`
- `vite.config.ts`
- `tailwind.config.js`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `postcss.config.js`
- `index.html`
- `.env.example`

#### 💻 源代码文件
- `src/main.tsx`
- `src/index.css`
- `src/App.tsx`
- `src/vite-env.d.ts`
- `src/components/HomePage.tsx`
- `src/components/AdminLogin.tsx`
- `src/components/AdminPanel.tsx`
- `src/services/arxiv.ts`
- `src/services/email.ts`
- `src/services/gemini.ts`
- `src/lib/supabase.ts`
- `src/types/index.ts`
- `src/pages/api/daily-task.ts`

#### 🔄 Supabase Edge Functions
- `supabase/functions/send-email/index.ts`
- `supabase/functions/test-email/index.ts`
- `supabase/functions/arxiv-proxy/index.ts`

#### 🗄️ 数据库迁移文件
- `supabase/migrations/20250805191809_steep_rain.sql`
- `supabase/migrations/20250805221013_royal_portal.sql`
- `supabase/migrations/20250805221249_solitary_brook.sql`
- `supabase/migrations/20250805222453_plain_boat.sql`
- `supabase/migrations/20250806003918_old_wildflower.sql`

#### ⚙️ GitHub Actions
- `.github/workflows/daily-report.yml`

#### 📚 文档文件
- `README.md`
- `DEPLOYMENT_GUIDE.md`
- `CRON_ALTERNATIVES.md`
- `setup-github.md`

## 🎯 方法3：使用浏览器开发者工具

1. **打开开发者工具**：按 F12
2. **查看源代码**：在 Sources 或 Network 标签中查看文件
3. **复制内容**：逐个复制文件内容到本地

## ✅ 验证下载完整性

下载完成后，确保你有：

```
ai-research-daily/
├── package.json
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── .env.example
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   ├── services/
│   ├── lib/
│   └── types/
├── supabase/
│   ├── functions/
│   └── migrations/
├── .github/
│   └── workflows/
└── 文档文件
```

## 🚀 下载后的步骤

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **配置环境变量**：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件
   ```

3. **启动开发服务器**：
   ```bash
   npm run dev
   ```

4. **推送到 GitHub**：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

## 💡 小贴士

- 使用代码编辑器的多文件搜索功能可以快速定位文件
- 可以先创建主要文件，然后逐步添加其他文件
- 确保文件路径和名称完全正确

需要帮助的话，随时问我！🤝
