import { ImageResponse } from "next/og";

export const alt = "Mesora: one link, every friend's agent, the fairest table in town";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colors are the IDENTITY.md key block values (ground, ink, accent, second).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#121010",
          color: "#f6f1ec",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, border: "6px solid #e8ff3a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: "#9b5cff" }} />
          </div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>Mesora</div>
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, color: "#e8ff3a" }}>Meet where nobody rides an hour.</div>
        <div style={{ fontSize: 30, maxWidth: 980 }}>
          One link for the group. Each friend&apos;s agent adds their limits, Mesora picks the fairest table. Location never leaves the browser.
        </div>
      </div>
    ),
    size
  );
}
