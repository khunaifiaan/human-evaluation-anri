# Protokol Human Evaluation — Model BLIP-2 ANRI Fase 2 v13

## 1. Tujuan

Melengkapi evaluasi otomatis (macro-recall kategori, metrik NLG standar) dengan penilaian
manusia terhadap dua aspek yang tidak bisa ditangkap metrik otomatis sepenuhnya:
1. **Fluency** — kealamian bahasa caption sebagai kalimat Bahasa Indonesia.
2. **Accuracy** — kesesuaian caption dengan foto sesungguhnya, termasuk untuk foto
   berkategori "Lainnya" yang **belum pernah dinilai kuantitatif sama sekali** oleh
   macro-recall (35-46% dataset — lihat laporan riset Bagian 3).

Evaluasi ini juga menjadi jawaban langsung terhadap Limitation 4 di draft paper.

## 2. Desain Sampel

**Ukuran sampel**: 152 foto dari 500 (30,4%) — ukuran yang lazim untuk studi human
evaluation captioning skala pilot (jauh di atas ambang minimum ~100 yang umum dipakai di
literatur untuk estimasi confidence interval yang wajar pada skala Likert).

**Stratifikasi** (bukan random murni) — dirancang supaya kategori yang jarang muncul tetap
terwakili cukup, tidak tenggelam oleh kategori mayoritas seperti risiko yang sama yang
mendasari pemakaian macro-recall di evaluasi otomatis:

| Stratum | Kriteria | n |
|---|---|---|
| Weak-Activity | GT aktivitas = Menerima/Menyaksikan atau Meninjau/Kunjungan (2 kategori yang gagal di semua versi) | 30 (15 tiap kategori) |
| Weak-Location | GT lokasi = Istana Negara, Hotel des Indes, Istana Bogor, atau Istana Rijswijk (kategori sulit/langka) | 28 (semua foto Bogor & Rijswijk diambil semua karena cuma tersedia 2-4; sisanya sampel) |
| Strong-Activity | GT aktivitas = Berjabat tangan, Berfoto bersama, Berbincang, atau Pidato/Sambutan | 48 (12 tiap kategori) |
| Strong-Location | GT lokasi = Istana Merdeka atau Gedung Pertemuan Umum | 16 |
| Other-Uncategorized | GT tidak masuk kategori aktivitas MAUPUN lokasi manapun ("Lainnya" di kedua dimensi) | 30 |
| **Total** | | **152** |

File sampel lengkap (`human_eval_sample.csv`) berisi `image_id`, `stratum`, `ground_truth`,
dan `v13_caption` untuk 152 foto ini — urutan baris **sudah diacak** (bukan dikelompokkan per
stratum) supaya evaluator tidak sadar pola pengelompokan yang bisa memengaruhi penilaian.

## 3. Instrumen

File `human_evaluation_form_v13.xlsx`, 3 sheet:
1. **Instructions** — instruksi lengkap + definisi skala penilaian (lihat Bagian 4 di bawah).
2. **Evaluation Form** — yang diisi evaluator: `image_id`, caption v13, dan 3 kolom penilaian
   dengan dropdown (data validation, supaya tidak salah input) untuk Fluency (1-5), Accuracy
   (1-5), dan Factual Error (Ya/Tidak/Tidak Berlaku).
3. **Researcher Ref (CONFIDENTIAL)** — berisi ground truth dan info stratum, **JANGAN
   dibagikan ke evaluator** (supaya mereka menilai murni dari foto, bukan membandingkan teks).

**PENTING — yang perlu Anda siapkan sendiri**: file ini cuma berisi caption dan ID foto,
**bukan foto-nya sendiri** (foto ada di komputer Anda, tidak diupload ke percakapan ini).
Sebelum dibagikan ke evaluator:
1. Kumpulkan 152 foto sesuai daftar `image_id` di sheet Evaluation Form ke satu folder.
2. Duplikat file xlsx ini **satu salinan per evaluator** (lihat Bagian 5 soal jumlah
   evaluator), supaya penilaian tiap orang tidak saling memengaruhi/tertimpa.
3. Kirim folder foto + 1 salinan xlsx ke tiap evaluator, dengan sheet "Researcher Ref"
   **dihapus dulu** dari salinan yang dikirim (supaya tidak sengaja terbuka/terlihat).

## 4. Dimensi dan Skala Penilaian

### Fluency (1-5)
Menilai kealamian bahasa **terlepas dari benar-tidaknya isi**:
- 5 = Sangat natural, tata bahasa sempurna
- 4 = Natural, kejanggalan kecil
- 3 = Cukup bisa dipahami, ada kejanggalan tata bahasa yang terasa
- 2 = Sulit dipahami, struktur kacau, makna masih bisa ditangkap
- 1 = Tidak masuk akal sebagai kalimat

### Accuracy (1-5)
Menilai kesesuaian dengan foto sesungguhnya:
- 5 = Sangat akurat, semua detail penting sesuai
- 4 = Akurat, 1 detail kecil meleset (mis. nama orang salah, aktivitas/lokasi benar)
- 3 = Sebagian benar — aktivitas ATAU lokasi benar, tidak keduanya
- 2 = Sebagian besar salah, tapi ada elemen relevan
- 1 = Sama sekali tidak sesuai

