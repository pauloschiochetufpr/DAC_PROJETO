import svgContent from "../assets/pattern/waveSimpleRed.svg?raw";

export default function WaveSimpleRed({ className = "" }) {
  const svgClean = svgContent.replace(/<\?xml[\s\S]*?\?>\s*/i, "");

  const encoded = encodeURIComponent(svgClean)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  const dataUrl = `data:image/svg+xml;utf8,${encoded}`;

  const style = {
    backgroundImage: `url("${dataUrl}")`,
    backgroundRepeat: "repeat-y",
    backgroundSize: "100% auto",
    backgroundPosition: "left top",
  };

  return (
    <div
      className={`absolute inset-0 w-full h-full ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
