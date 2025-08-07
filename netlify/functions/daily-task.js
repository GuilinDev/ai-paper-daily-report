const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// 初始化Supabase客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// ArXiv查询配置
const ARXIV_CATEGORIES = [
  'cs.LG',  // Machine Learning
  'cs.AI',  // Artificial Intelligence
  'cs.CV',  // Computer Vision
  'cs.CL',  // Computation and Language (NLP)
  'cs.RO',  // Robotics
  'cs.NE',  // Neural and Evolutionary Computing
  'stat.ML' // Machine Learning (Statistics)
];

// 获取arXiv论文
async function fetchArxivPapers(daysBack = 1) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  const categories = ARXIV_CATEGORIES.map(cat => `cat:${cat}`).join(' OR ');
  const query = `(${categories}) AND submittedDate:[${startDate.toISOString().split('T')[0]} TO ${endDate.toISOString().split('T')[0]}]`;
  
  const url = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&sortBy=submittedDate&sortOrder=descending&max_results=50`;
  
  console.log('Fetching from arXiv:', url);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ArXiv API error: ${response.statusText}`);
  }
  
  const xmlText = await response.text();
  
  // 简单的XML解析
  const papers = [];
  const entryMatches = xmlText.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
  
  for (const match of entryMatches) {
    const entry = match[1];
    
    const getId = (str) => {
      const idMatch = str.match(/<id>http:\/\/arxiv\.org\/abs\/([^<]+)<\/id>/);
      return idMatch ? idMatch[1] : '';
    };
    
    const getTitle = (str) => {
      const titleMatch = str.match(/<title>([^<]+)<\/title>/);
      return titleMatch ? titleMatch[1].replace(/\n/g, ' ').trim() : '';
    };
    
    const getSummary = (str) => {
      const summaryMatch = str.match(/<summary>([^<]+)<\/summary>/);
      return summaryMatch ? summaryMatch[1].replace(/\n/g, ' ').trim() : '';
    };
    
    const getAuthors = (str) => {
      const authors = [];
      const authorMatches = str.matchAll(/<author>\s*<name>([^<]+)<\/name>/g);
      for (const authorMatch of authorMatches) {
        authors.push(authorMatch[1].trim());
      }
      return authors;
    };
    
    const getPublished = (str) => {
      const publishedMatch = str.match(/<published>([^<]+)<\/published>/);
      return publishedMatch ? publishedMatch[1] : new Date().toISOString();
    };
    
    const paper = {
      id: getId(entry),
      title: getTitle(entry),
      summary: getSummary(entry),
      authors: getAuthors(entry),
      link: `http://arxiv.org/abs/${getId(entry)}`,
      published: getPublished(entry)
    };
    
    if (paper.id && paper.title) {
      papers.push(paper);
    }
  }
  
  console.log(`Found ${papers.length} papers from arXiv`);
  return papers;
}

// 调用Gemini API分析论文
async function analyzePapersWithGemini(papers, apiKey) {
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  
  const results = [];
  const batchSize = 5;
  
  for (let i = 0; i < papers.length; i += batchSize) {
    const batch = papers.slice(i, i + batchSize);
    
    const prompt = `分析以下论文，判断它们是否与AI相关，并评估其重要性。

对于每篇论文，请提供：
1. ai_relevance_score (1-10): AI相关性评分
2. importance_level: High/Medium/Low
3. ai_categories: 相关的AI子领域列表
4. summary: 中文摘要（100字以内）

请以JSON格式返回结果数组。

论文列表：
${batch.map((p, idx) => `
论文${idx + 1}:
标题: ${p.title}
摘要: ${p.summary}
ArXiv ID: ${p.id}
`).join('\n')}

返回格式示例：
[
  {
    "arxiv_id": "2401.12345",
    "ai_relevance_score": 8,
    "importance_level": "High",
    "ai_categories": ["深度学习", "计算机视觉"],
    "summary": "该论文提出了..."
  }
]`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      });
      
      if (!response.ok) {
        console.error('Gemini API error:', response.statusText);
        continue;
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // 提取JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const analyses = JSON.parse(jsonMatch[0]);
          // 只保留AI相关性评分>=6的论文
          const filtered = analyses.filter(a => a.ai_relevance_score >= 6);
          results.push(...filtered);
        } catch (e) {
          console.error('Failed to parse Gemini response:', e);
        }
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
    }
    
    // 避免过快调用API
    if (i + batchSize < papers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`Analyzed ${papers.length} papers, found ${results.length} AI-related`);
  return results;
}

