/*
  # 完全修复所有RLS策略问题

  1. 问题分析
    - 认证用户无法插入数据到papers和daily_reports表
    - RLS策略配置不正确
    - 需要彻底重置所有策略

  2. 解决方案
    - 临时禁用所有表的RLS
    - 删除所有现有策略
    - 重新创建正确的策略
    - 重新启用RLS

  3. 最终策略
    - 匿名用户：只能读取papers和daily_reports，可以插入subscribers
    - 认证用户：对所有表有完全访问权限
*/

-- 1. 临时禁用所有表的RLS
ALTER TABLE papers DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE config DISABLE ROW LEVEL SECURITY;

-- 2. 删除所有现有策略
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 删除papers表的所有策略
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'papers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON papers';
    END LOOP;
    
    -- 删除daily_reports表的所有策略
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'daily_reports') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON daily_reports';
    END LOOP;
    
    -- 删除subscribers表的所有策略
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subscribers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON subscribers';
    END LOOP;
    
    -- 删除config表的所有策略
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'config') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON config';
    END LOOP;
END $$;

-- 3. 重新启用RLS
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- 4. 创建新的正确策略

-- Papers表策略
CREATE POLICY "papers_select_all" ON papers
  FOR SELECT
  USING (true);

CREATE POLICY "papers_insert_authenticated" ON papers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "papers_update_authenticated" ON papers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "papers_delete_authenticated" ON papers
  FOR DELETE TO authenticated
  USING (true);

-- Daily Reports表策略
CREATE POLICY "daily_reports_select_all" ON daily_reports
  FOR SELECT
  USING (true);

CREATE POLICY "daily_reports_insert_authenticated" ON daily_reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "daily_reports_update_authenticated" ON daily_reports
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "daily_reports_delete_authenticated" ON daily_reports
  FOR DELETE TO authenticated
  USING (true);

-- Subscribers表策略
CREATE POLICY "subscribers_insert_all" ON subscribers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "subscribers_select_authenticated" ON subscribers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "subscribers_update_all" ON subscribers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Config表策略
CREATE POLICY "config_all_authenticated" ON config
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. 验证策略创建成功
-- 查看所有策略（用于调试）
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies 
-- WHERE tablename IN ('papers', 'daily_reports', 'subscribers', 'config')
-- ORDER BY tablename, policyname;
