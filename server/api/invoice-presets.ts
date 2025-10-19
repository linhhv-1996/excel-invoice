// server/api/invoice-presets.ts
import { serverSupabaseUser } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { Settings } from '~/composables/useInvoiceGenerator' // Import type Settings

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Định nghĩa một type mới chỉ chứa các trường cần lưu, loại bỏ các trường không cần thiết
export type InvoicePresetData = Omit<Settings, 'freeMode' | 'logo'>;

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  const userId = user.id || (user as any).sub;
  
  const method = getMethod(event)

  // Lấy danh sách presets
  if (method === 'GET') {
    const { data, error } = await adminClient
      .from('sender_profiles') // Tên bảng vẫn giữ nguyên để tránh phải đổi trong DB, nhưng logic đã khác
      .select('id, profile_name, profile_data')
      .eq('user_id', userId)
      .order('profile_name')
    if (error) throw createError({ statusCode: 500, message: error.message })
    return data
  }

  // Lưu preset mới
  if (method === 'POST') {
    // Body giờ sẽ là một object chứa toàn bộ settings
    const { profile_name, profile_data } = await readBody(event) as { profile_name: string, profile_data: InvoicePresetData }
    if (!profile_name) throw createError({ statusCode: 400, message: 'Preset name is required' })
    
    const { data, error } = await adminClient
      .from('sender_profiles')
      .insert({ user_id: userId, profile_name, profile_data })
      .select()
      .single()
      
    if (error) throw createError({ statusCode: 500, message: error.message })
    return data
  }
  
  // Cập nhật preset đã có
  if (method === 'PUT') {
    const { id, profile_data } = await readBody(event) as { id: number, profile_data: InvoicePresetData }
    if (!id) throw createError({ statusCode: 400, message: 'Preset ID is required' })

    const { data, error } = await adminClient
        .from('sender_profiles')
        .update({ profile_data })
        .eq('id', id)
        .eq('user_id', userId) // Đảm bảo chỉ update của chính mình
        .select()
        .single()
        
    if (error) throw createError({ statusCode: 500, message: error.message })
    return data
  }

  // Xóa preset
  if (method === 'DELETE') {
    const { id } = await readBody(event)
    if (!id) throw createError({ statusCode: 400, message: 'Preset ID is required' })

    const { error } = await adminClient
      .from('sender_profiles')
      .delete()
      .match({ id, user_id: userId })

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { success: true }
  }
})
