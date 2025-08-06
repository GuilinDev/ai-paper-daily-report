/*
  # 修复认证用户的RLS策略问题

  1. 问题分析
    - 当前的RLS策略不允许认证用户插入papers和daily_reports
    - 需要为认证用户提供完整的CRUD权限

  2. 解决方案
    - 删除现有的限制性策略
    - 为认证用户创建完整的访问权限
    - 保持匿名用户的只读权限

  3. 安全考虑
    - 认证用户（管理员）拥有完整权限
    - 匿名用户只能读取数据
*/

-- 1. Papers表：删除现有策略并重新创建
DROP POLICY IF EXISTS "Papers: Allow anonymous read" ON papers;
DROP POLICY IF EXISTS "Papers: Allow authenticated insert" ON papers;
DROP POLICY IF EXISTS "Papers: Allow authenticated update" ON papers;

-- 为Papers表创建新策略
CREATE POLICY "papers_anonymous_read" ON papers
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "papers_authenticated_all" ON papers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Daily Reports表：删除现有策略并重新创建
DROP POLICY IF EXISTS "Reports: Allow anonymous read" ON daily_reports;
DROP POLICY IF EXISTS "Reports: Allow authenticated insert" ON daily_reports;
DROP POLICY IF EXISTS "Reports: Allow authenticated update" ON daily_reports;

-- 为Daily Reports表创建新策略
CREATE POLICY "daily_reports_anonymous_read" ON daily_reports
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "daily_reports_authenticated_all" ON daily_reports
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Config表：确保认证用户有完整权限
DROP POLICY IF EXISTS "Config: Allow authenticated all" ON config;

CREATE POLICY "config_authenticated_all" ON config
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. 验证策略状态（可选，用于调试）
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename IN ('papers', 'daily_reports', 'config', 'subscribers')
-- ORDER BY tablename, policyname;
