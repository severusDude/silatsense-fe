# Bukti integrasi FE referensi Coach

23 November 2026, lokal Windows, pnpm 11.17.0. Branch `experiment/coach-reference-integration`, remote fork `https://github.com/muhamadrizki005/silatsense-fe.git`. Working tree FE bersih pada awal tugas. BE `codex/coach-reference-api` memiliki perubahan existing; tidak ditimpa. Tidak ada push, merge, deployment, Linear, atau akses Filess/B2 produksi.

## Gates aktual

| Perintah | Hasil |
| --- | --- |
| `pnpm gen:api` | Lulus, generator 0.99.0, OpenAPI lokal BE |
| `pnpm test` | **521 passed, 71 test files**, 11,04 detik pada run final |
| `pnpm typecheck` | Lulus, `tsc --noEmit`, exit 0 |
| `pnpm lint` | Lulus, ESLint tanpa error/warning, exit 0 |
| `pnpm build` | Lulus, Next.js 16.3.8 dengan Webpack dan Cache Components, exit 0 |
| `git diff --check` | Lulus |

Build default sekarang `next build --webpack`. Percobaan Turbopack mengalami crash saat menghubungkan worker PostCSS lokal; Webpack menyelesaikan compile, TypeScript, prerender dan build traces. Tidak ada dependency tambahan atau perubahan desain untuk mengatasi ini. Fetch Google Fonts existing memerlukan akses jaringan saat cache belum tersedia.

## Tes otomatis (transport/storage mock, bukan cloud)

Tes baru mengeksekusi checksum SHA256 terhadap byte Blob, urutan metadata init → raw PUT → complete, forwarding target/kategori/retry/checksum/idempotency, batas file BE di atas 4,5 MB, penolakan target yang tidak sesuai/missing, acceptedSession, kegagalan init/PUT/complete, cancel sebelum/sesudah PUT, tiket kedaluwarsa, progress nyata XHR dan credentials=false. Complete retry tidak meminta tiket atau mengunggah file lagi. Server Action completion menginvalidasi histori untuk pembacaan ulang.

Kontrak hasil statis existing tetap lulus. Hasil temporal reference_compared dengan score null dan completed/not_assessable tetap dipetakan sebagai hasil yang dapat dibaca. Panel dirender dengan nilai nullable, rasio panjang torso, sampleCount/coverage dan feedback terjemahan. alignmentDistance tidak menjadi persentase akurasi.

Geometri diuji untuk letterbox/pillarbox/resize, interpolasi hanya pada gap sah, tanpa extrapolasi, seek pada gap, warna yang tidak diperpanjang ke bin jauh, garis bersama prioritas merah, visibility rendah, timeline kosong dan data nullable. Endpoint pose Member/Coach serta playback Range Coach diuji dengan transport mock, termasuk 404/410 tanpa fallback ke endpoint Member.

Refresh diuji untuk single-flight sesi yang sama, pemisahan sesi, cache rotasi 30 detik, pengulangan setelah network failure, retry sekali 401 dengan token scoped request, tanpa replay 503/mutasi network, tanpa penghapusan cookie saat gangguan jaringan. Proxy mencabut refresh 401 tanpa redirect loop dan membuang internal header yang dipasok browser. Ini bukti satu proses, bukan koordinasi deployment multi-instance.

## Smoke nyata HTTP localhost + worker native

BE source existing diluncurkan pada `127.0.0.1:8101`; FE pada `localhost:3101`. Konfigurasi proses menunjuk **SQLite dan folder media sementara di workspace FE**, storage local, mail disabled, model pose/referensi existing dibaca melalui path absolut. Tidak memuat `.env.worker` atau menjalankan antrean/cleanup cloud. Subprocess BE mendapat PYTHONPATH source BE. Tidak mengubah source BE, env, artifact, atau database development.

Dua klip kosong sintetis berdurasi dua detik dipakai untuk memeriksa hasil yang tidak dapat dinilai. Klip kedua H.264 640×480 dapat diputar browser; klip MP4V awal menghasilkan fallback error player (codec tidak didukung Chromium), bukan sukses playback palsu.

