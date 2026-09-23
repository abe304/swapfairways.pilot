"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Club } from "@/lib/supabase/types";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function labelFor(club: Club) {
  return `${club.nombre}${club.estado ? ` — ${club.estado}` : ""}`;
}

export function ClubCombobox({
  clubs,
  defaultValue,
  required,
  name = "club_id",
  emptyOptionLabel,
  onSelect,
  presetClub,
}: {
  clubs: Club[];
  defaultValue?: string | null;
  required?: boolean;
  name?: string;
  /** Si se da, agrega una primera opción para limpiar la selección (ej. "Todos los clubes"). */
  emptyOptionLabel?: string;
  /** Se llama con el club completo cuando el usuario elige uno de la lista. */
  onSelect?: (club: Club) => void;
  /** Selecciona este club desde afuera (ej. un botón de acceso rápido). Pasa un objeto nuevo cada vez, incluso para el mismo club, para que se vuelva a aplicar. */
  presetClub?: Club | null;
}) {
  const defaultClub = clubs.find((c) => c.id === defaultValue);
  const [query, setQuery] = useState(defaultClub ? labelFor(defaultClub) : "");
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () =>
      [...clubs].sort((a, b) => {
        const estadoCmp = (a.estado ?? "").localeCompare(b.estado ?? "", "es");
        if (estadoCmp !== 0) return estadoCmp;
        return a.nombre.localeCompare(b.nombre, "es");
      }),
    [clubs],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return sorted;
    return sorted.filter(
      (c) => normalize(c.nombre).includes(q) || normalize(c.estado ?? "").includes(q),
    );
  }, [sorted, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // presetClub es un comando imperativo desde afuera (ej. un botón de
    // "mis clubes"), no un valor derivado de props — cada click pasa un
    // objeto nuevo a propósito para que este efecto se vuelva a disparar.
    if (presetClub) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(presetClub.id);
      setQuery(labelFor(presetClub));
      onSelect?.(presetClub);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetClub]);

  function selectClub(c: Club) {
    setSelectedId(c.id);
    setQuery(labelFor(c));
    setOpen(false);
    onSelect?.(c);
  }

  function clearSelection() {
    setSelectedId("");
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Busca por nombre de club o estado..."
        className="w-full rounded-md border border-swf-verde/20 bg-white px-3 py-2 text-sm text-swf-verde placeholder:text-swf-verde/40 focus:border-swf-dorado focus:outline-none"
        autoComplete="off"
      />
      <input type="hidden" name={name} value={selectedId} />
      {required && !selectedId ? (
        <p className="mt-1 text-xs text-swf-verde/50">Elige un club de la lista.</p>
      ) : null}
      {open ? (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-swf-verde/20 bg-white shadow-lg">
          {emptyOptionLabel ? (
            <li>
              <button
                type="button"
                onClick={clearSelection}
                className="block w-full px-3 py-2 text-left text-sm text-swf-verde/70 hover:bg-swf-verde/5"
              >
                {emptyOptionLabel}
              </button>
            </li>
          ) : null}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-swf-verde/50">Sin resultados.</li>
          ) : (
            filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => selectClub(c)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-swf-verde/5"
                >
                  <span className="font-medium text-swf-verde">{c.nombre}</span>
                  <span className="text-swf-verde/60">
                    {" "}
                    — {c.estado}
                    {c.tipo === "publico" ? " · acceso público" : ""}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
