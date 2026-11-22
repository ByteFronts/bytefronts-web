import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "ByteFronts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const svg = (await readFile(path.join(process.cwd(), "public/bytefronts-logo.svg"), "utf8")).replace("#000000", "#f2f5f7");
  const logo = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 96, background: "#0b0f14", color: "#9aa6b2", fontSize: 40 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={720} height={163} alt="" />
        <div style={{ marginTop: 40 }}>Software that makes Minecraft more social.</div>
      </div>
    ),
    size,
  );
}
