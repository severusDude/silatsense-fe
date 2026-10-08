export function SiteFooter() {
  return (
    <footer className="flex flex-col gap-4 border-t pt-6 pb-2">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-heading flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            S
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-heading text-base font-bold tracking-tight">SILATSENSE</span>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              UKM Pencak Silat UNSIL
            </span>
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Inovasi evaluasi biomekanik pencak silat berbasis Computer Vision & Machine Learning.
          Dikembangkan bersama Divisi Riset UKM Silat dan Laboratorium Informatika Universitas
          Siliwangi, Tasikmalaya.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-[11px] font-bold tracking-widest uppercase">Sekretariat & Matras</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Gedung PKM Lantai 2, Kampus UNSIL Jl. Siliwangi No.24, Kahuripan, Kec. Tawang Kota
            Tasikmalaya, Jawa Barat 46115
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-[11px] font-bold tracking-widest uppercase">Jadwal Latihan Rutin</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Selasa, Kamis & Sabtu Pukul 16.00 WIB - Selesai Matras Utama PKM
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 border-t pt-4 text-xs text-muted-foreground">
        <p>© 2025 SILATSENSE Biomechanics Platform. Hak Cipta Dilindungi.</p>
        <p>UKM Pencak Silat Universitas Siliwangi (UNSIL).</p>
      </div>
    </footer>
  );
}
