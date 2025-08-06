const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EmailRequest {
  apiKey: string;
  fromEmail: string;
  service: 'resend' | 'sendgrid' | 'mailjet';
  subscribers: string[];
  subject: string;
  content: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Send email function called");
    
    const { apiKey, fromEmail, service, subscribers, subject, content }: EmailRequest = await req.json();
    
    if (!apiKey || !fromEmail || !subscribers || !subject || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Sending email to ${subscribers.length} subscribers using ${service}`);
    
    const htmlContent = formatEmailContent(content);
    
    if (service === 'resend') {
      await sendWithResend(apiKey, fromEmail, subscribers, subject, htmlContent);
    } else if (service === 'sendgrid') {
      await sendWithSendGrid(apiKey, fromEmail, subscribers, subject, htmlContent);
    } else if (service === 'mailjet') {
      await sendWithMailjet(apiKey, fromEmail, subscribers, subject, htmlContent);
    } else {
      throw new Error(`Unsupported email service: ${service}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email sent to ${subscribers.length} subscribers`,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

async function sendWithResend(apiKey: string, fromEmail: string, subscribers: string[], subject: string, htmlContent: string): Promise<void> {
  console.log("Sending with Resend API");
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: subscribers,
      subject: subject,
      html: htmlContent,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Resend API error:", response.status, errorText);
    throw new Error(`Resend API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("Resend API success:", result);
}

async function sendWithSendGrid(apiKey: string, fromEmail: string, subscribers: string[], subject: string, htmlContent: string): Promise<void> {
  console.log("Sending with SendGrid API");
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: subscribers.map(email => ({ email })),
      }],
      from: { email: fromEmail },
      subject: subject,
      content: [{
        type: 'text/html',
        value: htmlContent,
      }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("SendGrid API error:", response.status, errorText);
    throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("SendGrid API success:", result);
}

async function sendWithMailjet(apiKey: string, fromEmail: string, subscribers: string[], subject: string, htmlContent: string): Promise<void> {
  console.log("Sending with Mailjet API");
  
  // Mailjet API Key 格式: "publicKey:privateKey" (base64编码)
  const response = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(apiKey)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Messages: [{
        From: {
          Email: fromEmail,
          Name: "AI研究日报"
        },
        To: subscribers.map(email => ({ Email: email })),
        Subject: subject,
        HTMLPart: htmlContent,
      }]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Mailjet API error:", response.status, errorText);
    throw new Error(`Mailjet API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("Mailjet API success:", result);
}

function formatEmailContent(content: string): string {
  // 将Markdown格式转换为HTML
  const htmlContent = content
    .replace(/^# (.*$)/gm, '<h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 20px 0 10px 0;">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 style="color: #374151; font-size: 20px; font-weight: bold; margin: 16px 0 8px 0;">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 style="color: #4b5563; font-size: 18px; font-weight: bold; margin: 12px 0 6px 0;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.6;">')
    .replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI研究日报</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🤖 AI研究日报</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">${new Date().toLocaleDateString('zh-CN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        })}</p>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="margin: 12px 0; line-height: 1.8; font-size: 16px; color: #374151;">
            ${htmlContent}
        </div>
    </div>
    
    <div style="background: white; border-radius: 12px; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="margin: 0 0 10px 0; font-weight: 500;">感谢您订阅AI研究日报！</p>
        <p style="margin: 0; opacity: 0.8;">
            <a href="#" style="color: #6b7280; text-decoration: none;">取消订阅</a> | 
            <a href="#" style="color: #6b7280; text-decoration: none;">管理订阅</a>
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>本邮件由AI研究日报系统自动发送</p>
    </div>
</body>
</html>`;
}
