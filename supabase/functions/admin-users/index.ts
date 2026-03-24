import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requesting user is an admin
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Check admin role
    const { data: roleData } = await anonClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error('Admin access required');

    // Use service role for admin operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { action, targetUserId, newRole } = await req.json();

    if (action === 'deleteUser') {
      if (!targetUserId) throw new Error('Target user ID required');
      if (targetUserId === user.id) throw new Error('Cannot delete your own account');

      // Delete user data first
      await Promise.all([
        adminClient.from('user_roles').delete().eq('user_id', targetUserId),
        adminClient.from('user_preferences').delete().eq('user_id', targetUserId),
        adminClient.from('notifications').delete().eq('user_id', targetUserId),
        adminClient.from('audit_logs').delete().eq('user_id', targetUserId),
        adminClient.from('profiles').delete().eq('id', targetUserId),
      ]);

      // Delete auth user
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ success: true, message: 'User deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'listUsers') {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;

      const safeUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }));

      return new Response(
        JSON.stringify({ users: safeUsers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'updateRole') {
      if (!targetUserId || !newRole) throw new Error('Target user and role required');

      const { data: existing } = await adminClient
        .from('user_roles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existing) {
        const { error } = await adminClient
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', targetUserId);
        if (error) throw error;
      } else {
        const { error } = await adminClient
          .from('user_roles')
          .insert({ user_id: targetUserId, role: newRole });
        if (error) throw error;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
