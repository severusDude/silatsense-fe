# Integrasi frontend referensi Coach

23 November 2026. Branch FE `experiment/coach-reference-integration`, fork `muhamadrizki005/silatsense-fe`. Pekerjaan lokal; tidak push, merge, deploy, mengaktifkan mode produksi, atau menulis Linear. Backend dan konfigurasi privatnya tidak diubah.

## Kontrak dan regenerasi

SDK `src/api/` dihasilkan oleh `pnpm gen:api` dari `../silatsense-be/docs/openapi.json`, bukan deployment Vercel. Override lokasi dengan `SILATSENSE_OPENAPI_PATH` saat checkout berbeda. OpenAPI sumber SHA256: `160ea581c9d80da300e33647ec9e08c439e8ba4b364650d40ae55221d754b2f3`. Sumber BE berada pada `codex/coach-reference-api` dengan perubahan integrasi existing yang dibiarkan utuh.

Mapper menerima tambahan capability, target gerakan, coachComparison dan timeline. Hasil statis lama tanpa tambahan tersebut tetap dapat dibaca. `scoringAvailable=false` terpisah dari `referenceComparisonAvailable`. `reference_compared` berarti perbandingan selesai, termasuk bila score null. Warna adalah penyimpangan eksperimental dari demonstrasi Coach; bukan benar/salah, akurasi, jumlah repetisi, atau validasi IPSI.

## Alur rekaman dan upload

1. Buka Latihan → kategori → rekam. Pilihan berasal dari `record-config.movements`. Target wajib mengikuti `movementIdRequired` dan divalidasi ulang pada server terhadap konfigurasi kategori.
2. Pilih target sebelum countdown. Target dikunci sampai rekaman dibuang. Rekam ulang mempertahankan pilihan; penggantian klip membuat key baru. Perubahan kategori/retry/target pada navigasi me-remount recorder. Link rekam ulang evaluasi meneruskan movementId; retry mengambil target dari evaluasi sumber jika tersedia. Target sesi yang baru diterima juga disimpan di sessionStorage untuk retry sesi gagal pada browser yang sama, tanpa token/video.
3. Browser menghitung SHA256 byte asli. Server Action `initUpload` menerima JSON metadata kecil: movementSlug, movementId, filename, mimeType, byteSize, sha256 dan retryOf. Server meneruskan Bearer serta Idempotency-Key ke `POST /api/v1/member/uploads`.
4. Browser PUT Blob mentah langsung ke uploadUrl dengan header tiket. Tidak ada backend Bearer/cookie atau kredensial B2 di browser. File mengikuti batas BE; batas proxy lama 4,5 MB tidak membatasi jalur ini.
5. Server Action `completeUpload` memanggil endpoint complete berdasarkan uploadId, menginvalidasi histori/dashboard, dan mengembalikan sessionId untuk navigasi/polling existing. acceptedSession langsung dipakai tanpa PUT ulang.

Progress berasal dari XHR PUT, dengan status tahap checksum/tiket/PUT/complete, pembatalan dan timeout. Metadata control request dibatasi 20 detik, PUT 120 detik. Retry setelah kegagalan PUT mempertahankan tiket/key. Bila PUT berhasil tetapi complete gagal, tombol coba lagi hanya mengulang complete pada upload yang sama. Tidak otomatis membuat sesi baru. State pemulihan upload berada di memori recorder: jangan menutup/memuat ulang halaman sebelum konfirmasi selesai. Tiket kedaluwarsa dapat ditolak BE dengan `upload_expired`; untuk reservasi baru pengguna harus memulai rekaman baru, bukan retry mutasi otomatis dengan key berbeda.

Route multipart legacy `/api/member/sessions` tetap ada untuk kompatibilitas, dengan batas lamanya. Recorder utama tidak memakainya. Mode storage local BE tidak menyediakan tiket B2; ia mengembalikan `direct_upload_unavailable`. Smoke lokal memakai multipart API BE langsung khusus pengujian, bukan fallback proxy aplikasi.

## Hasil dan video

