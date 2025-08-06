import React, { useState, useEffect } from 'react'
import { Settings, Mail, Brain, Database, Play, Users, FileText, LogOut } from 'lucide-react'
import { db } from '../lib/supabase'
import { ArxivService } from '../services/arxiv'
import { GeminiService } from '../services/gemini'
import { EmailService } from '../services/email'
import type { Config, Subscriber, DailyReport } from '../types'

interface AdminPanelProps {
  onLogout: () => void
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('config')
  const [configs, setConfigs] = useState<Config[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [configsData, subscribersData, reportsData] = await Promise.all([
        db.getAllConfigs(),
        db.getSubscribers(),
        db.getReports()
      ])
      
      setConfigs(configsData || [])
      setSubscribers(subscribersData || [])
      setReports(reportsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setMessage('加载数据失败')
    }
  }

  const handleConfigSave = async (key: string, value: string, description: string) => {
    try {
      await db.setConfig(key, value, description)
      setMessage('配置保存成功')
      loadData()
    } catch (error) {
      console.error('Error saving config:', error)
      setMessage('配置保存失败')
    }
  }

  const runDailyTask = async () => {
    setLoading(true)
    setMessage('开始执行每日任务...')
    
    console.log('开始执行每日任务')

    try {
      // 1. 获取配置
      setMessage('正在获取配置...')
      const geminiApiKey = await db.getConfig('gemini_api_key')
      const emailApiKey = await db.getConfig('email_api_key')
      const fromEmail = await db.getConfig('from_email')
      const emailService = await db.getConfig('email_service') || 'resend'
      
      console.log('配置获取结果:', {
        geminiApiKey: geminiApiKey ? '已配置' : '未配置',
        emailApiKey: emailApiKey ? '已配置' : '未配置',
        fromEmail: fromEmail || '未配置',
        emailService
      })

      if (!geminiApiKey) {
        throw new Error('Gemini API Key 未配置')
      }

      // 2. 获取arXiv论文
      setMessage('正在获取arXiv论文...')
      console.log('开始获取arXiv论文')
      const arxivService = ArxivService.getInstance()
      
      let papers
      try {
        // 扩大搜索范围到7天
        papers = await arxivService.fetchRecentPapers(7)
        console.log('arXiv论文获取成功:', papers.length, '篇')
      } catch (arxivError) {
        console.error('arXiv获取失败:', arxivError)
        throw new Error(`arXiv获取失败: ${arxivError.message}`)
      }
      
      setMessage(`获取到 ${papers.length} 篇论文`)

      if (papers.length === 0) {
        setMessage('今日暂无新论文')
        console.log('今日暂无新论文')
        return
      }

      // 3. AI分析
      setMessage('正在进行AI分析...')
      console.log('开始AI分析，论文数量:', papers.length)
      const geminiService = GeminiService.getInstance(geminiApiKey)
      
      let analyses
      try {
        analyses = await geminiService.analyzePapers(papers)
        console.log('AI分析完成，筛选出:', analyses.length, '篇AI相关论文')
      } catch (geminiError) {
        console.error('Gemini分析失败:', geminiError)
        throw new Error(`AI分析失败: ${geminiError.message}`)
      }
      
      setMessage(`分析完成，筛选出 ${analyses.length} 篇AI相关论文`)

      // 4. 存储论文数据
      setMessage('正在存储论文数据...')
      console.log('开始存储论文数据')
      const savedPapers = []
      let newPapersCount = 0
      let existingPapersCount = 0
      
      for (const analysis of analyses) {
        const paper = papers.find(p => p.id === analysis.arxiv_id)
        if (paper) {
          try {
            const savedPaper = await db.insertPaper({
              title: paper.title,
              authors: paper.authors.join(', '),
              abstract: paper.summary,
              arxiv_id: paper.id,
              arxiv_url: paper.link,
              published_date: paper.published,
              ai_relevance_score: analysis.ai_relevance_score,
              importance_level: analysis.importance_level,
              ai_categories: analysis.ai_categories,
              llm_summary: analysis.summary
            })
            
            savedPapers.push({ ...savedPaper, ...analysis })
            newPapersCount++
            console.log('论文存储成功:', paper.title)
          } catch (dbError) {
            console.error('论文存储失败:', paper.title, dbError)
            // 继续处理其他论文，不中断整个流程
          }
        }
      }
      console.log(`论文处理完成，成功存储: ${savedPapers.length} 篇`)
      setMessage(`论文处理完成，成功存储: ${savedPapers.length} 篇`)

      // 5. 生成日报
      setMessage('正在生成日报...')
      console.log('开始生成日报')
      const reportContent = await geminiService.generateDailyReport(savedPapers)
      console.log('日报生成完成')
      
      const report = await db.insertReport({
        report_date: new Date().toISOString().split('T')[0],
        content: reportContent,
        featured_papers: savedPapers.filter(p => p.importance_level === 'High').map(p => p.id),
        total_papers: savedPapers.length
      })
      console.log('日报存储/更新完成')
      setMessage('日报生成完成，准备发送邮件...')

      // 6. 发送邮件
      if (emailApiKey && fromEmail && subscribers.length > 0) {
        setMessage('正在发送邮件...')
        console.log('开始发送邮件给', subscribers.length, '位订阅者')
        
        try {
          const emailServiceInstance = EmailService.getInstance(emailApiKey, fromEmail, emailService as any)
          const subject = `AI研究日报 - ${new Date().toLocaleDateString('zh-CN')}`
          
          await emailServiceInstance.sendDailyReport(
            subscribers.map(s => s.email),
            subject,
            reportContent
          )
          console.log('✅ 邮件发送完成')
          setMessage(`任务完成！已发送邮件给 ${subscribers.length} 位订阅者（如果看到模拟发送，请检查邮件配置）`)
        } catch (emailError) {
          console.error('邮件发送失败:', emailError)
          const errorMessage = emailError instanceof Error ? emailError.message : '未知错误'
          setMessage(`任务完成！邮件发送遇到问题: ${errorMessage}。请检查控制台查看邮件内容。`)
        }
      } else {
        console.log('邮件服务未配置或无订阅者')
        setMessage('任务完成！（邮件服务未配置或无订阅者）')
      }

      loadData()
    } catch (error) {
      console.error('Error running daily task:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      console.error('详细错误信息:', error)
      setMessage(`任务失败: ${errorMessage}`)
      
      // 如果是网络错误，提供更多信息
      if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        setMessage(`任务失败: 网络请求失败，可能是CORS问题或API不可访问。请检查浏览器控制台获取详细信息。`)
      }
    } finally {
      setLoading(false)
    }
  }

