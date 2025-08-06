/*
  # AI论文日报系统数据库结构

  1. New Tables
    - `papers`
      - `id` (uuid, primary key)
      - `title` (text)
      - `authors` (text)
      - `abstract` (text)
      - `arxiv_id` (text, unique)
      - `arxiv_url` (text)
      - `published_date` (timestamptz)
      - `ai_relevance_score` (integer, 1-10)
      - `importance_level` (text, High/Medium/Low)
      - `ai_categories` (text array)
      - `llm_summary` (text)
      - `created_at` (timestamptz)
    
    - `daily_reports`
      - `id` (uuid, primary key)
      - `report_date` (date, unique)
      - `content` (text)
      - `featured_papers` (text array)
      - `total_papers` (integer)
      - `created_at` (timestamptz)
    
    - `subscribers`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `is_active` (boolean)
      - `subscribed_at` (timestamptz)
      - `unsubscribed_at` (timestamptz)
    
    - `config`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (text)
      - `description` (text)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous read and authenticated write
*/

-- 论文表
CREATE TABLE IF NOT EXISTS papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  authors text NOT NULL,
  abstract text NOT NULL,
  arxiv_id text UNIQUE NOT NULL,
  arxiv_url text NOT NULL,
  published_date timestamptz NOT NULL,
  ai_relevance_score integer NOT NULL CHECK (ai_relevance_score >= 1 AND ai_relevance_score <= 10),
  importance_level text NOT NULL CHECK (importance_level IN ('High', 'Medium', 'Low')),
  ai_categories text[] NOT NULL DEFAULT '{}',
  llm_summary text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 日报表
CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date UNIQUE NOT NULL,
  content text NOT NULL,
  featured_papers text[] NOT NULL DEFAULT '{}',
  total_papers integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 订阅者表
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz
);

-- 配置表
CREATE TABLE IF NOT EXISTS config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- 启用行级安全
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Papers表策略
CREATE POLICY "Papers: Allow anonymous read" ON papers
  FOR SELECT TO anon USING (true);

CREATE POLICY "Papers: Allow authenticated insert" ON papers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Papers: Allow authenticated update" ON papers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Daily Reports表策略
CREATE POLICY "Reports: Allow anonymous read" ON daily_reports
  FOR SELECT TO anon USING (true);

CREATE POLICY "Reports: Allow authenticated insert" ON daily_reports
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Reports: Allow authenticated update" ON daily_reports
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Subscribers表策略
CREATE POLICY "Subscribers: Allow anonymous insert" ON subscribers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Subscribers: Allow authenticated read" ON subscribers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Subscribers: Allow authenticated update" ON subscribers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Config表策略
CREATE POLICY "Config: Allow authenticated all" ON config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_papers_published_date ON papers(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_papers_ai_relevance_score ON papers(ai_relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(is_active) WHERE is_active = true;