### Factual Error Present (Ya/Tidak/Tidak Berlaku)
Menandai kalau caption menyebut **nama orang/tempat spesifik** yang kelihatan salah/mengarang
— dimensi ini dirancang khusus untuk menangkap pola **halusinasi entitas** yang sudah
ditemukan di Appendix C draft paper (mis. "Moh. Hatta" muncul berulang sebagai nama salah).

## 5. Evaluator

**Rekomendasi jumlah**: minimal **2 evaluator independen** menilai keseluruhan 152 foto yang
sama (bukan dibagi-bagi) — ini wajib untuk bisa menghitung **inter-rater agreement**
(Bagian 6), yang jadi bukti kredibilitas hasil di mata reviewer jurnal. 3 evaluator lebih
baik kalau memungkinkan (memberi kesempatan analisis *majority vote* kalau 2 evaluator
berbeda pendapat).

**Kriteria evaluator**: tidak harus ahli ML — justru **sebaiknya bukan** anggota tim yang
mengerjakan fine-tuning (untuk menghindari bias mengetahui "jawaban yang diharapkan").
Idealnya: penutur asli Bahasa Indonesia, familiar dengan konteks sejarah Indonesia era 1950an
secukupnya untuk mengenali tempat/situasi umum (arsiparis ANRI adalah kandidat ideal kalau
memungkinkan diajak kolaborasi, mengingat mereka yang membuat ground truth aslinya).

**Blinding**: evaluator **tidak diberi tahu** bahwa caption yang dinilai berasal dari model AI
tunggal (v13) vs kemungkinan berasal dari sumber lain — cukup instruksikan sebagai "menilai
caption apa adanya", supaya tidak ada bias ekspektasi terhadap AI.

## 6. Rencana Analisis

1. **Inter-rater reliability**: hitung **Cohen's Kappa** (untuk 2 evaluator) atau
   **Krippendorff's Alpha** (untuk ≥2 evaluator, lebih fleksibel menangani skala ordinal) pada
   skor Fluency dan Accuracy secara terpisah. Nilai κ/α ≥ 0,6 umumnya dianggap "substantial
   agreement" di literatur — laporkan angka ini eksplisit di paper untuk menunjukkan
   penilaian tidak asal-asalan/subjektif semata.
2. **Skor rata-rata per stratum**: hitung mean Fluency dan Accuracy per stratum (Weak vs
   Strong vs Other-Uncategorized) — bandingkan dengan temuan macro-recall otomatis: apakah
   stratum "Weak" memang dinilai manusia sebagai kurang akurat juga (validasi silang), atau
   ada foto yang macro-recall bilang "salah kategori" tapi manusia menilai captionnya tetap
   masuk akal (mis. karena keterbatasan pencocokan kata kunci, bukan captionnya benar-benar
   buruk)?
3. **Skor untuk stratum "Other-Uncategorized"**: ini angka **BARU** yang belum pernah ada di
   riset ini sama sekali — jadi kontribusi utama human evaluation adalah mengisi kekosongan
   ini, bukan sekadar mengonfirmasi ulang macro-recall.
4. **Tingkat Factual Error**: hitung persentase foto yang ditandai "Ya" (ada halusinasi nama)
   — bandingkan dengan pola yang sudah diamati di Appendix C (mis. apakah "Moh. Hatta" memang
   sesering itu muncul sebagai nama salah di sampel yang lebih besar).
5. **Pelaporan di paper**: sajikan sebagai tabel ringkas (mean ± SD Fluency/Accuracy per
   stratum, koefisien inter-rater agreement, % factual error) di bagian Results, dengan
   diskusi di bagian 5 (Discussion) draft paper yang sudah ada.

## 7. Estimasi Waktu dan Beban Kerja

- Persiapan (mengumpulkan 152 foto ke folder, duplikasi file per evaluator): ~30-60 menit.
- Pengisian per evaluator: ~30-45 detik/foto × 152 foto ≈ 90-120 menit (bisa dicicil,
  tidak perlu sekali duduk — sudah dicantumkan di instruksi).
- Analisis (setelah semua evaluator selesai): ~1-2 jam untuk hitung inter-rater agreement dan
  ringkasan statistik (bisa saya bantu buatkan script analisisnya begitu data terkumpul).

## 8. Pertimbangan Etis

Karena evaluator menilai teks/gambar, bukan berpartisipasi sebagai subjek penelitian dalam
pengertian medis/psikologis, risiko etisnya rendah. Tetap disarankan:
- Informasikan ke evaluator secara jelas bahwa partisipasi bersifat sukarela dan hasilnya
  dipakai untuk riset akademik (perlu untuk *informed consent* minimal, terutama kalau
  evaluator adalah kolega yang butuh dicantumkan dalam ucapan terima kasih/*acknowledgments*
  di paper).
- Kalau evaluator adalah staf ANRI, pertimbangkan mencantumkan mereka sebagai *acknowledgment*
  atau bahkan co-author (tergantung kontribusi) di paper — praktik umum kalau mereka
  berkontribusi substansial pada validasi hasil.
