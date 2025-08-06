# GitHub 设置指南

## 🚀 快速推送到 GitHub

### 方法1：使用脚本（推荐）

1. **创建 GitHub 仓库**：
   - 访问 https://github.com/new
   - 仓库名：`ai-research-daily`
   - 设置为 Public
   - 不要初始化 README

2. **运行推送脚本**：
   ```bash
   chmod +x push-to-github.sh
   ./push-to-github.sh 你的用户名 ai-research-daily
   ```

### 方法2：手动推送

```bash
# 初始化仓库
git init

# 添加文件
git add .

# 提交
git commit -m "Initial commit: AI Research Daily System"

# 连接GitHub
git remote add origin https://github.com/你的用户名/ai-research-daily.git

# 推送
git branch -M main
git push -u origin main
```

## 🔑 设置 GitHub Secrets

推送完成后，在 GitHub 仓库中：

1. **进入设置**：`Settings` > `Secrets and variables` > `Actions`

2. **添加 Secrets**：
   
   **Secret 1:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: 你的 Supabase Service Role Key
   
   **Secret 2:**
   - Name: `SITE_URL`
   - Value: `https://superb-pithivier-9cb2c0.netlify.app`

## 📍 获取 Supabase Service Role Key

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. `Settings` > `API`
4. 复制 `service_role` key（不是 `anon` key）

## ✅ 验证设置

1. 推送完成后，查看 GitHub 仓库的 `Actions` 标签
2. 应该能看到 "Daily AI Research Report" 工作流
3. 点击 `Run workflow` 手动测试一次

## 🕘 定时执行

设置完成后，系统将：
- ⏰ 每天北京时间上午9点自动执行
- 📧 自动发送AI研究日报
- 📊 无需人工干预

## 🔧 自定义时间

如需修改执行时间，编辑 `.github/workflows/daily-report.yml`：

```yaml
schedule:
  - cron: '0 1 * * *'  # UTC时间，对应北京时间上午9点
```

时间对照表：
- `0 0 * * *` → 北京时间上午8点
- `0 2 * * *` → 北京时间上午10点  
- `0 12 * * *` → 北京时间晚上8点
