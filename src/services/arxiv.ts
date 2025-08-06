import type { ArxivPaper } from '../types'
import { supabase } from '../lib/supabase'

// AI相关的arXiv分类
const AI_CATEGORIES = [
  'cs.AI',    // Artificial Intelligence
  'cs.LG',    // Machine Learning
  'cs.CV',    // Computer Vision
  'cs.CL',    // Computation and Language
  'cs.NE',    // Neural and Evolutionary Computing
  'cs.RO',    // Robotics
  'cs.IR',    // Information Retrieval
  'cs.HC',    // Human-Computer Interaction
  'stat.ML',  // Machine Learning (Statistics)
  'math.OC',  // Optimization and Control
  'quant-ph', // Quantum Physics (for quantum ML)
  'eess.AS',  // Audio and Speech Processing
  'eess.IV'   // Image and Video Processing
]

export class ArxivService {
  private static instance: ArxivService
  
  static getInstance(): ArxivService {
    if (!ArxivService.instance) {
      ArxivService.instance = new ArxivService()
    }
    return ArxivService.instance
  }

  async fetchRecentPapers(days = 1): Promise<ArxivPaper[]> {
    console.log('开始获取arXiv论文，使用最简单的查询')
    
    // 使用最简单的查询：只查询机器学习分类，不限制日期
    const query = 'cat:cs.LG'
    const searchQuery = `search_query=${encodeURIComponent(query)}&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending`
    
    console.log('最简单的arXiv查询:', searchQuery)
    
    try {
      // 直接调用Edge Function URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const functionUrl = `${supabaseUrl}/functions/v1/arxiv-proxy`
      
      console.log('调用Edge Function URL:', functionUrl)
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ searchQuery })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Edge Function HTTP错误:', response.status, errorText)
        throw new Error(`Edge Function调用失败: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        console.error('Edge Function返回错误:', data.error)
        throw new Error(`代理服务错误: ${data.error}`)
      }
      
      if (!data.xmlData) {
        console.error('Edge Function返回数据格式错误:', data)
        throw new Error('代理服务返回数据格式错误')
      }
      
      console.log('arXiv API响应长度:', data.xmlData.length)
      
      // 打印完整的XML内容用于调试
      console.log('完整XML内容:', data.xmlData)
      
      return this.parseArxivXML(data.xmlData)
    } catch (error) {
      console.error('Error fetching from arXiv:', error)
      
      // 提供更详细的错误信息
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`网络连接失败，无法访问Edge Function。请检查网络连接和Supabase配置。原始错误: ${error.message}`)
      }
      
      throw new Error(`arXiv获取失败: ${error.message}`)
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '')
  }

  private parseArxivXML(xmlText: string): ArxivPaper[] {
    console.log('开始解析XML，内容长度:', xmlText.length)
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'text/xml')
    
    // 检查XML解析是否有错误
    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      console.error('XML解析错误:', parseError.textContent)
      throw new Error('XML解析失败')
    }
    
    // 尝试不同的选择器，考虑命名空间问题
    let entries = doc.querySelectorAll('entry')
    if (entries.length === 0) {
      // 尝试带命名空间的选择器
      entries = doc.querySelectorAll('atom\\:entry, entry')
    }
    if (entries.length === 0) {
      // 尝试通过标签名直接获取
      entries = doc.getElementsByTagName('entry')
    }
    
    console.log('找到的entry数量:', entries.length)
    
    // 如果还是找不到entry，打印XML结构用于调试
    if (entries.length === 0) {
      console.log('XML根元素:', doc.documentElement.tagName)
      console.log('XML所有子元素:', Array.from(doc.documentElement.children).map(el => el.tagName))
      
      // 尝试查找任何可能的条目元素
      const allElements = doc.getElementsByTagName('*')
      console.log('XML中所有元素类型:', Array.from(new Set(Array.from(allElements).map(el => el.tagName))))
    }
    
    const papers: ArxivPaper[] = []
    
    entries.forEach(entry => {
      const id = entry.querySelector('id')?.textContent?.split('/').pop() || ''
      const title = entry.querySelector('title')?.textContent?.trim() || ''
      const summary = entry.querySelector('summary')?.textContent?.trim() || ''
      const published = entry.querySelector('published')?.textContent || ''
      
      console.log('处理论文:', { id, title: title.substring(0, 50) })
      
      const authorElements = entry.querySelectorAll('author name')
      const authors = Array.from(authorElements).map(el => el.textContent || '')
      
      const linkElements = entry.querySelectorAll('link')
      let link = ''
      for (const linkEl of linkElements) {
        if (linkEl.getAttribute('type') === 'text/html') {
          link = linkEl.getAttribute('href') || ''
          break
        }
      }
      
      if (id && title && summary) {
        papers.push({
          id,
          title: title.replace(/\s+/g, ' '),
          authors,
          summary: summary.replace(/\s+/g, ' '),
          published,
          link: link || `https://arxiv.org/abs/${id}`
        })
        console.log('成功添加论文:', id)
      } else {
        console.log('跳过无效论文:', { id, hasTitle: !!title, hasSummary: !!summary })
      }
    })
    
    console.log('最终解析出论文数量:', papers.length)
    return papers
  }
}
