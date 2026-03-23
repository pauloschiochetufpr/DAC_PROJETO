export function MetalSurface({ children, className = "", variant = "top" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* BASE */}
      <div className="absolute inset-0 bg-secundary" />

      {/* VOLUME */}
      <div
        className={`absolute inset-0 ${
          variant === "top"
            ? "bg-[linear-gradient(to_bottom,#00000030,transparent_40%,#ffffff10_60%,#00000040)]"
            : "bg-[linear-gradient(to_top,#00000040,transparent_40%,#ffffff10_60%,#00000030)]"
        }`}
      />

      {/* HIGHLIGHT */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_10%,rgba(255,255,255,0.25)_30%,rgba(255,255,255,0.35)_50%,rgba(255,255,255,0.25)_70%,transparent_90%)]" />

      {/* BORDAS */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.35),transparent_30%,transparent_70%,rgba(0,0,0,0.35))]" />

      {children}
    </div>
  );
}
