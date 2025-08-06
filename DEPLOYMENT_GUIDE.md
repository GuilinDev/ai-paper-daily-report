# Supabase Edge Functions 部署指南

## 📋 部署步骤

### 1. 安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (使用 Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 或者使用 npm
npm install -g supabase
```

### 2. 登录 Supabase

```bash
supabase login
```

### 3. 链接到你的项目

```bash
# 替换为你的项目引用ID
supabase link --project-ref YOUR_PROJECT_REF
```

你可以在 Supabase Dashboard 的 Settings > General 中找到 Project Reference ID。

### 4. 部署 Edge Functions

```bash
# 部署所有函数
supabase functions deploy

# 或者单独部署每个函数
supabase functions deploy send-email
supabase functions deploy test-email  
supabase functions deploy arxiv-proxy
```

### 5. 验证部署

部署成功后，你可以在 Supabase Dashboard 的 Edge Functions 页面看到这些函数：

- `send-email` - 邮件发送服务
- `test-email` - 连接测试服务  
- `arxiv-proxy` - arXiv API 代理服务

## 🔧 函数说明

### send-email
- **用途**: 发送每日AI研究报告邮件
- **支持**: Resend 和 SendGrid 邮件服务
- **参数**: apiKey, fromEmail, service, subscribers, subject, content

### test-email  
- **用途**: 测试 Edge Function 连接和 CORS 配置
- **返回**: 详细的环境和请求信息

### arxiv-proxy
- **用途**: 代理 arXiv API 请求，解决 CORS 问题
- **参数**: searchQuery (arXiv 查询字符串)

## 🚨 常见问题

### 1. 权限错误
确保你有项目的 Owner 或 Admin 权限。

### 2. 项目链接失败
检查 Project Reference ID 是否正确。

### 3. 函数部署失败
检查函数代码语法和依赖项。

### 4. CORS 问题
所有函数都已配置 CORS 头，支持跨域请求。

## 🧪 测试部署

部署完成后，你可以在应用中测试：

1. 访问管理后台
2. 执行每日任务
3. 查看控制台日志确认函数调用成功

## 📞 获取帮助

如果遇到问题，可以：
1. 查看 Supabase Dashboard 中的函数日志
2. 检查浏览器控制台的网络请求
3. 确认 API 密钥配置正确

## 🔑 环境变量

Edge Functions 会自动获取以下环境变量：
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`

无需手动配置这些变量。
