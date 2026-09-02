import { evaluationItems } from "@/data/generated/items-public";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const factualValues = new Set(["ya", "tidak", "tidak_berlaku"]);

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { resumeCode?: string; itemOrder?: number; imageId?: string; fluency?: number; accuracy?: number; factualError?: string; note?: string };
    const resumeCode = body.resumeCode?.trim().toUpperCase() ?? "";
    const expectedItem = evaluationItems.find((item) => item.order === body.itemOrder);
    if (!resumeCode || !expectedItem || expectedItem.imageId !== body.imageId) return Response.json({ error: "Data foto tidak valid." }, { status: 400 });
    if (!Number.isInteger(body.fluency) || body.fluency! < 1 || body.fluency! > 5 || !Number.isInteger(body.accuracy) || body.accuracy! < 1 || body.accuracy! > 5 || !body.factualError || !factualValues.has(body.factualError)) return Response.json({ error: "Lengkapi ketiga penilaian." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: session, error: sessionError } = await supabase
      .from("evaluation_sessions")
      .select("id,completed_at")
      .eq("resume_code", resumeCode)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return Response.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    if (session.completed_at) return Response.json({ error: "Evaluasi ini sudah selesai." }, { status: 409 });

    const now = new Date().toISOString();
    const { error: saveError } = await supabase.from("evaluation_responses").upsert({
      session_id: session.id,
      item_order: body.itemOrder,
      image_id: body.imageId,
      fluency: body.fluency,
      accuracy: body.accuracy,
      factual_error: body.factualError,
      note: body.note?.trim().slice(0, 800) ?? "",
      updated_at: now,
    }, { onConflict: "session_id,item_order" });
    if (saveError) throw saveError;
    await supabase.from("evaluation_sessions").update({ updated_at: now }).eq("id", session.id);
    const { count, error: countError } = await supabase.from("evaluation_responses").select("*", { count: "exact", head: true }).eq("session_id", session.id);
    if (countError) throw countError;
    return Response.json({ saved: true, answeredCount: count ?? 0 });
  } catch {
    return Response.json({ error: "Jawaban belum tersimpan. Silakan coba kembali." }, { status: 500 });
  }
}
