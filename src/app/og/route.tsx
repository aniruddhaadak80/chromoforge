import { ImageResponse } from "next/og";

// Note: no route segment config here — Next 16's cacheComponents rejects the
// edge runtime in route handlers, and `size`/`contentType` are file-convention
// exports for opengraph-image.tsx, not route handlers. next/og runs on nodejs.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "chromoforge";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#070b12",
          padding: 72,
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", color: "#38e8b0", fontSize: 30, letterSpacing: 8 }}>
          SYNTHETIC BIOLOGY LAB
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 800, color: "#e8eefc", lineHeight: 1.05 }}>
            {title}
          </div>
          <div style={{ fontSize: 44, color: "#8ba3c7", marginTop: 16 }}>
            Design life for worlds we know exist.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["real NASA data", "zero API keys", "deterministic sim"].map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                border: "2px solid #1b2942",
                borderRadius: 999,
                padding: "10px 24px",
                color: "#7dd3fc",
                fontSize: 26,
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