Member evaluation/histori dan detail Coach menampilkan panel perbandingan walaupun measurements kosong: target, status, nilai fitur/referensi/selisih, satuan, keterlihatan, alasan, feedback, sampleCount dan coverage. `deg` ditulis derajat; `torso_length_ratio` ditulis rasio panjang torso. alignmentDistance tidak dikonversi menjadi akurasi. AI dan keputusan/catatan manusia ditampilkan terpisah.

`getPose` mengambil timeline pada server FE terautentikasi dan meneruskan data serializable ke `PoseVideoPlayer`. Coach memakai `/api/v1/coach/sessions/{id}/pose` dan proxy video Coach; tidak beralih ke endpoint Member. Playback mengalirkan video asli dengan Range tanpa buffering seluruh berkas. Tidak ada MP4 overlay atau inference browser.

Player menyinkronkan waktu play/pause/seek/ended dan ResizeObserver. Koordinat image-normalized dipetakan ke area gambar `object-contain`, termasuk letterbox/pillarbox. Interpolasi hanya di antara observasi nyata dengan gap maksimum API (default kontrak 0,15 detik), tanpa extrapolasi. Warna hanya dipakai dalam setengah gap tersebut, maksimum 0,075 detik dari waktu pengukuran; interval lain abu-abu. Data null/reason tidak diberi warna penilaian. Sendi mengikuti landmarkIndices, prioritas garis merah > kuning > hijau; landmark visibility <0,5 disembunyikan. Tidak ada koordinat z buatan. Tombol fullscreen meminta fullscreen wrapper agar overlay ikut; browser yang menolak mendapat pesan.

Media expired/deleted/unavailable tidak menghilangkan hasil atau review. Error playback menyediakan muat ulang; kegagalan pose memberi pesan terpisah. Sesi completed/not_assessable bukan processing/failed; skor null tidak menjadi 0.

## Autentikasi dan batas deployment

Refresh proaktif proxy, rotasi sesi existing, upload dan playback menggunakan koordinator shared per proses, keyed oleh refresh token sesi. Permintaan paralel berbagi satu in-flight refresh dan hasil rotasi sukses selama 30 detik; entri kemudian dihapus. Tidak ada global Bearer. Network/server failure tidak menghapus cookie; penolakan refresh 401 dapat mencabut sesi. Upload/playback mengulang sekali setelah 401 dengan token request baru; upload init dilindungi Idempotency-Key, complete idempotent berdasarkan uploadId. Tidak mengulang mutasi karena network/5xx secara otomatis. Polling RSC existing melewati proxy refresh proaktif.

Koordinasi ini **tidak lintas proses/instance/region**. Pada deployment multi-instance diperlukan koordinasi eksternal yang mempertahankan rotasi per sesi atau dukungan grace/idempotensi refresh dari BE. Sticky routing saja tidak menjamin seluruh permintaan bertemu di instance yang sama. Jangan mengklaim race lintas instance telah terselesaikan.

## Konfigurasi dan aktivasi

