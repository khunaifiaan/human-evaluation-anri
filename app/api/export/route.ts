import { confidentialItems } from "@/data/generated/items-confidential";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get("key") ?? "";
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey || key !== adminKey) return Response.json({ error: "Akses ditolak." }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: sessions, error } = await supabase.from("evaluation_sessions").select("id,evaluator_label,resume_code,completed_at,started_at").order("started_at", { ascending: true });
    if (error) throw error;
    const header = ["evaluator_id", "resume_code", "completed_at", "eval_order", "image_id", "stratum", "ground_truth", "v13_caption", "fluency", "accuracy", "factual_error", "note", "updated_at"];
    const lines = [header.join(",")];
    for (const session of sessions ?? []) {
      const { data: responses, error: responsesError } = await supabase.from("evaluation_responses").select("item_order,image_id,fluency,accuracy,factual_error,note,updated_at").eq("session_id", session.id).order("item_order", { ascending: true });
      if (responsesError) throw responsesError;
      for (const response of responses ?? []) {
        const item = confidentialItems.find((candidate) => candidate.order === response.item_order);
        lines.push([session.evaluator_label, session.resume_code, session.completed_at, response.item_order, response.image_id, item?.stratum, item?.groundTruth, item?.caption, response.fluency, response.accuracy, response.factual_error, response.note, response.updated_at].map(csvCell).join(","));
      }
    }
    return new Response(`\uFEFF${lines.join("\r\n")}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="human-evaluation-results.csv"', "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Data belum dapat diekspor." }, { status: 500 });
  }
}
