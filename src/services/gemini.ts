import type { ArxivPaper, GeminiAnalysis } from '../types'

export class GeminiService {
  private apiKey: string
  private static instance: GeminiService

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  static getInstance(apiKey: string): GeminiService {
    if (!GeminiService.instance || GeminiService.instance.apiKey !== apiKey) {
      GeminiService.instance = new GeminiService(apiKey)
    }
    return GeminiService.instance
  }

  async analyzePapers(papers: ArxivPaper[]): Promise<(GeminiAnalysis & { arxiv_id: string })[]> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const results: (GeminiAnalysis & { arxiv_id: string })[] = []
    
    // 批量处理，每次处理5篇论文
    const batchSize = 5
    for (let i = 0; i < papers.length; i += batchSize) {
      const batch = papers.slice(i, i + batchSize)
      const batchResults = await this.analyzeBatch(batch)
      results.push(...batchResults)
      
      // 避免API限制，批次间稍作延迟
      if (i + batchSize < papers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }

  private async analyzeBatch(papers: ArxivPaper[]): Promise<(GeminiAnalysis & { arxiv_id: string })[]> {
    const prompt = this.buildAnalysisPrompt(papers)
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 1,
            topP: 1,
            maxOutputTokens: 8192,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        throw new Error('No content returned from Gemini API')
      }

      return this.parseGeminiResponse(content, papers)
    } catch (error) {
      console.error('Error calling Gemini API:', error)
      // 返回默认分析结果
      return papers.map(paper => ({
        arxiv_id: paper.id,
        ai_relevance_score: 5,
        importance_level: 'Medium' as const,
        ai_categories: ['General AI'],
        summary: paper.summary.substring(0, 200) + '...',
        key_contribution: 'Analysis unavailable',
        why_important: 'Requires manual review'
      }))
    }
  }

  private buildAnalysisPrompt(papers: ArxivPaper[]): string {
    const papersText = papers.map((paper, index) => 
      `论文${index + 1} (ID: ${paper.id}):
标题: ${paper.title}
摘要: ${paper.summary}
---`
    ).join('\n')

    return `你是一位AI研究专家。请分析以下论文的标题和摘要，判断它们与人工智能的相关性和重要性。

${papersText}

对每篇论文，请提供以下分析（严格按照JSON格式返回）：

{
  "analyses": [
    {
      "arxiv_id": "论文ID",
      "ai_relevance_score": 1-10的整数（7分以上认为AI相关），
      "importance_level": "High" | "Medium" | "Low",
      "ai_categories": ["具体的AI子领域标签，如Computer Vision, NLP, Machine Learning Theory等"],
      "summary": "一句话总结论文的核心贡献（中文，50字以内）",
      "key_contribution": "主要技术贡献（中文，100字以内）",
      "why_important": "为什么重要/有趣（中文，100字以内）"
    }
  ]
}

评分标准：
- 9-10分：重大突破或创新方法
- 7-8分：有价值的AI相关研究
- 5-6分：边缘相关或应用研究
- 1-4分：不相关或质量较低

请确保返回有效的JSON格式。`
  }

  private parseGeminiResponse(content: string, papers: ArxivPaper[]): (GeminiAnalysis & { arxiv_id: string })[] {
    try {
      // 尝试提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      if (parsed.analyses && Array.isArray(parsed.analyses)) {
        return parsed.analyses.filter((analysis: any) => 
          analysis.ai_relevance_score >= 7 // 只返回AI相关的论文
        )
      }
      
      throw new Error('Invalid response format')
    } catch (error) {
      console.error('Error parsing Gemini response:', error)
      console.log('Raw response:', content)
      
      // 返回默认结果
      return papers.map(paper => ({
        arxiv_id: paper.id,
        ai_relevance_score: 5,
        importance_level: 'Medium' as const,
        ai_categories: ['General AI'],
        summary: paper.summary.substring(0, 200) + '...',
        key_contribution: 'Analysis failed',
        why_important: 'Requires manual review'
      }))
    }
  }

  async generateDailyReport(papers: any[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured')
    }

    const featuredPapers = papers
      .filter(p => p.importance_level === 'High')
      .slice(0, 5)

    const categoryStats = this.getCategoryStats(papers)
    
    const prompt = `基于以下AI论文分析结果，生成一份专业的AI研究日报。请注意：不要在内容中包含"发布日期"或类似的日期信息，因为邮件模板已经包含了日期。

重点论文：
${featuredPapers.map(p => `
- ${p.title}
  作者：${p.authors}
  核心贡献：${p.key_contribution}
  重要性：${p.why_important}
  链接：${p.arxiv_url}
`).join('\n')}

领域分布：
${Object.entries(categoryStats).map(([category, count]) => `${category}: ${count}篇`).join('\n')}

请生成一份结构化的日报，包括：
1. 今日重点论文推荐（3-5篇）
2. 领域分布概览
3. 研究趋势洞察
4. 对研究者的建议

要求：
- 专业但易懂的语言
- 突出创新点和实用价值
- 提供具体的研究方向建议`

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 1,
            topP: 1,
            maxOutputTokens: 4096,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '日报生成失败'
    } catch (error) {
      console.error('Error generating daily report:', error)
      return '日报生成失败，请检查API配置'
    }
  }

  private getCategoryStats(papers: any[]): Record<string, number> {
    const stats: Record<string, number> = {}
    
    papers.forEach(paper => {
      paper.ai_categories.forEach((category: string) => {
        stats[category] = (stats[category] || 0) + 1
      })
    })
    
    return stats
  }
}