| Pemeriksaan run H.264 | Hasil aktual |
| --- | --- |
| Login Member terhadap BE lokal | Berhasil melalui FE/browser dan API |
| Multipart lokal BE dengan movementId eksplisit | HTTP 202, sessionId 2 pada DB disposable |
| Status sebelum worker | queued |
| Worker native MediaPipe, artifact referensi existing | completed |
| Analysis / comparison | insufficient_pose / not_assessable |
| Score | null |
| Timeline | 0 observasi, tidak ada pose dummy |
| Playback Range API Member / Coach | HTTP 206 / 206 |
| Detail / pose Coach | HTTP 200 / 200 |
| Coach memanggil pose endpoint Member | HTTP 403 |
| Histori Member | HTTP 200 |
| Video setelah expiry fixture, Member / Coach | HTTP 410 / 410 |
| Evaluasi Member / detail Coach sesudah expiry | HTTP 200 / 200 |
| Detail histori Member sesudah expiry | HTTP 200 |

Upload ini memakai endpoint multipart BE **khusus smoke storage lokal**. Ia bukan bukti PUT browser ke B2 dan bukan jalur utama aplikasi. Storage lokal BE memang menolak tiket direct-upload dengan 503 `direct_upload_unavailable`; tidak membuat endpoint atau adapter palsu untuk menyembunyikan batas tersebut.

## Browser nyata (CUA, FE + BE lokal)

- Login Member, dashboard dan record-config pukulan dari BE lokal; pilihan depan, melingkar, bandul muncul tanpa hardcode classifier. Target melingkar berhasil dipilih.
- Kamera dipindai tetapi browser uji tetap menunggu izin/perangkat; **perekaman kamera penuh belum terverifikasi**. Tidak merekam stream pengguna atau membuat klip dummy di aplikasi.
- Evaluasi insufficient_pose menampilkan target dan not_assessable, skor tetap tanda kosong. H.264 mencapai readyState 4, resolusi 640×480, durasi 2 detik. Seek lewat kontrol keyboard mengubah currentTime saat paused. Timeline kosong tidak menggambar pose.
- Ukuran SVG sama dengan viewport video saat resize: 293×164,8125 pada mobile dan 366×205,875 pada desktop. Interpolasi/gambar berwarna pada pose nonkosong diuji unit, belum browser dengan video privat.
- Fullscreen wrapper dicoba; browser in-app tidak masuk fullscreen. Tidak mengklaim fullscreen berhasil di lingkungan ini. Player menyediakan pesan saat request ditolak; dukungan browser biasa masih perlu smoke.
- Selesai dan Simpan memutasi BE lokal, lalu status hasil pembacaan ulang menampilkan evaluasi sudah ditandai selesai. Link Latihan Ulang kembali ke recorder dengan Pukulan depan dipilih.
- Login Coach dan detail binaan nyata menampilkan hasil/target serta status media tidak tersedia sesudah expiry, dengan review manusia terpisah. Screenshot hasil Coach diambil pada browser uji; tidak menyertakan video privat.
- Overflow **lulus**: record pada 1280 (`scrollWidth=1265`) dan 390 (`375`); hasil pada 390 (`375`) dan 1440 (`1425`); detail Coach pada 390 (`375`). Semuanya `scrollWidth <= innerWidth`. Shell memakai bottom navigation, tidak mempunyai sidebar open/collapsed untuk diuji.

## Yang belum terbukti dan dependensi

