import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const SUPER_ADMINS = [
  {
    email: "md@britiumexpress.com",
    password: "Bv@00899600",
    name: "Managing Director",
    role: "SUPER_ADMIN",
  },
  {
    email: "sai@britiumexpress.com",
    password: "Sh@nstar28",
    name: "Sai",
    role: "SUPER_ADMIN",
  },
];

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Configuration Error: Missing Service Role Key" },
      { status: 500 }
    );
  }

  const results = [];

  for (const admin of SUPER_ADMINS) {
    try {
      let userId: string | undefined;

      // 1. Attempt to create the user
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          full_name: admin.name,
          role: admin.role,
          roleCode: admin.role,
        },
      });

      if (createError) {
        // 2. Handle existing user case
        if (createError.message.includes("already registered")) {
          // Instead of listUsers(), we fetch specific user to be more performant
          const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === admin.email);

          if (!existingUser) throw new Error("User conflict detected but user not found.");
          
          userId = existingUser.id;

          // Update existing user credentials and metadata
          const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: admin.password,
            user_metadata: {
              ...existingUser.user_metadata,
              full_name: admin.name,
              role: admin.role,
              roleCode: admin.role,
            },
          });

          if (updateAuthError) throw updateAuthError;
        } else {
          throw createError;
        }
      } else {
        userId = authData.user?.id;
      }

      // 3. Sync with Profiles Table
      if (userId) {
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: userId,
              full_name: admin.name,
              role: admin.role,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );

        if (profileError) throw profileError;
      }

      results.push({ email: admin.email, status: "Success", action: "Provisioned/Updated" });
      
    } catch (error: any) {
      results.push({ email: admin.email, status: "Failed", error: error.message });
    }
  }

  return NextResponse.json({
    message: "Super Admin Provisioning Process Completed",
    results,
  });
}