// 生成日报内容
async function generateDailyReport(papers, apiKey) {
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  
  const highImportance = papers.filter(p => p.importance_level === 'High');
  const mediumImportance = papers.filter(p => p.importance_level === 'Medium');
  
  const prompt = `基于今日筛选出的${papers.length}篇AI相关论文，生成一份中文研究日报。

高重要性论文（${highImportance.length}篇）：
${highImportance.map(p => `- ${p.summary}`).join('\n')}

中等重要性论文（${mediumImportance.length}篇）：
${mediumImportance.slice(0, 5).map(p => `- ${p.summary}`).join('\n')}

请生成：
1. 今日AI研究热点总结（100字）
2. 值得关注的研究方向（3-5个要点）
3. 对研究者的建议（50字）

格式要求：使用Markdown格式，适合邮件发送。`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const reportContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  return `# AI研究日报 - ${new Date().toLocaleDateString('zh-CN')}

## 📊 今日统计
- 总计分析论文：${papers.length}篇
- 高重要性：${highImportance.length}篇
- 中等重要性：${mediumImportance.length}篇

${reportContent}

## 📚 今日精选论文

### 高重要性论文
${highImportance.map((p, i) => `
${i + 1}. **${p.summary}**
   - 相关领域：${p.ai_categories.join(', ')}
   - AI相关性评分：${p.ai_relevance_score}/10
`).join('\n')}

### 其他值得关注
${mediumImportance.slice(0, 5).map((p, i) => `
${i + 1}. ${p.summary}
`).join('\n')}

---
*本日报由AI自动生成，数据来源：arXiv.org*`;
}

// 主处理函数
exports.handler = async (event, context) => {
  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
    };
  }

  try {
    console.log('Starting daily task...');
    
    // 验证认证（可选）
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader && supabaseServiceKey) {
      const token = authHeader.replace('Bearer ', '');
      if (token !== supabaseServiceKey) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }
    }
    
    // 检查Supabase配置
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Supabase credentials not configured'
        })
      };
    }
    
    // 初始化Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. 获取配置
    console.log('Fetching configuration...');
    const { data: configs, error: configError } = await supabase
      .from('config')
      .select('*');
    
    if (configError) {
      throw new Error(`Failed to fetch config: ${configError.message}`);
    }
    
    const configMap = {};
    configs.forEach(c => {
      configMap[c.key] = c.value;
    });
    
    const geminiApiKey = configMap.gemini_api_key;
    const emailApiKey = configMap.email_api_key;
    const fromEmail = configMap.from_email;
    const emailService = configMap.email_service || 'resend';
    
    if (!geminiApiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Gemini API key not configured' })
      };
    }
    
    // 2. 获取arXiv论文
    console.log('Fetching papers from arXiv...');
    const papers = await fetchArxivPapers(7); // 获取过去7天的论文
    
    if (papers.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          message: 'No new papers found today',
          papers_count: 0
        })
      };
    }
    
    // 3. AI分析
    console.log(`Analyzing ${papers.length} papers with Gemini...`);
    const analyses = await analyzePapersWithGemini(papers, geminiApiKey);
    
    console.log(`Found ${analyses.length} AI-related papers`);
    
    // 4. 存储论文数据
    console.log('Storing papers in database...');
    const savedPapers = [];
    
    for (const analysis of analyses) {
      const paper = papers.find(p => p.id === analysis.arxiv_id);
      if (!paper) continue;
      
      const paperData = {
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
      };
      
      const { data, error } = await supabase
        .from('papers')
        .upsert(paperData, { onConflict: 'arxiv_id' })
        .select()
        .single();
      
      if (!error && data) {
        savedPapers.push({ ...data, ...analysis });
      }
    }
    
    console.log(`Stored ${savedPapers.length} papers`);
    
    // 5. 生成日报
    console.log('Generating daily report...');
    const reportContent = await generateDailyReport(savedPapers, geminiApiKey);
    
    // 存储日报
    const reportData = {
      report_date: new Date().toISOString().split('T')[0],
      content: reportContent,
      featured_papers: savedPapers.filter(p => p.importance_level === 'High').map(p => p.arxiv_id),
      total_papers: savedPapers.length
    };
    
    await supabase
      .from('daily_reports')
      .upsert(reportData, { onConflict: 'report_date' });
    
    // 6. 发送邮件（如果配置了）
    let emailStatus = 'not configured';
    
    if (emailApiKey && fromEmail) {
      console.log('Sending emails...');
      
      // 获取订阅者
      const { data: subscribers } = await supabase
        .from('subscribers')
        .select('email')
        .eq('is_active', true);
      
      if (subscribers && subscribers.length > 0) {
        try {
          // 调用Supabase Edge Function发送邮件
          const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
              apiKey: emailApiKey,
              fromEmail: fromEmail,
              service: emailService,
              subscribers: subscribers.map(s => s.email),
              subject: `AI研究日报 - ${new Date().toLocaleDateString('zh-CN')}`,
              content: reportContent
            }
          });
          
          if (error) {
            console.error('Email sending error:', error);
            emailStatus = `failed: ${error.message}`;
          } else {
            emailStatus = `sent to ${subscribers.length} subscribers`;
          }
        } catch (emailError) {
          console.error('Email error:', emailError);
          emailStatus = `error: ${emailError.message}`;
        }
      } else {
        emailStatus = 'no active subscribers';
      }
    }
    
    // 返回成功响应
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Daily task completed successfully',
        stats: {
          papers_fetched: papers.length,
          papers_analyzed: analyses.length,
          papers_saved: savedPapers.length,
          email_status: emailStatus
        },
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Daily task error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};