const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Test email function called");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    
    // 获取请求头信息用于调试
    const headers = Object.fromEntries(req.headers.entries());
    console.log("Request headers:", headers);
    
    let requestBody = null;
    if (req.method === "POST") {
      try {
        requestBody = await req.json();
        console.log("Request body:", requestBody);
      } catch (e) {
        console.log("No JSON body or invalid JSON");
      }
    }
    
    const responseData = {
      success: true,
      message: "Test email function is working perfectly!",
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      userAgent: headers['user-agent'] || 'Unknown',
      origin: headers['origin'] || 'Unknown',
      requestBody: requestBody,
      environment: {
        denoVersion: Deno.version.deno,
        v8Version: Deno.version.v8,
        typescriptVersion: Deno.version.typescript
      }
    };
    
    console.log("Sending response:", responseData);
    
    return new Response(
      JSON.stringify(responseData, null, 2),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json"
        }
      }
    );
    
  } catch (error) {
    console.error("Error in test-email function:", error);
    
    const errorResponse = {
      success: false,
      error: error.message || "Unknown error occurred",
      details: error.toString(),
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse, null, 2),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json"
        }
      }
    );
  }
});
