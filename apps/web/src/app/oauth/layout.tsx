import type React from "react";

export const metadata = { title: "Connect to the authoring connector", robots: { index: false } };

export default function OAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f7f7f5", color: "#1c1c1a" }}>
        <main style={{ maxWidth: 480, margin: "10vh auto", padding: "0 16px" }}>{children}</main>
      </body>
    </html>
  );
}
