import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/features/landing/components/shared/section-heading";

const steps = [
  {
    index: "01",
    title: "Pilih Latihan",
    description:
      "Tentukan pilar yang ingin Anda latih: Kuda-kuda dasar, rangkaian pukulan lurus, tangkisan atas, atau Tendangan.",
  },
  {
    index: "02",
    title: "Posisikan Kamera",
    description:
      "Letakkan ponsel atau laptop berjarak 2.5 - 3 meter hingga seluruh tubuh dari ujung kepala hingga telapak kaki terlihat jelas.",
  },
  {
    index: "03",
    title: "Latihan Terpandu AI",
    description:
      "Lakukan repetisi sesuai aba-aba visual. Algoritma akan menghitung derajat sudut dan menandai titik ketidakseimbangan tubuh.",
  },
  {
    index: "04",
    title: "Skor & Catatan Pelatih",
    description:
      "Dapatkan skor akurasi persentase instan, ringkasan biomekanik, serta sinkronisasi otomatis ke akun pembina silat UNSIL.",
  },
];

export function LangkahSection() {
  return (
    <section aria-labelledby="langkah-heading" className="flex flex-col gap-4">
      <div id="langkah-heading">
        <SectionHeading
          eyebrow="Alur Praktis"
          title="4 Langkah Latihan Mandiri"
          description="Mudah digunakan di sekretariat UKM, kamar asrama, maupun lapangan terbuka tanpa perangkat khusus."
        />
      </div>
      <ol className="flex list-none flex-col gap-2.5">
        {steps.map((step) => (
          <li key={step.index}>
            <Card>
              <CardContent className="flex items-start gap-3.5 p-4">
                <span
                  aria-hidden="true"
                  className="font-heading text-3xl font-bold tracking-tight text-primary"
                >
                  {step.index}
                </span>
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[15px] font-bold">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
