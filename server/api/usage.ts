// server/api/usage.ts
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)
  const userId = user.id || (user as any).sub;

  // 1. Lấy thông tin gói cước của người dùng
  const { data: profile, error: profileError } = await client
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.error('Profile Error:', profileError);
    throw createError({ statusCode: 500, statusMessage: 'Could not retrieve user profile.' })
  }

  const { subscription_tier: tier } = profile

  // Gói Free hoặc Pro không cần kiểm tra giới hạn
  if (tier === 'free' || tier === 'pro') {
    return { canExport: true, remaining: Infinity }
  }

  // 2. Chỉ xử lý cho gói 'personal'
  if (tier === 'personal') {
    const { invoicesToExport } = await readBody(event) as { invoicesToExport: number }
    if (typeof invoicesToExport !== 'number' || invoicesToExport <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid number of invoices to export.' })
    }

    const usageLimit = 25;

    // 3. Gọi hàm RPC mới trong database
    const { data: usageData, error: rpcError } = await client.rpc('check_and_update_usage', {
        p_user_id: userId,
        p_invoices_to_export: invoicesToExport,
        p_usage_limit: usageLimit
    })

    if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw createError({ statusCode: 500, message: 'An error occurred while checking your usage.' })
    }

    const usage = usageData[0];

    if (!usage.can_export) {
        return {
            canExport: false,
            remaining: usage.remaining,
            message: `You have ${usage.remaining} invoices left in your current cycle. You are trying to export ${invoicesToExport}.`
        }
    }

    return { canExport: true, remaining: usage.remaining }
  }

  // Mặc định cho phép
  return { canExport: true, remaining: Infinity };
})
