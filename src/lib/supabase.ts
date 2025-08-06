import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database operations
export const db = {
  // Papers
  async getPapers(limit = 50) {
    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .order('published_date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async insertPaper(paper: Omit<any, 'id' | 'created_at'>) {
    // 先检查是否已存在
    const { data: existing } = await supabase
      .from('papers')
      .select('id')
      .eq('arxiv_id', paper.arxiv_id)
      .single()
    
    if (existing) {
      // 如果已存在，返回现有记录
      const { data: existingPaper } = await supabase
        .from('papers')
        .select('*')
        .eq('arxiv_id', paper.arxiv_id)
        .single()
      return existingPaper
    } else {
      // 如果不存在，插入新记录
      const { data, error } = await supabase
        .from('papers')
        .insert(paper)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Daily Reports
  async getLatestReport() {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getReports(limit = 10) {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async insertReport(report: Omit<any, 'id' | 'created_at'>) {
    // 先检查今天是否已有日报
    const { data: existing } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('report_date', report.report_date)
      .single()
    
    if (existing) {
      // 如果已存在，更新现有日报
      const { data, error } = await supabase
        .from('daily_reports')
        .update({
          content: report.content,
          featured_papers: report.featured_papers,
          total_papers: report.total_papers
        })
        .eq('report_date', report.report_date)
        .select()
        .single()
      
      if (error) throw error
      return data
    } else {
      // 如果不存在，插入新记录
      const { data, error } = await supabase
        .from('daily_reports')
        .insert(report)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Subscribers
  async getSubscribers() {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('is_active', true)
    
    if (error) throw error
    return data
  },

  async addSubscriber(email: string) {
    console.log('正在添加订阅者到数据库:', email)
    console.log('Supabase client 状态:', supabase ? '已初始化' : '未初始化')
    
    const { data, error } = await supabase
      .from('subscribers')
      .insert({ email, is_active: true })
      .select()
      .single()
    
    if (error) {
      console.error('数据库插入错误:', error)
      console.error('错误代码:', error.code)
      console.error('错误详情:', error.details)
      console.error('错误提示:', error.hint)
      throw error
    }
    console.log('订阅者添加成功:', data)
    return data
  },

  async unsubscribe(email: string) {
    const { data, error } = await supabase
      .from('subscribers')
      .update({ 
        is_active: false, 
        unsubscribed_at: new Date().toISOString() 
      })
      .eq('email', email)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Config
  async getConfig(key: string) {
    const { data, error } = await supabase
      .from('config')
      .select('value')
      .eq('key', key)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.value
  },

  async setConfig(key: string, value: string, description = '') {
    // 先尝试更新现有记录
    const { data: updateData, error: updateError } = await supabase
      .from('config')
      .update({ 
        value, 
        description,
        updated_at: new Date().toISOString()
      })
      .eq('key', key)
      .select()
      .single()
    
    if (updateError && updateError.code === 'PGRST116') {
      // 如果记录不存在，则插入新记录
      const { data: insertData, error: insertError } = await supabase
        .from('config')
        .insert({ 
          key, 
          value, 
          description,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      return insertData
    } else if (updateError) {
      throw updateError
    }
    
    return updateData
  },

  async getAllConfigs() {
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .order('key')
    
    if (error) throw error
    return data
  }
}
