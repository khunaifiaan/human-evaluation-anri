import { evaluationItems } from "@/data/generated/items-public";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { resumeCode?: string };
    const code = body.resumeCode?.trim().toUpperCase() ?? "";
    const supabase = getSupabaseAdmin();
    const { data: session, error } = await supabase.from("evaluation_sessions").select("id,completed_at").eq("resume_code", code).maybeSingle();
    if (error) throw error;
    if (!session) return Response.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    const { count, error: countError } = await supabase.from("evaluation_responses").select("*", { count: "exact", head: true }).eq("session_id", session.id);
    if (countError) throw countError;
    if (count !== evaluationItems.length) return Response.json({ error: `Masih ada ${evaluationItems.length - (count ?? 0)} foto yang belum dinilai.` }, { status: 409 });
    const completedAt = session.completed_at ?? new Date().toISOString();
    const { error: updateError } = await supabase.from("evaluation_sessions").update({ completed_at: completedAt, updated_at: completedAt }).eq("id", session.id);
    if (updateError) throw updateError;
    return Response.json({ completed: true, completedAt });
  } catch {
    return Response.json({ error: "Evaluasi belum dapat diselesaikan." }, { status: 500 });
  }
}
