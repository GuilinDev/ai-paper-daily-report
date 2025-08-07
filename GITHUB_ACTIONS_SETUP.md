# GitHub Actions 定时任务配置指南

## 问题修复说明

之前的GitHub Actions定时任务失败是因为Netlify Function无法在服务器端正确执行。现在已经完全重写了 `netlify/functions/daily-task.js`，使其能够独立运行所有任务逻辑。

## 配置步骤

### 1. 配置Netlify环境变量

在Netlify Dashboard中设置以下环境变量：

1. 登录 [Netlify Dashboard](https://app.netlify.com)
2. 选择您的站点
3. 进入 `Site settings` → `Environment variables`
4. 添加以下变量：

```bash
# Supabase配置（必需）
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 或者使用VITE前缀（如果您的项目使用Vite）
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**重要**：`SUPABASE_SERVICE_ROLE_KEY` 是服务端密钥，不同于 `ANON_KEY`。您可以在 Supabase Dashboard → Settings → API 中找到它。

### 2. 配置GitHub Secrets

在GitHub仓库中配置以下Secrets：

1. 进入您的GitHub仓库
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 添加以下Secret：

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

可选（如果您的Netlify URL不同）：
```bash
NETLIFY_FUNCTION_URL=https://your-site.netlify.app/.netlify/functions/daily-task
```

### 3. 部署到Netlify

确保代码已经推送并部署到Netlify：

```bash
git add .
git commit -m "Fix Netlify Function for GitHub Actions"
git push
```

等待Netlify自动部署完成。

### 4. 测试Function

#### 方法1：通过curl测试
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://your-site.netlify.app/.netlify/functions/daily-task
```

#### 方法2：通过GitHub Actions手动触发
1. 进入 GitHub → Actions
2. 选择 "Daily AI Research Report"
3. 点击 "Run workflow"

### 5. 验证定时任务

定时任务设置为每天北京时间上午9点（UTC时间凌晨1点）自动执行。

## 故障排查

### 如果仍然收到404错误

1. **检查Netlify Function是否部署成功**
   - 在Netlify Dashboard → Functions 页面查看是否有 `daily-task` 函数
   - 查看函数日志是否有错误

2. **检查环境变量**
   - 确保所有必需的环境变量都已在Netlify中配置
   - 环境变量名称要完全匹配

3. **检查URL是否正确**
   - 确认您的Netlify站点URL
   - URL格式应为：`https://[your-site-name].netlify.app/.netlify/functions/daily-task`

### 如果收到500错误

1. **查看Netlify Function日志**
   - Netlify Dashboard → Functions → daily-task → View logs

2. **常见原因**：
   - Supabase配置错误
   - Gemini API key未在数据库中配置
   - 邮件服务配置问题

### 如果任务执行但没有收到邮件

1. **检查管理面板配置**
   - 登录 `/admin` 页面
   - 确保已配置：
     - Gemini API Key
     - Email API Key
     - From Email
     - Email Service (resend/sendgrid/mailjet)

2. **检查订阅者列表**
   - 确保有激活的订阅者

## 功能说明

新的Netlify Function实现了完整的任务流程：

1. ✅ 从arXiv获取最近7天的AI相关论文
2. ✅ 使用Gemini AI分析论文相关性和重要性
3. ✅ 将分析结果存储到Supabase数据库
4. ✅ 生成中文日报内容
5. ✅ 通过配置的邮件服务发送给订阅者

所有逻辑都在服务端执行，不依赖浏览器环境，确保GitHub Actions可以正常调用。

## 监控和日志

- **GitHub Actions日志**：查看每次执行的详细输出
- **Netlify Functions日志**：实时查看函数执行情况
- **Supabase Dashboard**：查看数据库中的论文和报告记录

## 联系支持

如果遇到其他问题，请检查：
1. Netlify Functions 日志
2. GitHub Actions 运行历史
3. Supabase 数据库日志