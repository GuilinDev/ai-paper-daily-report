/*
  # 彻底修复订阅者表的RLS策略

  1. 问题分析
    - RLS策略可能存在冲突
    - 需要完全重置所有策略
    - 确保匿名用户可以插入订阅数据

  2. 解决方案
    - 禁用RLS，清理所有策略
    - 重新启用RLS
    - 创建最简单有效的策略

  3. 最终策略
    - 匿名用户：可以插入和更新（用于订阅和取消订阅）
    - 认证用户：完全访问权限
*/

-- 1. 临时禁用RLS以清理所有策略
ALTER TABLE subscribers DISABLE ROW LEVEL SECURITY;

-- 2. 删除所有现有策略
DROP POLICY IF EXISTS "Allow anonymous subscribe" ON subscribers;
DROP POLICY IF EXISTS "Allow anonymous insert subscribers" ON subscribers;
DROP POLICY IF EXISTS "Allow authenticated read all subscribers" ON subscribers;
DROP POLICY IF EXISTS "Allow authenticated update subscribers" ON subscribers;
DROP POLICY IF EXISTS "Allow anonymous unsubscribe" ON subscribers;
DROP POLICY IF EXISTS "Subscribers: Allow anonymous insert" ON subscribers;
DROP POLICY IF EXISTS "Subscribers: Allow authenticated read" ON subscribers;
DROP POLICY IF EXISTS "Subscribers: Allow authenticated update" ON subscribers;
DROP POLICY IF EXISTS "Allow anonymous insert" ON subscribers;
DROP POLICY IF EXISTS "Allow authenticated read" ON subscribers;
DROP POLICY IF EXISTS "Allow authenticated update" ON subscribers;

-- 3. 重新启用RLS
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- 4. 创建简单有效的策略

-- 允许所有人插入订阅数据（包括匿名用户）
CREATE POLICY "subscribers_insert_policy" ON subscribers
  FOR INSERT
  WITH CHECK (true);

-- 允许认证用户读取所有订阅者
CREATE POLICY "subscribers_select_policy" ON subscribers
  FOR SELECT TO authenticated
  USING (true);

-- 允许所有人更新订阅状态（用于取消订阅）
CREATE POLICY "subscribers_update_policy" ON subscribers
  FOR UPDATE
  WITH CHECK (true);

-- 5. 验证策略创建
-- 查看当前策略（仅用于调试，实际执行时可以注释掉）
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'subscribers';
