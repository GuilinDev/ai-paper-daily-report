// API路由：处理定时任务调用（支持各种定时服务）
export default async function handler(req: Request): Promise<Response> {
  // 设置CORS头，允许跨域访问
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('定时任务API被调用');
    
    // 动态导入所需的服务
    const { db } = await import('../../lib/supabase');
    const { ArxivService } = await import('../../services/arxiv');
    const { GeminiService } = await import('../../services/gemini');
    const { EmailService } = await import('../../services/email');
    
    // 1. 获取配置
    const geminiApiKey = await db.getConfig('gemini_api_key');
    const emailApiKey = await db.getConfig('email_api_key');
    const fromEmail = await db.getConfig('from_email');
    const emailService = await db.getConfig('email_service') || 'resend';
    
    if (!geminiApiKey) {
      throw new Error('Gemini API Key 未配置');
    }

    // 2. 获取arXiv论文
    const arxivService = ArxivService.getInstance();
    const papers = await arxivService.fetchRecentPapers(7);
    
    if (papers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '今日暂无新论文',
          papers: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. AI分析
    const geminiService = GeminiService.getInstance(geminiApiKey);
    const analyses = await geminiService.analyzePapers(papers);
    
    // 4. 存储论文数据
    const savedPapers = [];
    for (const analysis of analyses) {
      const paper = papers.find(p => p.id === analysis.arxiv_id);
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
          });
          
          savedPapers.push({ ...savedPaper, ...analysis });
        } catch (error) {
          console.error('论文存储失败:', paper.title, error);
        }
      }
    }

    // 5. 生成日报
    const reportContent = await geminiService.generateDailyReport(savedPapers);
    
    const report = await db.insertReport({
      report_date: new Date().toISOString().split('T')[0],
      content: reportContent,
      featured_papers: savedPapers.filter(p => p.importance_level === 'High').map(p => p.id),
      total_papers: savedPapers.length
    });

    // 6. 发送邮件
    let emailResult = { success: false, message: '邮件服务未配置' };
    
    if (emailApiKey && fromEmail) {
      const subscribers = await db.getSubscribers();
      
      if (subscribers.length > 0) {
        try {
          const emailServiceInstance = EmailService.getInstance(emailApiKey, fromEmail, emailService as any);
          const subject = `AI研究日报 - ${new Date().toLocaleDateString('zh-CN')}`;
          
          await emailServiceInstance.sendDailyReport(
            subscribers.map(s => s.email),
            subject,
            reportContent
          );
          
          emailResult = { 
            success: true, 
            message: `邮件发送成功，共 ${subscribers.length} 位订阅者` 
          };
        } catch (error) {
          emailResult = { 
            success: false, 
            message: `邮件发送失败: ${error.message}` 
          };
        }
      } else {
        emailResult = { success: true, message: '无订阅者' };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '每日任务执行完成',
        timestamp: new Date().toISOString(),
        data: {
          papers: savedPapers.length,
          report: report.id,
          email: emailResult
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('每日任务执行失败:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
