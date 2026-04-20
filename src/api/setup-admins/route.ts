import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// WARNING: This route requires the SUPABASE_SERVICE_ROLE_KEY in your .env.local
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local" },
      { status: 500 }
    );
  }

  const superAdmins = [
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

  const results = [];

  for (const admin of superAdmins) {
    try {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
          user_metadata: {
            full_name: admin.name,
            role: admin.role,
            roleCode: admin.role,
          },
        });

      let userId = authData?.user?.id;

      if (authError && authError.message.includes("already registered")) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find(
          (u) => u.email?.toLowerCase() === admin.email.toLowerCase()
        );

        if (existingUser) {
          userId = existingUser.id;

          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: admin.password,
            user_metadata: {
              ...(existingUser.user_metadata || {}),
              full_name: admin.name,
              role: admin.role,
              roleCode: admin.role,
            },
          });
        }
      } else if (authError) {
        throw authError;
      }

      if (userId) {
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: userId,
              full_name: admin.name,
              role: admin.role,
            },
            { onConflict: "id" }
          );

        if (updateError) throw updateError;
      }

      results.push({
        email: admin.email,
        status: "Success",
        role: admin.role,
      });
    } catch (error: any) {
      results.push({
        email: admin.email,
        status: "Failed",
        error: error.message,
      });
    }
  }

  return NextResponse.json({
    message: "Super Admin Provisioning Complete",
    results,
  });
}