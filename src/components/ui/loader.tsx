import type { CSSProperties } from "react";

type ThreeBodyLoaderProps = {
  size?: number;
  speedMs?: number;
  color?: string;
  className?: string;
  label?: string;
};

export function ThreeBodyLoader({
  size,
  speedMs,
  color,
  className = "",
  label = "Lädt",
}: ThreeBodyLoaderProps) {
  const style: CSSProperties = {};
  if (size) {
    (style as Record<string, string>)["--uib-size"] = `${size}px`;
  }
  if (speedMs) {
    (style as Record<string, string>)["--uib-speed"] = `${speedMs}ms`;
  }
  if (color) {
    (style as Record<string, string>)["--uib-color"] = color;
  }
  return (
    <div
      className={`three-body ${className}`}
      style={style}
      role="status"
      aria-label={label}
    >
      <div className="three-body__dot" />
      <div className="three-body__dot" />
      <div className="three-body__dot" />
    </div>
  );
}
