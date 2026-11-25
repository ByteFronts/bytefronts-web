import { minecraftHead } from "@/lib/profile";

// Avatar with a colored circle fallback. Plain <img>: sources are external (Discord CDN, mc-heads.net).
export default function Avatar({
  source,
  discordUrl,
  minecraftName,
  size = 36,
  className = "",
}: {
  source: string;
  discordUrl: string | null;
  minecraftName?: string;
  size?: number;
  className?: string;
}) {
  const src = source === "minecraft" ? minecraftHead(minecraftName ?? "") : discordUrl;
  const style = { width: size, height: size };
  if (!src) {
    return <span aria-hidden className={`inline-block shrink-0 notch bg-discord ${className}`} style={style} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className={`shrink-0 notch bg-discord object-cover ${className}`}
      style={style}
    />
  );
}
