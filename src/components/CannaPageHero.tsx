import Link from "next/link";
import CannaLeafPattern from "@/components/CannaLeafPattern";

type CannaPageHeroProps = {
  title: string;
  description: string;
  badge?: string;
  backHref?: string;
  backLabel?: string;
};

export default function CannaPageHero({
  title,
  description,
  badge,
  backHref,
  backLabel,
}: CannaPageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-[#C6C6C6]/60 bg-gradient-to-br from-[#F7F4E7] via-white to-[#F3EFA1]/70">
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#00CF7B]/20 blur-3xl" />

      <CannaLeafPattern className="absolute -bottom-20 right-4 h-80 w-80 rotate-12 text-[#08553F]/5" />

      <CannaLeafPattern className="absolute bottom-12 right-72 hidden h-44 w-44 -rotate-12 text-[#00CF7B]/10 lg:block" />

      <CannaLeafPattern className="absolute top-10 right-40 hidden h-28 w-28 rotate-[22deg] text-[#08553F]/5 xl:block" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap gap-4">
          {backHref && backLabel && (
            <Link
              href={backHref}
              className="inline-flex items-center rounded-full border border-[#08553F]/20 bg-white px-5 py-3 text-sm font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              ← {backLabel}
            </Link>
          )}

          {badge && (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F3EFA1] px-5 py-3 text-sm font-bold text-[#08553F] shadow-sm">
              <span>🌿</span>
              {badge}
            </span>
          )}
        </div>

        <h1 className="mt-8 max-w-4xl text-4xl font-extrabold tracking-tight text-[#08553F] md:text-6xl">
          {title}
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#878787]">
          {description}
        </p>
      </div>
    </section>
  );
}