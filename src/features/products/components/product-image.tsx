import { Package } from "lucide-react";
import Image from "next/image";

export function ProductImage({ src, alt, size = 72 }: { src: string | null; alt: string; size?: number }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-[12px] border border-[var(--app-border)] bg-[var(--app-secondary-bg)]"
      style={{ width: size, height: size }}
    >
      {src ? <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-contain p-2" /> : <Package size={26} className="text-[var(--app-hint)]" aria-hidden />}
    </div>
  );
}
