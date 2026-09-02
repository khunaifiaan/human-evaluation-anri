"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertCircle, Archive, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, ImageOff, Loader2, LockKeyhole, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

type Item = { readonly order: number; readonly imageId: string; readonly caption: string; readonly imageUrl: string | null };
type Answer = { fluency: number | null; accuracy: number | null; factualError: "ya" | "tidak" | "tidak_berlaku" | null; note: string };
type SessionData = { sessionId: string; evaluatorLabel: string; resumeCode: string; completedAt: string | null; responses: Array<Answer & { itemOrder: number }> };

const emptyAnswer: Answer = { fluency: null, accuracy: null, factualError: null, note: "" };
const fluencyOptions = [[1, "Tidak masuk akal"], [2, "Sulit dipahami"], [3, "Cukup dipahami"], [4, "Natural, sedikit janggal"], [5, "Sangat natural"]] as const;
const accuracyOptions = [[1, "Sama sekali tidak sesuai"], [2, "Sebagian besar salah"], [3, "Sebagian benar"], [4, "Akurat, satu detail kecil meleset"], [5, "Sangat akurat"]] as const;

export default function EvaluationApp({ items }: { items: readonly Item[] }) {
  const [view, setView] = useState<"welcome" | "evaluation" | "complete">("welcome");
  const [evaluatorLabel, setEvaluatorLabel] = useState("");
  const [resumeCode, setResumeCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const savedCode = window.localStorage.getItem("anri-human-eval-resume-code");
    if (savedCode) window.setTimeout(() => setResumeCode(savedCode), 0);
  }, []);

  const answeredCount = useMemo(() => Object.values(answers).filter((a) => a.fluency && a.accuracy && a.factualError).length, [answers]);
  const item = items[current];
  const answer = answers[item?.order] ?? emptyAnswer;
  const isValid = Boolean(answer.fluency && answer.accuracy && answer.factualError);

  function applySession(data: SessionData) {
    const mapped = Object.fromEntries(data.responses.map((r) => [r.itemOrder, { fluency: r.fluency, accuracy: r.accuracy, factualError: r.factualError, note: r.note }]));
    setSession(data);
    setEvaluatorLabel(data.evaluatorLabel);
    setResumeCode(data.resumeCode);
    setAnswers(mapped);
    window.localStorage.setItem("anri-human-eval-resume-code", data.resumeCode);
    const firstMissing = items.findIndex((candidate) => !mapped[candidate.order]);
    setCurrent(firstMissing === -1 ? items.length - 1 : firstMissing);
    setView(data.completedAt ? "complete" : "evaluation");
  }

  async function startNew() {
    setError("");
    if (!evaluatorLabel.trim()) return setError("Masukkan nama atau ID evaluator.");
    if (!consent) return setError("Persetujuan partisipasi perlu dicentang terlebih dahulu.");
    setLoading(true);
    try {
      const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evaluatorLabel: evaluatorLabel.trim(), consent: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Sesi tidak dapat dibuat.");
      applySession(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sesi tidak dapat dibuat.");
    } finally {
      setLoading(false);
    }
  }

  async function continueSession() {
    setError("");
    if (!resumeCode.trim()) return setError("Masukkan kode resume.");
    setLoading(true);
    try {
      const response = await fetch(`/api/session?code=${encodeURIComponent(resumeCode.trim().toUpperCase())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Sesi tidak ditemukan.");
      applySession(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sesi tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  }

  function updateAnswer(patch: Partial<Answer>) {
    setAnswers((existing) => ({ ...existing, [item.order]: { ...(existing[item.order] ?? emptyAnswer), ...patch } }));
  }

  async function saveAndMove(direction: -1 | 1) {
    if (!session || !isValid) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/responses", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resumeCode: session.resumeCode, itemOrder: item.order, imageId: item.imageId, ...answer }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Jawaban belum tersimpan.");
      const isFinal = current === items.length - 1 && direction === 1;
      if (isFinal && data.answeredCount === items.length) {
        const completed = await fetch("/api/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resumeCode: session.resumeCode }) });
        if (!completed.ok) throw new Error("Evaluasi belum dapat diselesaikan.");
        setView("complete");
      } else {
        setCurrent((value) => Math.min(items.length - 1, Math.max(0, value + direction)));
        setImageFailed(false);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Jawaban belum tersimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (view === "complete") {
    return <main className="min-h-screen bg-[var(--paper)] px-5 py-10"><section className="mx-auto flex min-h-[70vh] max-w-2xl items-center"><div className="w-full rounded-[2rem] border border-[var(--line)] bg-white p-8 text-center shadow-[0_24px_70px_rgba(30,46,60,0.10)] sm:p-12"><div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]"><CheckCircle2 className="size-8" /></div><p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Evaluasi selesai</p><h1 className="font-serif text-4xl leading-tight text-[var(--ink)]">Terima kasih atas penilaian Anda.</h1><p className="mx-auto mt-4 max-w-lg text-base leading-7 text-muted-foreground">Seluruh {items.length} jawaban telah tersimpan. Kontribusi Anda membantu mengevaluasi kualitas caption foto arsip secara lebih menyeluruh.</p>{session && <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-[var(--paper)] p-4 text-sm text-muted-foreground">Kode sesi <span className="ml-1 font-mono font-bold tracking-wider text-[var(--ink)]">{session.resumeCode}</span></div>}</div></section></main>;
  }

  if (view === "welcome") {
    return <main className="min-h-screen bg-[var(--paper)] text-foreground"><div className="border-b border-[var(--line)] bg-[var(--ink)] px-5 py-4 text-white"><div className="mx-auto flex max-w-6xl items-center gap-3"><Archive className="size-5 text-[var(--gold)]" /><span className="text-sm font-semibold tracking-wide">Human Evaluation · ANRI Fase 2 v13</span></div></div><div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-14"><section className="rounded-[2rem] bg-[var(--ink)] p-7 text-white shadow-[0_24px_70px_rgba(30,46,60,0.14)] sm:p-10"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Caption foto arsip Sukarno</p><h1 className="mt-5 max-w-xl font-serif text-4xl leading-[1.08] sm:text-5xl">Nilai caption berdasarkan apa yang Anda lihat.</h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-300">Anda akan menilai {items.length} foto pada tiga aspek: kealamian bahasa, kesesuaian isi dengan foto, dan kemungkinan kesalahan nama orang atau tempat.</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{[[Clock3, "90–120 menit", "Boleh dicicil"], [Save, "Tersimpan otomatis", "Setiap berpindah foto"], [LockKeyhole, "Penilaian independen", "Tanpa mencari referensi"]].map(([Icon, title, text]) => <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/5 p-4"><Icon className="mb-3 size-5 text-[var(--gold)]" /><p className="text-sm font-semibold">{String(title)}</p><p className="mt-1 text-xs leading-5 text-slate-400">{String(text)}</p></div>)}</div><div className="mt-8 border-t border-white/10 pt-6 text-sm leading-6 text-slate-300">Partisipasi bersifat sukarela. Jawaban digunakan untuk riset akademik mengenai evaluasi caption foto arsip dan tidak menilai kemampuan pribadi evaluator.</div></section><section className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-[0_24px_70px_rgba(30,46,60,0.08)] sm:p-8"><h2 className="font-serif text-2xl text-[var(--ink)]">Mulai evaluasi</h2><label className="mt-6 block text-sm font-semibold text-[var(--ink)]" htmlFor="evaluator">Nama / ID evaluator</label><Input id="evaluator" className="mt-2 h-12 rounded-xl" placeholder="Contoh: Evaluator 01" value={evaluatorLabel} onChange={(event) => setEvaluatorLabel(event.target.value)} /><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-[var(--paper)] p-4 text-sm leading-6 text-muted-foreground"><Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-1" /><span>Saya bersedia berpartisipasi secara sukarela dan memahami bahwa jawaban akan digunakan untuk kepentingan riset akademik.</span></label><Button onClick={startNew} disabled={loading} className="mt-5 h-12 w-full rounded-xl bg-[var(--accent)] text-base hover:bg-[var(--accent-dark)]">{loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}Mulai penilaian</Button><div className="my-7 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted-foreground"><span className="h-px flex-1 bg-[var(--line)]" />atau lanjutkan<span className="h-px flex-1 bg-[var(--line)]" /></div><label className="block text-sm font-semibold text-[var(--ink)]" htmlFor="resume">Kode resume</label><div className="mt-2 flex gap-2"><Input id="resume" className="h-11 rounded-xl font-mono uppercase tracking-widest" placeholder="AB12CD34" value={resumeCode} onChange={(event) => setResumeCode(event.target.value.toUpperCase())} /><Button variant="outline" onClick={continueSession} disabled={loading} className="h-11 rounded-xl px-5">Lanjut</Button></div>{error && <ErrorMessage message={error} />}</section></div></main>;
  }

  return <main className="min-h-screen bg-[var(--paper)] pb-28 text-foreground"><header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color:rgba(246,247,245,0.94)] px-5 py-4 backdrop-blur-xl"><div className="mx-auto max-w-6xl"><div className="mb-3 flex items-center justify-between gap-4"><div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><Archive className="size-4 text-[var(--accent)]" />Foto {current + 1} dari {items.length}</div><div className="text-right text-xs text-muted-foreground"><span className="font-semibold text-[var(--ink)]">{answeredCount}</span> tersimpan · <span className="font-mono">{session?.resumeCode}</span></div></div><Progress value={((current + 1) / items.length) * 100} className="h-1.5 bg-[var(--line)] [&_[data-slot=progress-indicator]]:bg-[var(--accent)]" /></div></header><div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:py-8"><section className="overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white shadow-[0_18px_50px_rgba(30,46,60,0.08)] lg:sticky lg:top-28"><div className="relative flex aspect-[4/3] items-center justify-center bg-[#e7e5df]">{item.imageUrl && !imageFailed ? <Image src={item.imageUrl} alt={`Foto arsip ${item.imageId}`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" onError={() => setImageFailed(true)} priority={current === 0} /> : <div className="max-w-sm px-8 text-center text-muted-foreground"><ImageOff className="mx-auto size-10 text-[var(--accent)]" /><p className="mt-4 font-semibold text-[var(--ink)]">Foto belum terhubung</p><p className="mt-2 text-sm leading-6">Sumber gambar sedang dipetakan dari folder Google Drive.</p></div>}</div><div className="border-t border-[var(--line)] px-5 py-4"><p className="break-all font-mono text-xs text-muted-foreground">{item.imageId}</p></div></section><section className="space-y-5"><div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_18px_50px_rgba(30,46,60,0.06)]"><p className="text-xs font-bold uppercase tracking-[0.17em] text-[var(--accent)]">Caption yang dinilai</p><blockquote className="mt-4 border-l-4 border-[var(--gold)] pl-5 font-serif text-2xl leading-9 text-[var(--ink)]">{item.caption}</blockquote></div><RatingBlock title="Fluency" description="Seberapa natural caption ini sebagai kalimat Bahasa Indonesia?" value={answer.fluency} options={fluencyOptions} onChange={(value) => updateAnswer({ fluency: value })} /><RatingBlock title="Accuracy" description="Seberapa sesuai isi caption dengan foto?" value={answer.accuracy} options={accuracyOptions} onChange={(value) => updateAnswer({ accuracy: value })} /><div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6"><h2 className="text-lg font-bold text-[var(--ink)]">Factual Error</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Apakah ada nama orang atau tempat spesifik yang terlihat salah atau mengarang?</p><RadioGroup value={answer.factualError ?? ""} onValueChange={(value) => updateAnswer({ factualError: value as Answer["factualError"] })} className="mt-4 grid gap-2 sm:grid-cols-3">{[["ya", "Ya"], ["tidak", "Tidak"], ["tidak_berlaku", "Tidak berlaku"]].map(([v, label]) => <label key={v} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${answer.factualError === v ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]" : "border-[var(--line)] hover:border-slate-400"}`}><RadioGroupItem value={v} />{label}</label>)}</RadioGroup></div><div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6"><label htmlFor="note" className="text-lg font-bold text-[var(--ink)]">Catatan <span className="font-normal text-muted-foreground">(opsional)</span></label><Textarea id="note" value={answer.note} onChange={(event) => updateAnswer({ note: event.target.value })} placeholder="Tambahkan alasan singkat bila diperlukan…" className="mt-3 min-h-24 rounded-xl" maxLength={800} /></div>{error && <ErrorMessage message={error} />}</section></div><footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-white/95 px-5 py-4 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><Button variant="outline" disabled={current === 0 || saving} onClick={() => saveAndMove(-1)} className="h-11 rounded-xl px-4"><ArrowLeft />Sebelumnya</Button><p className={`hidden items-center gap-2 text-sm sm:flex ${isValid ? "text-[var(--success)]" : "text-muted-foreground"}`}>{isValid ? <Check className="size-4" /> : <AlertCircle className="size-4" />}{isValid ? "Siap disimpan" : "Lengkapi tiga penilaian"}</p><Button disabled={!isValid || saving} onClick={() => saveAndMove(1)} className="h-11 rounded-xl bg-[var(--accent)] px-5 hover:bg-[var(--accent-dark)]">{saving ? <Loader2 className="animate-spin" /> : current === items.length - 1 ? <CheckCircle2 /> : <ArrowRight />}{current === items.length - 1 ? "Selesaikan" : "Simpan & lanjut"}</Button></div></footer></main>;
}

function RatingBlock({ title, description, value, options, onChange }: { title: string; description: string; value: number | null; options: readonly (readonly [number, string])[]; onChange: (value: number) => void }) {
  return <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6"><h2 className="text-lg font-bold text-[var(--ink)]">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p><RadioGroup value={value?.toString() ?? ""} onValueChange={(next) => onChange(Number(next))} className="mt-4 grid gap-2">{options.map(([score, label]) => <label key={score} className={`grid min-h-12 cursor-pointer grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-xl border px-3 py-2.5 transition sm:grid-cols-[2.25rem_1fr_auto] ${value === score ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] hover:border-slate-400"}`}><span className={`flex size-8 items-center justify-center rounded-lg text-sm font-bold ${value === score ? "bg-[var(--accent)] text-white" : "bg-[var(--paper)] text-[var(--ink)]"}`}>{score}</span><span className="text-sm font-medium text-[var(--ink)]">{label}</span><RadioGroupItem value={score.toString()} /></label>)}</RadioGroup></div>;
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"><AlertCircle className="mt-1 size-4 shrink-0" />{message}</div>;
}
