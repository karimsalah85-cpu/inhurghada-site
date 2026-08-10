export default function ImageWatermark({ prominent = false }: { prominent?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-3 right-3 z-20 block aspect-[3/2] select-none bg-contain bg-no-repeat drop-shadow-[0_1px_3px_rgba(255,255,255,0.85)] ${
        prominent ? "w-[20%] min-w-24 max-w-44 opacity-85" : "w-[24%] min-w-20 max-w-36 opacity-80"
      }`}
      style={{ backgroundImage: "url('/images/daily-red-sea-watermark.png')" }}
    />
  );
}
