# 定时任务替代方案

如果不想使用GitHub Actions，这里有其他定时执行方案：

## 方案1：使用 Zapier（推荐）

1. 注册 [Zapier](https://zapier.com) 账户
2. 创建新的 Zap：
   - **触发器**: Schedule by Zapier（每天特定时间）
   - **动作**: Webhooks by Zapier
   - **URL**: `https://superb-pithivier-9cb2c0.netlify.app/api/daily-task`
   - **方法**: POST
   - **Headers**: 
     ```
     Authorization: Bearer 你的SUPABASE_SERVICE_ROLE_KEY
     Content-Type: application/json
     ```

## 方案2：使用 IFTTT

1. 注册 [IFTTT](https://ifttt.com) 账户
2. 创建新的 Applet：
   - **If**: Date & Time（每天特定时间）
   - **Then**: Webhooks（发送HTTP请求）

## 方案3：使用 Cron-job.org

1. 访问 [Cron-job.org](https://cron-job.org)
2. 注册免费账户
3. 创建新的 Cron Job：
   - **URL**: `https://superb-pithivier-9cb2c0.netlify.app/api/daily-task`
   - **时间**: 每天上午9点
   - **方法**: POST
   - **Headers**: 添加授权头

## 方案4：本地定时任务

如果你有一台常开的电脑：

### Windows (任务计划程序)
```batch
# 创建批处理文件 daily-report.bat
curl -X POST ^
  -H "Authorization: Bearer 你的SERVICE_ROLE_KEY" ^
  -H "Content-Type: application/json" ^
  "https://superb-pithivier-9cb2c0.netlify.app/api/daily-task"
```

### macOS/Linux (crontab)
```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天上午9点）
0 9 * * * curl -X POST \
  -H "Authorization: Bearer 你的SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  "https://superb-pithivier-9cb2c0.netlify.app/api/daily-task"
```

## 推荐顺序

1. **GitHub Actions** - 最稳定，完全免费
2. **Zapier** - 简单易用，有免费额度
3. **Cron-job.org** - 专业的定时服务
4. **本地定时任务** - 需要设备常开

选择最适合你的方案即可！
