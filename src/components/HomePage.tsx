
import React, { useState, useEffect } from 'react'
import { Brain, Mail, Calendar, ExternalLink, Users, TrendingUp } from 'lucide-react'
import { db } from '../lib/supabase'
import type { DailyReport, Paper } from '../types'

export default function HomePage() {
  const [latestReport, setLatestReport] = useState<DailyReport | null>(null)
  const [featuredPapers, setFeaturedPapers] = useState<Paper[]>([])
  const [email, setEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLatestReport()
  }, [])

  const loadLatestReport = async () => {
    try {
      setLoading(true)
      const report = await db.getLatestReport()
      if (report) {
        setLatestReport(report)
        
        // 获取重点论文
        if (report.featured_papers && report.featured_papers.length > 0) {
          const papers = await db.getPapers(50)
          const featured = papers.filter(p => report.featured_papers.includes(p.id))
          setFeaturedPapers(featured.slice(0, 5))
        }
      }
    } catch (error) {
      console.error('Error loading latest report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubscribeStatus('loading')
    setMessage('正在订阅...')
    
    try {
      console.log('尝试订阅邮箱:', email)
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '已配置' : '未配置')
      
      await db.addSubscriber(email)
      console.log('订阅成功')
      setSubscribeStatus('success')
      setMessage('订阅成功！您将收到每日AI研究摘要。')
      setEmail('')
    } catch (error) {
      console.error('订阅失败详细错误:', error)
      console.error('错误类型:', typeof error)
      console.error('错误对象:', error)
      setSubscribeStatus('error')
      
      let errorMessage = '未知错误'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error)
      }
      
      setMessage(`订阅失败: ${errorMessage}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI研究日报</h1>
            </div>
            <div className="text-sm text-gray-600">
              每日精选 · 智能摘要 · 研究前沿
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            每日AI研究精选摘要
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            基于arXiv最新论文，由AI智能分析筛选，为研究者提供每日精准的前沿动态和研究建议
          </p>
          
          {/* 订阅表单 */}
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubscribe} className="flex space-x-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入邮箱地址订阅"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={subscribeStatus === 'loading'}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>{subscribeStatus === 'loading' ? '订阅中...' : '订阅'}</span>
              </button>
            </form>
            
            {message && (
              <div className={`mt-3 text-sm ${
                subscribeStatus === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* 最新日报 */}
        {latestReport ? (
          <div className="mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                  <span>最新日报</span>
                </h3>
                <span className="text-gray-500">
                  {new Date(latestReport.report_date).toLocaleDateString('zh-CN')}
                </span>
              </div>
              
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {latestReport.content}
                </div>
              </div>
              
              <div className="mt-6 flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{latestReport.total_papers} 篇论文</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{featuredPapers.length} 篇重点推荐</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-16 text-center">
            <div className="bg-white rounded-xl shadow-lg p-12">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无最新日报</h3>
              <p className="text-gray-500">系统正在准备中，请稍后查看</p>
            </div>
          </div>
        )}

        {/* 重点论文 */}
        {featuredPapers.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">今日重点论文</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredPapers.map((paper) => (
                <div key={paper.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      paper.importance_level === 'High' 
                        ? 'bg-red-100 text-red-800'
                        : paper.importance_level === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {paper.importance_level === 'High' ? '高重要性' : 
                       paper.importance_level === 'Medium' ? '中等重要性' : '一般重要性'}
                    </span>
                    <span className="text-xs text-gray-500">
                      评分: {paper.ai_relevance_score}/10
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {paper.title}
                  </h4>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {paper.authors}
                  </p>
                  
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {paper.llm_summary}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {paper.ai_categories.slice(0, 3).map((category, index) => (
                      <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                        {category}
                      </span>
                    ))}
                  </div>
                  
                  <a
                    href={paper.arxiv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    <span>查看论文</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 功能特点 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI智能筛选</h3>
            <p className="text-gray-600">
              使用Gemini AI分析论文标题和摘要，智能识别AI相关研究，确保内容质量
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">趋势洞察</h3>
            <p className="text-gray-600">
              不仅总结最新研究，还提供研究趋势分析和未来方向建议
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">每日推送</h3>
            <p className="text-gray-600">
              每日定时推送精选摘要到您的邮箱，不错过任何重要进展
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 AI研究日报. 基于arXiv数据，由AI驱动的学术资讯服务
          </p>
        </div>
      </footer>
    </div>
  )
}
