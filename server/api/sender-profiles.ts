// server/api/sender-profiles.ts
import { serverSupabaseUser } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  const userId = user.id || (user as any).sub;
  
  const method = getMethod(event)

  // Lấy danh sách profiles
  if (method === 'GET') {
    const { data, error } = await adminClient
      .from('sender_profiles')
      .select('id, profile_name, profile_data')
      .eq('user_id', userId)
      .order('profile_name')
    if (error) throw createError({ statusCode: 500, message: error.message })
    return data
  }

  // Lưu profile mới
  if (method === 'POST') {
    const { profile_name, profile_data } = await readBody(event)
    if (!profile_name) throw createError({ statusCode: 400, message: 'Profile name is required' })
    
    const { data, error } = await adminClient
      .from('sender_profiles')
      .insert({ user_id: userId, profile_name, profile_data })
      .select()
      .single()
      
    if (error) throw createError({ statusCode: 500, message: error.message })
    return data
  }
  
  // Cập nhật profile đã có
  if (method === 'PUT') {
    const { id, profile_data } = await readBody(event)
    if (!id) throw createError({ statusCode: 400, message: 'Profile ID is required' })

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

  // Xóa profile
  if (method === 'DELETE') {
    const { id } = await readBody(event)
    if (!id) throw createError({ statusCode: 400, message: 'Profile ID is required' })

    const { error } = await adminClient
      .from('sender_profiles')
      .delete()
      .match({ id, user_id: userId }) // Đảm bảo chỉ xóa của chính mình

    if (error) throw createError({ statusCode: 500, message: error.message })
    return { success: true }
  }
})
