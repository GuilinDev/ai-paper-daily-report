const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ArxivRequest {
  searchQuery: string;
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
    console.log("ArXiv proxy function called");
    console.log("Request method:", req.method);
    
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        { 
          status: 405, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const { searchQuery }: ArxivRequest = await req.json();
    
    if (!searchQuery) {
      return new Response(
        JSON.stringify({ error: "Missing searchQuery parameter" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Fetching from arXiv with query:", searchQuery);
    
    // 调用arXiv API
    const arxivUrl = `http://export.arxiv.org/api/query?${searchQuery}`;
    console.log("ArXiv URL:", arxivUrl);
    
    const response = await fetch(arxivUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'AI-Research-Daily-Bot/1.0 (https://superb-pithivier-9cb2c0.netlify.app)',
        'Accept': 'application/atom+xml,application/xml,text/xml',
      }
    });
    
    if (!response.ok) {
      console.error("ArXiv API HTTP error:", response.status, response.statusText);
      throw new Error(`ArXiv API HTTP error: ${response.status} ${response.statusText}`);
    }
    
    const xmlData = await response.text();
    console.log("ArXiv response received, length:", xmlData.length);
    
    // 验证XML数据
    if (!xmlData || xmlData.length < 100) {
      console.error("Invalid or empty XML response");
      throw new Error("Invalid or empty XML response from arXiv");
    }
    
    // 检查是否包含错误信息
    if (xmlData.includes('<error>') || xmlData.includes('error')) {
      console.error("ArXiv API returned error in XML");
      throw new Error("ArXiv API returned error in response");
    }
    
    const responseData = {
      success: true,
      xmlData: xmlData,
      length: xmlData.length,
      timestamp: new Date().toISOString(),
      query: searchQuery
    };
    
    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error("Error in arxiv-proxy function:", error);
    
    const errorResponse = {
      success: false,
      error: error.message || "Unknown error occurred",
      details: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
