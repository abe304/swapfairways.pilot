"""Genera las tres publicaciones de Instagram (HTML 1080x1350) a partir de los
SVG de docs/marca/svg. Después se pasan a PNG con Chrome (ver LEEME.md).

    python3 docs/marca/instagram/generar.py
"""
from pathlib import Path
import re

AQUI = Path(__file__).resolve().parent
SVG = AQUI.parent / "svg"


def svg(nombre: str) -> str:
    s = (SVG / f"{nombre}.svg").read_text()
    s = re.sub(r"<\?xml[^>]*\?>\s*", "", s)
    # Quita el tamaño fijo para que el CSS decida.
    return re.sub(r'^<svg([^>]*?) width="\d+" height="\d+"', r"<svg\1", s, count=1)


golfista_verde = svg("simbolo-golfista-fondo-verde")
golfista_crema = svg("simbolo-golfista-fondo-crema")
portada = svg("ilustracion-portada-carrito-sin-sombreado").replace(
    "<svg ", '<svg preserveAspectRatio="xMidYMax slice" ', 1
)
casa = svg("ilustracion-casa-club-2").replace("<svg ", '<svg preserveAspectRatio="xMidYMax slice" ', 1)

BASE = """<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@1,500&display=swap" rel="stylesheet">
<style>
  :root { --verde:#0e2b20; --dorado:#c5a059; --crema:#faf8f5; }
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { width:1080px; height:1350px; overflow:hidden; }
  body { font-family:'Geist', sans-serif; -webkit-font-smoothing:antialiased; }
  .lienzo { position:relative; width:1080px; height:1350px; overflow:hidden; }
  .marca { font-size:34px; letter-spacing:1px; }
  .marca .swap { font-weight:300; }
  .marca .fw { font-weight:500; color:var(--dorado); }
  .etiqueta { font-size:24px; font-weight:500; letter-spacing:.42em; text-transform:uppercase; color:var(--dorado); }
  .serif { font-family:'Cormorant Garamond', serif; font-style:italic; font-weight:500; }
  svg { display:block; }
  %CSS%
</style></head>
<body><div class="lienzo">%HTML%</div></body></html>
"""


def pagina(nombre: str, css: str, html: str) -> None:
    (AQUI / f"{nombre}.html").write_text(BASE.replace("%CSS%", css).replace("%HTML%", html))
    print("  ", nombre)


# 1. Muy pronto: solo el logo, mucho aire.
pagina(
    "1-muy-pronto",
    """
    .lienzo { background:radial-gradient(ellipse 70% 40% at 50% 100%, #1d4a37 0%, var(--verde) 70%); color:var(--crema); }
    .marco { position:absolute; inset:44px; border:1px solid rgba(197,160,89,.45); }
    .marco::after { content:''; position:absolute; inset:10px; border:1px solid rgba(197,160,89,.18); }
    .centro { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
    .golfista { width:300px; margin-bottom:56px; }
    .golfista svg rect { fill:transparent; }
    .golfista svg g { stroke-width:.45; }
    .marca { font-size:88px; letter-spacing:2px; }
    .linea { width:90px; height:1px; background:var(--dorado); margin:46px 0 40px; }
    .pronto { font-size:96px; color:var(--crema); line-height:1; margin-top:22px; }
    .pie { position:absolute; left:0; right:0; bottom:96px; text-align:center; font-size:26px; font-weight:300; letter-spacing:.06em; color:rgba(250,248,245,.7); }
    """,
    f"""
    <div class="marco"></div>
    <div class="centro">
      <div class="golfista">{golfista_verde}</div>
      <div class="marca"><span class="swap">Swap</span><span class="fw">Fairways</span></div>
      <div class="linea"></div>
      <div class="etiqueta">Ya viene</div>
      <div class="pronto serif">Muy pronto</div>
    </div>
    <div class="pie">La red de socios de clubes de golf de México</div>
    """,
)

