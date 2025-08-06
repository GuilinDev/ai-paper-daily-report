export interface Paper {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  arxiv_id: string;
  arxiv_url: string;
  published_date: string;
  ai_relevance_score: number;
  importance_level: 'High' | 'Medium' | 'Low';
  ai_categories: string[];
  llm_summary: string;
  created_at: string;
}

export interface DailyReport {
  id: string;
  report_date: string;
  content: string;
  featured_papers: string[]; // paper IDs
  total_papers: number;
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at?: string;
}

export interface Config {
  id: string;
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  link: string;
}

export interface GeminiAnalysis {
  ai_relevance_score: number;
  importance_level: 'High' | 'Medium' | 'Low';
  ai_categories: string[];
  summary: string;
  key_contribution: string;
  why_important: string;
}
