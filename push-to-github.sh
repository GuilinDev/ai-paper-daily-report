#!/bin/bash

# GitHub推送脚本
# 使用方法：./push-to-github.sh your-username your-repo-name

if [ $# -ne 2 ]; then
    echo "使用方法: $0 <github-username> <repo-name>"
    echo "例如: $0 myusername ai-research-daily"
    exit 1
fi

USERNAME=$1
REPO_NAME=$2

echo "🚀 开始推送到 GitHub..."

# 初始化Git仓库（如果还没有）
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
fi

# 添加所有文件
echo "📝 添加文件..."
git add .

# 提交代码
echo "💾 提交代码..."
git commit -m "Initial commit: AI Research Daily System with GitHub Actions"

# 设置远程仓库
echo "🔗 连接到GitHub仓库..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/$USERNAME/$REPO_NAME.git

# 推送到GitHub
echo "⬆️ 推送到GitHub..."
git branch -M main
git push -u origin main

echo "✅ 推送完成！"
echo "🌐 仓库地址: https://github.com/$USERNAME/$REPO_NAME"
echo ""
echo "📋 接下来的步骤："
echo "1. 在GitHub仓库中设置Secrets"
echo "2. 添加 SUPABASE_SERVICE_ROLE_KEY"
echo "3. 添加 SITE_URL = https://superb-pithivier-9cb2c0.netlify.app"
