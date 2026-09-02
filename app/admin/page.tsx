"use client";

import { useState } from "react";
import { Archive, Download, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");

  function downloadResults() {
    if (!adminKey.trim()) return;
    window.location.assign(`/api/export?key=${encodeURIComponent(adminKey.trim())}`);
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] px-5 py-10 text-foreground">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-3 text-[var(--ink)]">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--ink)] text-[var(--gold)]"><Archive className="size-5" /></span>
          <div><p className="text-sm font-semibold">Human Evaluation ANRI</p><p className="text-xs text-muted-foreground">Akses peneliti</p></div>
        </div>

        <section className="rounded-[2rem] border border-[var(--line)] bg-white p-7 shadow-[0_24px_70px_rgba(30,46,60,0.09)] sm:p-10">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="size-6" /></div>
          <h1 className="mt-5 font-serif text-3xl text-[var(--ink)]">Unduh hasil evaluasi</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">Masukkan ADMIN_KEY yang tersimpan di environment variables Netlify. File CSV mencakup respons evaluator, stratum, ground truth, dan caption v13.</p>

          <label htmlFor="admin-key" className="mt-7 block text-sm font-semibold text-[var(--ink)]">ADMIN_KEY</label>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1"><KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="admin-key" type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} onKeyDown={(event) => event.key === "Enter" && downloadResults()} placeholder="Masukkan kunci admin" className="h-12 rounded-xl pl-10" autoComplete="off" /></div>
            <Button onClick={downloadResults} disabled={!adminKey.trim()} className="h-12 rounded-xl bg-[var(--accent)] px-5 hover:bg-[var(--accent-dark)]"><Download />Unduh CSV</Button>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Kunci hanya digunakan saat mengunduh dan tidak disimpan di browser.</p>
        </section>
      </div>
    </main>
  );
}