# 2. Lista de espera: visita la página y anótate.
pagina(
    "2-lista-de-espera",
    """
    .lienzo { background:linear-gradient(180deg, var(--verde) 0%, #163d2d 55%, #24503a 100%); color:var(--crema); }
    .arriba { position:absolute; top:76px; left:84px; right:84px; display:flex; align-items:center; gap:16px; }
    .arriba .golfista { width:52px; }
    .arriba svg rect { fill:transparent; }
    .texto { position:absolute; top:220px; left:84px; right:84px; }
    h1 { font-size:92px; font-weight:500; line-height:1.04; letter-spacing:-1.5px; margin:26px 0 30px; }
    h1 em { font-family:'Cormorant Garamond', serif; font-weight:500; color:var(--dorado); font-size:104px; letter-spacing:0; }
    p { font-size:34px; font-weight:300; line-height:1.4; color:rgba(250,248,245,.82); max-width:820px; }
    .boton { display:inline-flex; align-items:center; gap:18px; margin-top:44px; background:var(--dorado); color:var(--verde); font-size:34px; font-weight:600; padding:24px 40px; border-radius:999px; }
    .escena { position:absolute; left:0; right:0; bottom:0; height:520px; }
    .escena svg { width:100%; height:100%; }
    .escena::before { content:''; position:absolute; inset:0 0 auto 0; height:140px; background:linear-gradient(#163d2d, transparent); z-index:1; }
    """,
    f"""
    <div class="arriba"><div class="golfista">{golfista_verde}</div><div class="marca"><span class="swap">Swap</span><span class="fw">Fairways</span></div></div>
    <div class="texto">
      <div class="etiqueta">Lista de espera</div>
      <h1>Solo por<br><em>invitación</em></h1>
      <p>Visita la página y anótate en la lista de espera. Te avisamos en cuanto tengas tu lugar.</p>
      <div class="boton">swapfairways.com <span>→</span></div>
    </div>
    <div class="escena">{portada}</div>
    """,
)

# 3. Curiosidad: ¿y si tu club fuera la llave para jugar en otros?
pagina(
    "3-conoce-mas",
    """
    .lienzo { background:var(--crema); color:var(--verde); }
    .tarjeta { position:absolute; top:70px; left:70px; right:70px; height:600px; border-radius:36px; overflow:hidden; box-shadow:0 30px 60px -30px rgba(14,43,32,.45); }
    .tarjeta svg { width:100%; height:100%; }
    .chip { position:absolute; top:28px; left:28px; background:rgba(14,43,32,.82); color:var(--crema); font-size:22px; letter-spacing:.3em; text-transform:uppercase; padding:14px 22px; border-radius:999px; }
    .texto { position:absolute; top:730px; left:90px; right:90px; }
    h1 { font-size:76px; font-weight:500; line-height:1.06; letter-spacing:-1.2px; }
    h1 em { font-family:'Cormorant Garamond', serif; color:#a8843f; font-size:86px; letter-spacing:0; }
    p { margin-top:28px; font-size:31px; font-weight:300; line-height:1.42; color:rgba(14,43,32,.75); }
    .pie { position:absolute; left:90px; right:90px; bottom:70px; display:flex; align-items:center; justify-content:space-between; border-top:1px solid rgba(14,43,32,.15); padding-top:30px; }
    .pie .logo { display:flex; align-items:center; gap:14px; }
    .pie .golfista { width:46px; }
    .pie svg rect { fill:transparent; }
    .pie .marca { font-size:32px; }
    .pie .marca .fw { color:#a8843f; }
    .pie .url { font-size:26px; font-weight:400; letter-spacing:.04em; color:rgba(14,43,32,.7); }
    """,
    f"""
    <div class="tarjeta">{casa}<div class="chip">Muy pronto</div></div>
    <div class="texto">
      <h1>¿Y si tu club fuera <em>la llave</em> para jugar en otros?</h1>
      <p>Recibe a un socio en tu club y juega como invitado en el suyo. Una red de socios de golf en México, con créditos y sin complicaciones.</p>
    </div>
    <div class="pie">
      <div class="logo"><div class="golfista">{golfista_crema}</div><div class="marca"><span class="swap">Swap</span><span class="fw">Fairways</span></div></div>
      <div class="url">Conoce más en swapfairways.com</div>
    </div>
    """,
)
