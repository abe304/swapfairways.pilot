// Video "¿Cómo funcionan los créditos?" (52 s). Se muestra en la home y en
// /creditos. Si cambian las reglas de créditos (lib/niveles.ts), hay que
// rehacer el video.
export function VideoCreditos() {
  return (
    <video
      className="aspect-video w-full rounded-2xl bg-swf-verde shadow-sm ring-1 ring-swf-verde/10"
      src="/video/swf-creditos.mp4"
      poster="/video/swf-creditos-portada.jpg"
      controls
      playsInline
      preload="none"
      aria-label="Video: cómo funcionan los créditos en SwapFairways"
    >
      Tu navegador no puede reproducir este video.{" "}
      <a href="/video/swf-creditos.mp4" className="underline">
        Descárgalo aquí
      </a>
      .
    </video>
  );
}
