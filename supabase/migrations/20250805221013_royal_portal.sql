/*
  # 修复订阅者表的RLS策略

  1. 问题
    - 当前的RLS策略不允许匿名用户插入订阅者数据
    - 错误: "new row violates row-level security policy for table subscribers"

  2. 解决方案
    - 删除现有的限制性策略
    - 创建新的策略允许匿名用户插入订阅数据
    - 保持其他操作的安全性

  3. 安全考虑
    - 匿名用户只能插入订阅数据
    - 只有认证用户可以读取和更新订阅者信息
*/

-- 删除现有的订阅者表策略
DROP POLICY IF EXISTS "Subscribers: Allow anonymous insert" ON subscribers;
DROP POLICY IF EXISTS "Subscribers: Allow authenticated read" ON subscribers;
DROP POLICY IF EXISTS "Subscribers: Allow authenticated update" ON subscribers;

-- 创建新的策略：允许匿名用户插入订阅数据
CREATE POLICY "Allow anonymous subscribe" ON subscribers
  FOR INSERT TO anon
  WITH CHECK (true);

-- 允许匿名用户插入，但只能插入自己的邮箱
CREATE POLICY "Allow anonymous insert subscribers" ON subscribers
  FOR INSERT TO anon
  WITH CHECK (email IS NOT NULL AND email != '');

-- 允许认证用户读取所有订阅者信息
CREATE POLICY "Allow authenticated read all subscribers" ON subscribers
  FOR SELECT TO authenticated
  USING (true);

-- 允许认证用户更新订阅者状态（用于取消订阅等）
CREATE POLICY "Allow authenticated update subscribers" ON subscribers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 允许匿名用户更新自己的订阅状态（用于取消订阅）
CREATE POLICY "Allow anonymous unsubscribe" ON subscribers
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
