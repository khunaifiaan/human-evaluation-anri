import { getSupabaseAdmin } from "@/lib/supabase-admin";

type SessionRow = {
  id: string;
  evaluator_label: string;
  resume_code: string;
  completed_at: string | null;
};

function makeResumeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function sessionPayload(resumeCode: string) {
  const supabase = getSupabaseAdmin();
  const { data: session, error } = await supabase
    .from("evaluation_sessions")
    .select("id,evaluator_label,resume_code,completed_at")
    .eq("resume_code", resumeCode)
    .maybeSingle<SessionRow>();
  if (error) throw error;
  if (!session) return null;

  const { data: responses, error: responsesError } = await supabase
    .from("evaluation_responses")
    .select("item_order,fluency,accuracy,factual_error,note")
    .eq("session_id", session.id)
    .order("item_order", { ascending: true });
  if (responsesError) throw responsesError;

  return {
    sessionId: session.id,
    evaluatorLabel: session.evaluator_label,
    resumeCode: session.resume_code,
    completedAt: session.completed_at,
    responses: (responses ?? []).map((response) => ({
      itemOrder: response.item_order,
      fluency: response.fluency,
      accuracy: response.accuracy,
      factualError: response.factual_error,
      note: response.note,
    })),
  };
}

export async function GET(request: Request) {
  try {
    const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase();
    if (!code) return Response.json({ error: "Kode resume diperlukan." }, { status: 400 });
    const payload = await sessionPayload(code);
    if (!payload) return Response.json({ error: "Kode resume tidak ditemukan." }, { status: 404 });
    return Response.json(payload);
  } catch {
    return Response.json({ error: "Sesi belum dapat dimuat. Silakan coba kembali." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { evaluatorLabel?: string; consent?: boolean };
    const evaluatorLabel = body.evaluatorLabel?.trim().slice(0, 120) ?? "";
    if (!evaluatorLabel) return Response.json({ error: "Nama atau ID evaluator diperlukan." }, { status: 400 });
    if (body.consent !== true) return Response.json({ error: "Persetujuan partisipasi diperlukan." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const consentAt = new Date().toISOString();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const resumeCode = makeResumeCode();
      const { error } = await supabase.from("evaluation_sessions").insert({
        evaluator_label: evaluatorLabel,
        resume_code: resumeCode,
        consent_at: consentAt,
      });
      if (!error) return Response.json(await sessionPayload(resumeCode), { status: 201 });
      if (error.code !== "23505" || attempt === 2) throw error;
    }
    return Response.json({ error: "Sesi tidak dapat dibuat." }, { status: 500 });
  } catch {
    return Response.json({ error: "Sesi belum dapat dibuat. Silakan coba kembali." }, { status: 500 });
  }
}
