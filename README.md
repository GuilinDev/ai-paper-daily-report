# AI研究日报系统

基于arXiv最新论文，由AI智能分析筛选，为研究者提供每日精准的前沿动态和研究建议。

## 功能特点

- 🤖 **AI智能筛选**: 使用Gemini AI分析论文标题和摘要，智能识别AI相关研究
- 📊 **趋势洞察**: 提供研究趋势分析和未来方向建议  
- 📧 **每日推送**: 定时推送精选摘要到订阅者邮箱
- 🔧 **管理后台**: 完整的配置和管理界面

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Supabase (PostgreSQL + 认证 + Edge Functions)
- **AI服务**: Google Gemini API
- **邮件服务**: Resend / SendGrid
- **数据源**: arXiv API
- **部署**: Netlify

## 快速开始

### 1. 环境配置

```bash
# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env
```

### 2. Supabase配置

请按照以下SQL创建数据库表结构：

\`\`\`sql
-- 论文表
CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  abstract TEXT NOT NULL,
  arxiv_id TEXT UNIQUE NOT NULL,
  arxiv_url TEXT NOT NULL,
  published_date TIMESTAMPTZ NOT NULL,
  ai_relevance_score INTEGER NOT NULL CHECK (ai_relevance_score >= 1 AND ai_relevance_score <= 10),
  importance_level TEXT NOT NULL CHECK (importance_level IN ('High', 'Medium', 'Low'