- FE `NEXT_PUBLIC_API_URL` adalah base origin BE, tanpa `/api/v1`. Untuk uji lokal dipakai `http://127.0.0.1:8101`. Jangan salin `.env.worker`, refresh/access token, atau kredensial storage ke FE. Perubahan variabel publik memerlukan rebuild/redeploy FE.
- API tetap memakai prefix `/api/v1`. Deployment Vercel lama belum tentu memiliki kontrak baru; rilis BE harus cocok dengan SDK lokal. Field tambahan memiliki default agar kontrak statis lama tetap didukung.
- Terapkan aturan CORS pada **S3-compatible API B2**, bucket tetap privat. Contoh [b2-cors.example.json](b2-cors.example.json) mengizinkan PUT dengan content-type dari origin FE dan localhost. Ganti placeholder origin, batasi port/origin dev yang diperlukan, dan gabungkan dengan aturan existing; jangan menimpa aturan bucket tanpa memeriksanya. Headers dari tiket BE saat ini hanya Content-Type. Header baru memerlukan penyesuaian AllowedHeaders.
- Preflight harus mengembalikan Access-Control-Allow-Origin yang cocok, metode PUT, dan izin content-type. Periksa melalui Network browser menggunakan tiket sah pada bucket uji; signed URL jangan masuk log/screenshot/laporan. CORS tidak memberikan akses publik dan tidak menggantikan signature. Referensi: [Backblaze CORS](https://www.backblaze.com/docs/cloud-storage-cross-origin-resource-sharing-rules), [S3 CORSRule](https://docs.aws.amazon.com/AmazonS3/latest/API/API_CORSRule.html). Akses administrasi bucket tidak tersedia pada tugas ini; konfigurasi ini disiapkan, belum diterapkan/diverifikasi cloud.
- Urutan aktivasi: **FE siap mengirim movementId → deploy kode BE baru → atur ANALYSIS_MODE=coach-reference dan checksum sesuai worker → verifier worker → jalankan worker/cleanup sesuai panduan BE → uji terpadu pada media uji**. Pastikan database/storage API dan worker sama. Jangan mengaktifkan mode baru sebelum FE terpasang.
- Worker laptop memerlukan artifact privat dan proses persisten. Kesiapan konfigurasi API tidak membuktikan worker hidup. Gunakan panduan BE; tugas ini tidak memulai worker cloud/produksi.

## Penggunaan dan batas yang masih perlu diuji

Pilih kategori/target, rekam, Gunakan Rekaman, tunggu status tahap upload, lalu buka hasil setelah pemrosesan selesai. Pada kegagalan konfirmasi gunakan coba lagi tanpa merekam ulang. Buka panel pengukuran per waktu dan playback; review manusia tetap terpisah. Rekam ulang dari evaluasi meneruskan target sebelumnya.

Lihat [bukti pengujian](coach-reference-verification.md). Direct PUT B2 browser/CORS, rekaman kamera penuh, dan overlay berwarna pada video pose nyata belum diuji end-to-end pada deployment. Sesi gagal tanpa evaluasi pada perangkat/browser lain tidak dapat memulihkan movementId otomatis karena SessionOut BE tidak mengekspos target; UI meminta pilihan eksplisit. Untuk pemulihan lintas perangkat yang lengkap, tambahan minimal BE adalah `SessionOut.movementId` nullable yang dibaca dari snapshot request, tanpa menebak classifier.

`pnpm build` memakai opsi resmi Next.js `--webpack`: worker PostCSS Turbopack lokal keluar sebelum koneksi terbentuk, sedangkan build Webpack selesai. Tidak ada dependency baru; desain/route app tetap memakai Cache Components dan boundary server existing.

## Upload video dari perangkat

Halaman persiapan kini memiliki tombol **Upload Video dari Perangkat** yang membuka `/latihan/{slug}/rekam?source=file`. Di halaman rekam, pilihan **Rekam Kamera / Upload Video** memakai desain tombol pil dan kartu aplikasi existing. Memilih file tidak memerlukan izin kamera.

Pilih target gerakan, tekan **Pilih File Video**, lalu tinjau pratinjau, nama, ukuran, dan durasi. Tekan **Unggah Video** untuk mengirim; pemilihan file sendiri belum membuat tiket atau mengirim video. **Pilih Video Lain** membuang pratinjau dan membuka kembali pilihan target tanpa memindai kamera. Target dan sumber terkunci selama klip terpilih agar identitas permintaan tidak berubah.

Format, ukuran, dan durasi mengikuti record-config BE. MP4/MOV/WebM hanya ditawarkan jika diizinkan konfigurasi kategori; file kosong, ekstensi/MIME yang tidak cocok, ukuran berlebih, dan durasi tidak valid/berlebih ditolak di browser. Jika browser tidak menyediakan MIME, ekstensi dipakai sebagai fallback; BE tetap memvalidasi byte video. Codec tidak terbaca atau durasi WebM tidak finite mendapat pesan untuk ekspor ulang ke MP4/H.264. Pembacaan metadata dibatasi 15 detik.

File asli, filename, MIME, byteSize, movementId, retryOf dan SHA256 masuk ke alur direct-upload existing tanpa transcode atau proxy body video. Setiap file baru mendapat key idempotensi baru; retry file yang sama mempertahankan state upload/complete existing. Object URL dibersihkan saat gagal, dibuang, diganti, dibatalkan atau unmount. Metadata dan pratinjau hanya lokal sampai pengguna mengonfirmasi upload. Tidak ada dependency tambahan.
