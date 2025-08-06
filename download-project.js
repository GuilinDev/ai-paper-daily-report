#!/usr/bin/env node

/**
 * AI研究日报系统 - 项目文件下载脚本
 * 运行此脚本将创建包含所有项目文件的压缩包
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始创建项目文件列表...\n');

// 项目文件结构
const projectFiles = {
  // 根目录文件
  'package.json': `{
  "name": "ai-research-daily",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.53.0",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.7.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@types/react-router-dom": "^5.3.3",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2"
  }
}`,

  'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI论文日报系统</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,

  '.env.example': `# Supabase配置
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 注意：实际的.env文件不会被提交到git
# 请复制此文件为.env并填入真实的配置值`,

  '.gitignore': `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env
.env.local
.env.production

# Supabase
.branches
.temp
.import
.migration_file_id`,

  'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});`,

  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`,

  'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,

  'tsconfig.json': `{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}`,

  'tsconfig.app.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}`,

  'tsconfig.node.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}`
};

// 创建文件夹结构
const createDirectories = () => {
  const dirs = [
    'src',
    'src/components',
    'src/services',
    'src/lib',
    'src/types',
    'src/pages/api',
    '.github/workflows',
    'supabase/functions/send-email',
    'supabase/functions/test-email',
    'supabase/functions/arxiv-proxy',
    'supabase/migrations'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 创建目录: ${dir}`);
    }
  });
};

// 写入文件
const writeFiles = () => {
  Object.entries(projectFiles).forEach(([filename, content]) => {
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`📄 创建文件: ${filename}`);
  });
};

// 创建说明文件
const createInstructions = () => {
  const instructions = `# AI研究日报系统 - 本地部署指南

## 📋 快速开始

### 1. 安装依赖
\`\`\`bash
npm install
\`\`\`

### 2. 配置环境变量
\`\`\`bash
cp .env.example .env
# 编辑 .env 文件，填入你的 Supabase 配置
\`\`\`

### 3. 启动开发服务器
\`\`\`bash
npm run dev
\`\`\`

## 🔧 完整文件列表

你需要从 Bolt 项目中复制以下文件：

### 源代码文件 (src/)
- src/main.tsx
- src/index.css
- src/App.tsx
- src/vite-env.d.ts
- src/components/HomePage.tsx
- src/components/AdminLogin.tsx
- src/components/AdminPanel.tsx
- src/services/arxiv.ts
- src/services/email.ts
- src/services/gemini.ts
- src/lib/supabase.ts
- src/types/index.ts
- src/pages/api/daily-task.ts

### Supabase Edge Functions
- supabase/functions/send-email/index.ts
- supabase/functions/test-email/index.ts
- supabase/functions/arxiv-proxy/index.ts

### GitHub Actions
- .github/workflows/daily-report.yml

### 数据库迁移文件
- supabase/migrations/20250805191809_steep_rain.sql
- supabase/migrations/20250805221013_royal_portal.sql
- supabase/migrations/20250805221249_solitary_brook.sql
- supabase/migrations/20250805222453_plain_boat.sql
- supabase/migrations/20250806003918_old_wildflower.sql

### 文档文件
- README.md
- DEPLOYMENT_GUIDE.md
- CRON_ALTERNATIVES.md
- setup-github.md

## 🚀 部署到 GitHub

1. 创建 GitHub 仓库
2. 推送代码到仓库
3. 设置 GitHub Secrets
4. 连接 Netlify 到 GitHub 仓库

详细步骤请参考 README.md 文件。

## 📞 需要帮助？

如果遇到问题，请检查：
1. 环境变量是否正确配置
2. Supabase 数据库是否已创建
3. Edge Functions 是否已部署

祝你使用愉快！🎉
`;

  fs.writeFileSync('SETUP_INSTRUCTIONS.md', instructions, 'utf8');
  console.log('📄 创建文件: SETUP_INSTRUCTIONS.md');
};

// 主函数
const main = () => {
  console.log('🎯 AI研究日报系统 - 项目文件生成器\n');
  
  createDirectories();
  writeFiles();
  createInstructions();
  
  console.log('\n✅ 基础文件结构创建完成！');
  console.log('\n📋 接下来你需要：');
  console.log('1. 从 Bolt 项目中复制 src/ 目录下的所有文件');
  console.log('2. 复制 supabase/ 目录下的所有文件');
  console.log('3. 复制其他配置和文档文件');
  console.log('4. 运行 npm install 安装依赖');
  console.log('5. 配置 .env 文件');
  console.log('\n详细说明请查看 SETUP_INSTRUCTIONS.md 文件');
};

// 运行脚本
main();
