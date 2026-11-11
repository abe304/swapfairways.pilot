// Ilustración de la portada, en el mismo estilo plano que la casa club de las
// tarjetas: dos socios en carrito de golf rumbo al fairway, con la casa club
// a lo lejos y los volcanes de fondo. Se ancla abajo (xMidYMax slice): lo
// importante vive entre x≈220 y x≈1000 para que se vea en pantallas anchas.

function Carrito() {
  const piel = "#c99a6e";
  return (
    <g>
      {/* Sombra y líneas de velocidad */}
      <ellipse cx="88" cy="2" rx="96" ry="7" fill="#0e2b20" fillOpacity="0.28" />
      <g stroke="#faf8f5" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round">
        <line x1="-62" y1="-30" x2="-22" y2="-30" />
        <line x1="-48" y1="-54" x2="-18" y2="-54" />
        <line x1="-70" y1="-78" x2="-34" y2="-78" />
      </g>

      {/* Bolsa de palos atrás */}
      <g stroke="#faf8f5" strokeWidth="3" strokeLinecap="round">
        <line x1="2" y1="-92" x2="-6" y2="-110" />
        <line x1="8" y1="-92" x2="8" y2="-114" />
        <line x1="13" y1="-92" x2="20" y2="-108" />
      </g>
      <rect x="-6" y="-96" width="24" height="56" rx="7" fill="#0e2b20" />
      <rect x="-6" y="-80" width="24" height="5" fill="#c5a059" />

      {/* Postes y techo */}
      <line x1="24" y1="-52" x2="30" y2="-124" stroke="#d9cdb6" strokeWidth="5" />
      <path d="M134 -40 L118 -124" stroke="#d9cdb6" strokeWidth="5" />
      <path d="M126 -48 L114 -118 L118 -124 L132 -42Z" fill="#cfe3e8" fillOpacity="0.35" />
      <rect x="14" y="-134" width="126" height="13" rx="5" fill="#c5a059" />
      <rect x="14" y="-124" width="126" height="3" fill="#8a6b2f" fillOpacity="0.5" />

      {/* Pasajero (atrás) */}
      <rect x="50" y="-86" width="26" height="38" rx="11" fill="#f1d9a0" />
      <circle cx="64" cy="-98" r="11" fill={piel} />
      <path d="M53 -100 Q54 -113 65 -112 Q75 -111 75 -101Z" fill="#faf8f5" />
      <path d="M72 -102 L84 -100" stroke="#faf8f5" strokeWidth="4" strokeLinecap="round" />
      <path d="M70 -74 Q82 -66 88 -58" stroke={piel} strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* Conductor (adelante) */}
      <rect x="84" y="-84" width="26" height="36" rx="11" fill="#8fb8a0" />
      <circle cx="98" cy="-96" r="11" fill={piel} />
      <path d="M87 -98 Q88 -111 99 -110 Q109 -109 109 -99Z" fill="#0e2b20" />
      <path d="M106 -100 L118 -98" stroke="#0e2b20" strokeWidth="4" strokeLinecap="round" />
      <path d="M104 -72 Q114 -66 122 -64" stroke={piel} strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* Volante */}
      <line x1="114" y1="-48" x2="124" y2="-66" stroke="#0e2b20" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="124" cy="-66" rx="3" ry="8" fill="#0e2b20" transform="rotate(25 124 -66)" />

      {/* Carrocería */}
      <path d="M6 -24 L6 -52 L80 -52 L86 -42 L120 -42 Q152 -42 170 -24Z" fill="#faf8f5" />
      <rect x="40" y="-56" width="74" height="6" rx="3" fill="#0e2b20" fillOpacity="0.75" />
      <rect x="6" y="-28" width="164" height="6" fill="#d9cdb6" />
      <circle cx="160" cy="-34" r="3.5" fill="#c5a059" />

      {/* Llantas */}
      <circle cx="38" cy="-14" r="16" fill="#1c2b24" />
      <circle cx="38" cy="-14" r="6.5" fill="#d9cdb6" />
      <circle cx="138" cy="-14" r="16" fill="#1c2b24" />
      <circle cx="138" cy="-14" r="6.5" fill="#d9cdb6" />
    </g>
  );
}

function CasaClubLejana() {
  return (
    <g>
      <rect x="-30" y="-20" width="22" height="14" fill="#efe7d8" />
      <path d="M-33 -19 L-19 -28 L-5 -19Z" fill="#a8843f" />
      <rect x="-10" y="-30" width="46" height="24" fill="#faf8f5" />
      <path d="M-15 -29 L13 -46 L41 -29Z" fill="#c5a059" />
      <rect x="9" y="-20" width="8" height="14" fill="#0e2b20" fillOpacity="0.6" />
      <g fill="#c5a059">
        <rect x="-5" y="-24" width="6" height="6" />
        <rect x="25" y="-24" width="6" height="6" />
      </g>
      <line x1="13" y1="-46" x2="13" y2="-58" stroke="#faf8f5" strokeWidth="1.2" />
      <path d="M13 -58 L21 -55.5 L13 -53Z" fill="#c5a059" />
    </g>
  );
}

