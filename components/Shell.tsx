import { CSSProperties, ReactNode } from "react";

// The design width is 412px. Everything above that is a centred column on the
// sand background. The phone bezel from the prototype is deliberately not shipped.
const outer: CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  background: "var(--sand)",
};

const inner: CSSProperties = {
  width: "100%",
  maxWidth: 412,
  minHeight: "100dvh",
  background: "var(--cream)",
  display: "flex",
  flexDirection: "column",
  position: "relative",
};

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div style={outer}>
      <div style={inner}>{children}</div>
    </div>
  );
}
