import Image from "next/image";
import { hasBrandFile } from "@/lib/brand-files";
import { cn } from "@/lib/utils";

interface SceneSlotProps {
  n: 1 | 2 | 3 | 4 | 5 | 6;
  /** What the picture shows (not the section it sits in). */
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * One illustration slot. An uploaded public/brand/scene-{n}.png wins (optimized by
 * next/image); otherwise the hand-drawn SVG at public/illustrations/scene-{n}.svg
 * renders unoptimized, since next/image does not resize SVG. Call it with literal
 * values (n, alt, width, height): the image prompts are written from these tags.
 */
export function SceneSlot({ n, alt, width, height, className }: SceneSlotProps) {
  const raster = hasBrandFile(`scene-${n}`);
  const src = raster ? `/brand/scene-${n}.png` : `/illustrations/scene-${n}.svg`;
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={n === 1}
      unoptimized={!raster}
      sizes="(min-width: 1024px) 50vw, 100vw"
      className={cn("h-auto w-full max-w-full", className)}
    />
  );
}