export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMax slice"
      // En celular la escena es una franja abajo; desde sm ocupa todo el fondo.
      className="pointer-events-none absolute inset-x-0 bottom-0 h-60 w-full [mask-image:linear-gradient(to_bottom,transparent,black_30%)] sm:inset-0 sm:h-full sm:[mask-image:none]"
      aria-hidden
    >
      <defs>
        <linearGradient id="hero-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24503a" />
          <stop offset="0.7" stopColor="#6f9f81" />
          <stop offset="1" stopColor="#a9c9a9" />
        </linearGradient>
        <radialGradient id="hero-sol" cx="900" cy="120" r="320" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f6e2b0" stopOpacity="0.8" />
          <stop offset="0.35" stopColor="#e8c98a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#e8c98a" stopOpacity="0" />
        </radialGradient>
        {/* Oscurece el lado del texto para que se siga leyendo bien */}
        <linearGradient id="hero-lectura" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0e2b20" stopOpacity="0.75" />
          <stop offset="0.6" stopColor="#0e2b20" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hero-arriba" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e2b20" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="#0e2b20" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1200" height="420" fill="url(#hero-cielo)" />
      <rect width="1200" height="420" fill="url(#hero-sol)" />
      <circle cx="900" cy="120" r="44" fill="#f3dca6" />

      {/* Nubes */}
      <g fill="#faf8f5" fillOpacity="0.75">
        <path d="M700 92 q10 -18 30 -10 q14 -16 32 0 q18 0 16 14 h-84 q-4 -6 6 -4z" />
        <path d="M1010 168 q8 -14 24 -8 q12 -12 26 0 q14 0 12 11 h-68 q-2 -5 6 -3z" />
      </g>

      {/* Volcanes a lo lejos */}
      <path
        d="M560 270 L700 196 Q716 188 732 196 L800 236 L860 214 Q880 204 900 216 L1060 280 Z"
        fill="#b9d2c0"
        fillOpacity="0.7"
      />
      <path d="M700 196 Q716 188 732 196 L722 204 L712 198 L704 205Z" fill="#faf8f5" fillOpacity="0.8" />
      <path d="M860 214 Q880 204 900 216 L890 221 L880 215 L870 222Z" fill="#faf8f5" fillOpacity="0.8" />

      {/* Lomas lejanas con árboles y la casa club */}
      <path d="M0 280 Q220 232 460 262 T900 250 T1200 262 V420 H0Z" fill="#7fae8f" />
      <g fill="#4f876a">
        <circle cx="236" cy="252" r="13" /><circle cx="252" cy="244" r="17" /><circle cx="270" cy="252" r="12" />
        <circle cx="796" cy="248" r="12" /><circle cx="812" cy="240" r="16" /><circle cx="830" cy="248" r="11" />
        <circle cx="934" cy="246" r="10" /><circle cx="948" cy="240" r="13" />
      </g>
      <g transform="translate(872 254)">
        <CasaClubLejana />
      </g>

      <path d="M0 312 Q260 266 560 300 T1200 292 V420 H0Z" fill="#5c9874" />

      {/* Fairway con franjas de corte que lleva al green */}
      <path d="M0 345 Q300 300 640 330 T1200 318 V420 H0Z" fill="#4a8a64" />
      <path d="M300 420 Q520 340 860 316 L980 318 Q700 352 520 420Z" fill="#7fbb92" fillOpacity="0.5" />
      <path d="M420 420 Q600 350 880 318 L940 318 Q720 356 600 420Z" fill="#7fbb92" fillOpacity="0.35" />

      {/* Green con bandera y bunker */}
      <ellipse cx="912" cy="322" rx="64" ry="10" fill="#93cba3" />
      <ellipse cx="826" cy="334" rx="34" ry="5.5" fill="#eadfc4" />
      <line x1="930" y1="250" x2="930" y2="322" stroke="#faf8f5" strokeWidth="2.5" />
      <path d="M930 250 L966 262 L930 274Z" fill="#c5a059" />
      <ellipse cx="930" cy="323" rx="5" ry="1.6" fill="#0e2b20" fillOpacity="0.6" />

      {/* Camino del carrito */}
      <path d="M180 420 Q420 372 640 382 T1000 356 L1000 366 Q820 380 650 396 T260 420Z" fill="#e8dcc0" fillOpacity="0.8" />

      <path d="M0 400 Q260 374 520 404 L500 420 H0Z" fill="#3d7a57" />
      <path d="M840 420 Q1000 380 1200 390 V420Z" fill="#3d7a57" />

      {/* Árboles en primer plano */}
      <g fill="#2e6748">
        <circle cx="150" cy="352" r="30" /><circle cx="186" cy="336" r="36" /><circle cx="222" cy="356" r="26" />
        <circle cx="1040" cy="340" r="28" /><circle cx="1072" cy="326" r="34" /><circle cx="1104" cy="348" r="24" />
      </g>
      <rect x="182" y="370" width="8" height="26" fill="#5c4a1f" />
      <rect x="1068" y="358" width="8" height="30" fill="#5c4a1f" />

      {/* El carrito con los dos socios, rumbo al fairway */}
      <g transform="translate(580 398) scale(0.78)">
        <Carrito />
      </g>

      <rect width="1200" height="420" fill="url(#hero-arriba)" />
      <rect width="1200" height="420" fill="url(#hero-lectura)" />
    </svg>
  );
}
