import type { CinematicAsset } from "@/lib/cinematic";

export function CinematicPicture({
  asset,
  className,
  eager = false,
  decorative = false
}: {
  asset: CinematicAsset;
  className?: string;
  eager?: boolean;
  decorative?: boolean;
}) {
  return (
    <picture className={className}>
      <source
        media="(max-width: 480px)"
        type="image/avif"
        srcSet={`${asset.mobileBase}-600.avif`}
      />
      <source
        media="(max-width: 480px)"
        type="image/webp"
        srcSet={`${asset.mobileBase}-600.webp`}
      />
      <source
        media="(min-width: 481px) and (max-width: 767px)"
        type="image/avif"
        srcSet={`${asset.mobileBase}-600.avif 600w, ${asset.mobileBase}-900.avif 900w`}
        sizes="100vw"
      />
      <source
        media="(min-width: 481px) and (max-width: 767px)"
        type="image/webp"
        srcSet={`${asset.mobileBase}-600.webp 600w, ${asset.mobileBase}-900.webp 900w`}
        sizes="100vw"
      />
      <source
        type="image/avif"
        srcSet={`${asset.desktopBase}-768.avif 768w, ${asset.desktopBase}-1280.avif 1280w, ${asset.desktopBase}-1672.avif 1672w`}
        sizes="100vw"
      />
      <source
        type="image/webp"
        srcSet={`${asset.desktopBase}-768.webp 768w, ${asset.desktopBase}-1280.webp 1280w, ${asset.desktopBase}-1672.webp 1672w`}
        sizes="100vw"
      />
      <img
        src={asset.poster}
        alt={decorative ? "" : asset.alt}
        aria-hidden={decorative || undefined}
        width={asset.width}
        height={asset.height}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        style={{ objectPosition: asset.focalPoint }}
      />
    </picture>
  );
}
