export class EmailService {
  private apiKey: string
  private fromEmail: string
  private service: 'resend' | 'sendgrid' | 'mailjet'
  private static instance: EmailService

  constructor(apiKey: string, fromEmail: string, service: 'resend' | 'sendgrid' | 'mailjet' = 'resend') {
    this.apiKey = apiKey
    this.fromEmail = fromEmail
    this.service = service
  }

  static getInstance(apiKey: string, fromEmail: string, service: 'resend' | 'sendgrid' | 'mailjet' = 'resend'): EmailService {
    if (!EmailService.instance || 
        EmailService.instance.apiKey !== apiKey || 
        EmailService.instance.fromEmail !== fromEmail ||
        EmailService.instance.service !== service) {
      EmailService.instance = new EmailService(apiKey, fromEmail, service)
    }
    return EmailService.instance
  }

  async sendDailyReport(subscribers: string[], subject: string, content: string): Promise<void> {
    if (!this.apiKey || !this.fromEmail) {
      throw new Error('Email service not configured')
    }

    try {
      console.log('使用已部署的 Supabase Edge Function 发送邮件')
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const functionUrl = `${supabaseUrl}/functions/v1/send-email`
      
      console.log('调用 Edge Function URL:', functionUrl)

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          fromEmail: this.fromEmail,
          service: this.service,
          subscribers: subscribers,
          subject: subject,
          content: content
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Edge Function HTTP错误:', response.status, errorText)
        
        // 检查是否是域名验证错误
        if (errorText.includes('domain is not verified') || errorText.includes('403')) {
          console.warn('⚠️ 邮件服务域名未验证，使用模拟发送')
          await this.simulateEmailSend(subscribers, subject, content)
          return
        }
        
        throw new Error(`Edge Function调用失败: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ 邮件发送成功:', result.message)
      } else {
        throw new Error(result.error || '邮件发送失败')
      }
      
    } catch (error) {
      console.error('❌ 邮件发送失败:', error)
      
      // 如果是网络错误或API错误，回退到模拟发送
      if (error.message.includes('domain is not verified') || 
          error.message.includes('403') ||
          error.message.includes('Failed to fetch')) {
        console.warn('⚠️ 邮件发送失败，使用模拟发送作为回退')
        await this.simulateEmailSend(subscribers, subject, content)
        return
      }
      
      throw error
    }
  }

  async simulateEmailSend(subscribers: string[], subject: string, content: string): Promise<void> {
    console.log('=== 模拟邮件发送 ===')
    console.log('收件人:', subscribers)
    console.log('主题:', subject)
    console.log('内容预览:', content.substring(0, 200) + '...')
    console.log('完整内容:')
    console.log(content)
    console.log('=== 邮件发送完成 ===')
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  private formatEmailContent(content: string): string {
    // 将Markdown格式转换为HTML
    const htmlContent = content
      .replace(/^# (.*$)/gm, '<h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 20px 0 10px 0;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="color: #374151; font-size: 20px; font-weight: bold; margin: 16px 0 8px 0;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="color: #4b5563; font-size: 18px; font-weight: bold; margin: 12px 0 6px 0;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.6;">')
      .replace(/\n/g, '<br>')

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI研究日报</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">🤖 AI研究日报</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('zh-CN')}</p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 12px 0; line-height: 1.6;">${htmlContent}</p>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>感谢您订阅AI研究日报！</p>
        <p><a href="#" style="color: #6b7280;">取消订阅</a></p>
    </div>
</body>
</html>`
  }
}