  const ConfigPanel = () => {
    const [editingConfig, setEditingConfig] = useState<{key: string, value: string, description: string} | null>(null)

    const defaultConfigs = [
      { key: 'gemini_api_key', description: 'Google Gemini API密钥', value: '' },
      { key: 'email_api_key', description: '邮件服务API密钥', value: '' },
      { key: 'from_email', description: '发件人邮箱', value: '' },
      { key: 'email_service', description: '邮件服务商 (resend/sendgrid/mailjet)', value: 'mailjet' },
    ]

    const allConfigs = defaultConfigs.map(defaultConfig => {
      const existingConfig = configs.find(c => c.key === defaultConfig.key)
      return existingConfig || defaultConfig
    })

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">系统配置</h3>
        
        {allConfigs.map((config) => (
          <div key={config.key} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{config.description}</h4>
                <p className="text-sm text-gray-600 mt-1">Key: {config.key}</p>
                {config.value && (
                  <p className="text-sm text-gray-500 mt-1 font-mono">
                    {config.key.includes('key') ? '••••••••' : config.value}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditingConfig({
                  key: config.key,
                  value: config.value || '',
                  description: config.description
                })}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                编辑
              </button>
            </div>
          </div>
        ))}

        {editingConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h4 className="text-lg font-semibold mb-4">{editingConfig.description}</h4>
              {editingConfig.key === 'email_service' ? (
                <select
                  value={editingConfig.value}
                  onChange={(e) => setEditingConfig({...editingConfig, value: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                >
                  <option value="resend">Resend</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailjet">Mailjet</option>
                </select>
              ) : (
                <input
                  type={editingConfig.key.includes('key') ? 'password' : 'text'}
                  value={editingConfig.value}
                  onChange={(e) => setEditingConfig({...editingConfig, value: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                  placeholder="请输入配置值"
                />
              )}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    handleConfigSave(editingConfig.key, editingConfig.value, editingConfig.description)
                    setEditingConfig(null)
                  }}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingConfig(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const tabs = [
    { id: 'config', name: '系统配置', icon: Settings },
    { id: 'task', name: '执行任务', icon: Play },
    { id: 'subscribers', name: '订阅管理', icon: Users },
    { id: 'reports', name: '历史报告', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">AI论文日报 - 管理后台</h1>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut className="w-4 h-4" />
              <span>退出</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* 侧边栏 */}
          <div className="w-64">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* 主内容区 */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow p-6">
              {message && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-md text-blue-700">
                  {message}
                </div>
              )}

              {activeTab === 'config' && <ConfigPanel />}

              {activeTab === 'task' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">执行每日任务</h3>
                  <p className="text-gray-600">
                    手动执行每日任务：获取arXiv论文（最多20篇）→ AI分析筛选 → 生成日报 → 发送邮件
                  </p>
                  
                  {/* 定时任务设置区域 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-800 mb-3">🚀 快速设置自动定时发送</h4>
                    
                    <div className="space-y-3">
                      <div className="bg-white rounded-md p-3 border border-blue-100">
                        <h5 className="font-medium text-blue-700 mb-2">方案1：Zapier（推荐，5分钟设置）</h5>
                        <ol className="text-sm text-blue-600 space-y-1 ml-4 list-decimal">
                          <li>访问 <a href="https://zapier.com" target="_blank" className="underline">zapier.com</a> 注册账户</li>
                          <li>创建新的 Zap：Schedule by Zapier → Webhooks</li>
                          <li>设置触发时间：每天上午9点</li>
                          <li>Webhook URL: <code className="bg-gray-100 px-1 rounded text-xs">{window.location.origin}/api/daily-task</code></li>
                          <li>Method: POST，添加 Header: <code className="bg-gray-100 px-1 rounded text-xs">Content-Type: application/json</code></li>
                        </ol>
                      </div>
                      
                      <div className="bg-white rounded-md p-3 border border-blue-100">
                        <h5 className="font-medium text-blue-700 mb-2">方案2：Cron-job.org（免费）</h5>
                        <ol className="text-sm text-blue-600 space-y-1 ml-4 list-decimal">
                          <li>访问 <a href="https://cron-job.org" target="_blank" className="underline">cron-job.org</a> 注册</li>
                          <li>创建新任务，URL: <code className="bg-gray-100 px-1 rounded text-xs">{window.location.origin}/api/daily-task</code></li>
                          <li>设置时间：每天 09:00</li>
                          <li>Method: POST</li>
                        </ol>
                      </div>
                      
                      <div className="bg-white rounded-md p-3 border border-blue-100">
                        <h5 className="font-medium text-blue-700 mb-2">方案3：手机提醒（最简单）</h5>
                        <p className="text-sm text-blue-600">
                          设置手机每天上午9点提醒，手动点击下面的"开始执行"按钮
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={runDailyTask}
                    disabled={loading}
                    className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>{loading ? '执行中...' : '开始执行'}</span>
                  </button>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      <strong>API端点：</strong> <code className="bg-white px-2 py-1 rounded border">{window.location.origin}/api/daily-task</code>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      任何定时服务都可以调用这个API来触发每日任务
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'subscribers' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">订阅用户管理</h3>
                  <p className="text-gray-600">当前订阅用户：{subscribers.length} 人</p>
                  
                  <div className="space-y-2">
                    {subscribers.map((subscriber) => (
                      <div key={subscriber.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{subscriber.email}</p>
                          <p className="text-sm text-gray-500">
                            订阅时间: {new Date(subscriber.subscribed_at).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          subscriber.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscriber.is_active ? '活跃' : '已取消'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">历史日报</h3>
                  
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800">
                            {new Date(report.report_date).toLocaleDateString('zh-CN')} 日报
                          </h4>
                          <span className="text-sm text-gray-500">
                            {report.total_papers} 篇论文
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                          {report.content.substring(0, 200)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
