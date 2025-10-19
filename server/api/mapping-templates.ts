// server/api/mapping-templates.ts
import { serverSupabaseUser } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { Mapping } from '~/composables/useInvoiceGenerator'

// Lấy thông tin kết nối từ biến môi trường của Nuxt
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

export default defineEventHandler(async (event) => {
  // 1. Xác thực người dùng trước tiên. Đây là lớp bảo mật của chúng ta.
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // 2. Tạo một "admin client" sử dụng service_key để bỏ qua RLS
  //    Client này chỉ tồn tại và được dùng bên trong server API này.
  const adminClient = createClient(supabaseUrl!, supabaseServiceKey!)

  // 3. Sử dụng adminClient cho tất cả các thao tác với database
  const userId = user.id || (user as any).sub;

  // Xử lý request GET
  if (event.node.req.method === 'GET') {
    const { data, error } = await adminClient
      .from('mapping_templates')
      .select('id, template_name, mapping_config')
      .eq('user_id', userId)
      .order('template_name')

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }
    return data
  }

  // Xử lý request POST
  if (event.node.req.method === 'POST') {
    const body = await readBody(event) as { name: string, config: Mapping }

    if (!body.name || body.name.trim() === '') {
      throw createError({ statusCode: 400, statusMessage: 'Template name is required' })
    }

    const { error } = await adminClient
      .from('mapping_templates')
      .upsert({
        user_id: userId,
        template_name: body.name.trim(),
        mapping_config: body.config,
      }, { onConflict: 'user_id, template_name' })

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }
    return { status: 'ok' }
  }

  if (event.node.req.method === 'DELETE') {
    const body = await readBody(event) as { id: number }

    if (!body.id) {
      throw createError({ statusCode: 400, statusMessage: 'Template ID is required' })
    }

    const { error } = await adminClient
      .from('mapping_templates')
      .delete()
      .match({ id: body.id, user_id: userId }) // Quan trọng: Chỉ cho phép xóa template của chính mình

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }
    return { status: 'ok', message: 'Template deleted' }
  }

})
