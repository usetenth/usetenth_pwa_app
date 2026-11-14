"use client";

// Replaces the whole page when even the layout fails, so it carries its own styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7fb", color: "#12131a", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 32 }}>
        <div style={{ maxWidth: 360 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#6b6d7b", marginTop: 8 }}>usetenth hit a problem it could not recover from. Try again, and if it keeps happening, come back in a moment.</p>
          <button onClick={reset} style={{ marginTop: 24, height: 52, width: "100%", border: 0, borderRadius: 999, background: "#5b3df5", color: "#fff", fontSize: 16, fontWeight: 600 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