1. PUT video nyata browser → B2, preflight CORS pada origin deployment, progress/error network nyata B2 dan complete terpadu terhadap cloud. Tes transport otomatis adalah mock. Pada pengujian awal, [contoh CORS](b2-cors.example.json) hanya disiapkan; penerapan khusus localhost:3101 kemudian diverifikasi pada bagian tindak lanjut CORS di bawah. Bucket tetap privat. Ikuti [aturan resmi Backblaze](https://www.backblaze.com/docs/cloud-storage-cross-origin-resource-sharing-rules).
2. Perbandingan reference_compared dan overlay berwarna pada video pose nyata melalui FE/browser. Automatic approval review **menolak** pemakaian video privat dari cache smoke BE karena provenance/izin pemakaian sumber dianggap belum jelas. Perintah tidak dijalankan; tidak mencoba jalur lain untuk melewati penolakan. Memerlukan izin eksplisit atas satu video uji privat untuk pemrosesan lokal, atau media uji lain yang diizinkan. Bukti smoke BE terdahulu tidak dihitung sebagai pengujian FE pada tugas ini.
3. Kamera penuh dan fullscreen browser biasa; izin/device browser uji membatasi pemeriksaan tersebut.
4. Deployment Vercel/worker laptop persisten dan koordinasi refresh lintas instance. Tidak diaktifkan pada tugas ini.
5. Pemulihan target sesi gagal lintas perangkat: SessionOut belum mengandung movementId; UI memakai evaluasi sumber/sessionStorage atau meminta pilihan eksplisit. Tambahan DTO minimal dijelaskan di panduan integrasi.

Server FE dan BE dihentikan beserta process tree; port listener 3101/8101 dibebaskan. SQLite/media/video sintetis, launcher, log dan artefak uji sementara dibersihkan setelah bukti disarikan di dokumen ini.

## Peta perubahan

| Bagian | Berkas |
| --- | --- |
| Kontrak generated | `openapi-ts.config.ts`; `src/api/types.gen.ts`, `zod.gen.ts`, `sdk.gen.ts`, `index.ts`, `client.gen.ts`, `@tanstack/react-query.gen.ts` |
| Target, rekaman dan upload | `features/member/actions/direct-upload.ts`, `direct-upload.ts`, `hooks/use-media-recorder.ts`, `recorder.ts`, `components/rekam-recorder.tsx`, `pages/rekam-page.tsx` |
| Auth | `features/auth/data/refresh-coordinator.ts`, `authenticated-request.ts`, `rotate-session.ts`; `proxy.ts` |
| Mapper/status/capability | `features/member/types.ts`, `data/training-mapper.ts`, `session-mapper.ts`, `history-mapper.ts`; `features/coach/types.ts`, `data/coach-members-mapper.ts` |
| Temporal UI | `features/member/components/coach-comparison.tsx`, `evaluasi-score-card.tsx`, `evaluasi-actions.tsx`, `calibration-card.tsx`, `module-card.tsx`, `session-posture-list.tsx`; `features/coach/components/latest-evaluation.tsx` |
| Pose/playback | `features/member/pose-overlay.ts`, `data/get-pose.ts`, `components/pose-video-player.tsx`, `evaluasi-playback.tsx`, `session-video-placeholder.tsx`; route video di `app/api/member/sessions/[sessionId]/video/route.ts` dan `app/api/coach/sessions/[sessionId]/video/route.ts` |
| Tes baru | `tests/unit/member/direct-upload.test.ts`, `direct-upload-actions.test.ts`, `pose-overlay.test.ts`, `pose-data.test.ts`, `coach-comparison.test.ts`; `tests/unit/coach/video-route.test.ts`; `tests/unit/auth/refresh-coordinator.test.ts`, `authenticated-request.test.ts`, `proxy-session-recovery.test.ts` |
| Tes existing diperbarui | Recorder/mapper/evaluation/session detail/playback Member dan mapper/detail Coach yang semula mengharuskan proxy upload/placeholder |
| Build/dokumen | `package.json`; dokumen ini, `coach-reference-integration.md`, `b2-cors.example.json` |

## Tambahan upload file perangkat — 23 November 2026

Commit fitur `93bf5ef`: kartu pemilihan/pratinjau video perangkat dan pilihan sumber kamera/file, dengan tombol masuk langsung dari halaman persiapan. Berkas tambahan `features/member/video-file.ts`, `components/video-file-input.tsx` dan dua modul tes di `tests/unit/member/video-file*.test.ts`; recorder/controls/page/types existing diperbarui untuk memakai jalur upload yang sama.

- `pnpm test`: **535 passed, 73 test files** (14 tes tambahan). Meliputi format/MIME dan fallback, file kosong/berlebih, batas di atas cap proxy lama, durasi invalid/berlebih, metadata timeout, pembatalan, pelepasan object URL, dan tampilan input/preview/konfirmasi.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, serta `git diff --check` lulus. Tidak menambah dependency.
- Browser nyata memakai FE build produksi QA pada port 3102 dan BE lokal pada 8201, SQLite/media disposable serta akun sintetis. Server/data pengguna pada port 3101/8001 tidak diubah atau dihentikan. `.env.worker` tidak dimuat oleh QA.
- Tombol upload di persiapan membuka mode file. File picker nonaktif sebelum target wajib dipilih; setelah target dipilih, video sintetis H.264 640×480, dua detik, 2,6 KB berhasil dipilih dan dipratinjau. Target/sumber terkunci, tombol **Unggah Video** muncul. **Pilih Video Lain** mengembalikan picker dan mempertahankan target tanpa meminta kamera. File `.txt` menampilkan error format dan tidak menghasilkan klip siap unggah.
- Overflow mobile lulus pada 390 px (`scrollWidth=375`) untuk persiapan dan preview; desktop lulus pada 1440 px (`scrollWidth=1440`). Screenshot preview diambil pada browser QA.
- Pemeriksaan ini berhenti sebelum konfirmasi upload: **0 panggilan endpoint uploads** tercatat pada BE QA. Tidak mengirim video ke B2/cloud, menjalankan inference, atau memakai video privat. Jalur init/PUT/complete existing tetap tercakup tes mock; CORS/PUT B2 nyata masih merupakan dependensi eksternal sebagaimana dicatat di atas.
- Server QA, akun/database, klip sintetis dan log sementara dibersihkan setelah pengujian. Build akhir dikembalikan menggunakan konfigurasi FE existing; env pengguna tidak diubah.

## Pemulihan CORS B2 — tindak lanjut 23 November 2026

Setelah pengguna melaporkan kegagalan PUT browser, pemeriksaan cloud read-only mengembalikan `NoSuchCorsConfiguration` pada S3 GetBucketCors dan OPTIONS origin `http://localhost:3101` mengembalikan HTTP 403 tanpa header CORS. Pengguna kemudian meminta perbaikan langsung.

Ditambahkan satu aturan S3-compatible `silatsense-localhost-3101-upload`: origin tepat `http://localhost:3101`, metode PUT, AllowedHeaders content-type, ExposeHeaders ETag, MaxAgeSeconds 300. Daftar aturan S3 sebelumnya kosong; implementasi mempertahankan aturan S3 existing bila ada dan tidak mengubah aturan Native API atau akses publik bucket. `.env.worker` hanya dimuat secara privat untuk otorisasi; tidak ditampilkan atau diubah.

Read-your-own-write: GetBucketCors setelah perubahan mengembalikan satu aturan yang sesuai. OPTIONS ulang mengembalikan **HTTP 200**, Access-Control-Allow-Origin `http://localhost:3101`, Access-Control-Allow-Methods `PUT`, Access-Control-Allow-Headers `content-type`. Probe memakai path diagnostik tanpa objek dan tidak mengirim PUT, membuat marker, mengambil job, atau mengunggah video. Tidak ada signed URL atau kredensial di output.

Ini membuktikan konfigurasi/preflight cloud untuk origin development tersebut; keberhasilan PUT video, complete, dan hasil analisis pada sesi pengguna masih perlu dikonfirmasi. Origin production, `127.0.0.1`, dan port lain belum diberi izin oleh aturan ini. Tidak ada perubahan source aplikasi atau kebutuhan restart FE/API untuk perubahan CORS bucket.
