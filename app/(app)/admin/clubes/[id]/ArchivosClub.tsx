"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addDocumento, deleteDocumento, guardarFoto } from "../actions";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/Field";
import { ClubPhoto } from "@/components/ClubPhoto";
import { DOC_TIPOS, docTipoLabel } from "@/lib/clubes";
import type { ClubDocumento, ClubDocumentoTipo } from "@/lib/supabase/types";

const MAX_BYTES = 25 * 1024 * 1024;

function nombreSeguro(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-");
}

// Sube a Storage (bucket público `clubes`) con la sesión del admin; la política
// de Storage deja escribir solo a is_admin. Se sube directo desde el navegador
// porque los PDFs pueden pesar más que el límite de cuerpo de una función.
async function subirArchivo(clubId: string, file: File) {
  if (file.size > MAX_BYTES) return { error: "El archivo pesa más de 25 MB." };
  const supabase = createClient();
  const path = `${clubId}/${Date.now()}-${nombreSeguro(file.name)}`;
  const { error } = await supabase.storage
    .from("clubes")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) return { error: `No se pudo subir el archivo (${error.message}).` };
  const { data } = supabase.storage.from("clubes").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// Las fotos del celular suelen pesar varios MB (y en iPhone pueden venir en
// HEIC). Se reducen a JPEG de máximo 1600 px antes de subirlas: cargan rápido
// en la página y se ven en cualquier navegador. Si el navegador no puede
// leer la imagen, se sube tal cual.
async function prepararFoto(file: File): Promise<File> {
  const LADO_MAX = 1600;
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) return file;
    const base = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function ArchivosClub({
  clubId,
  nombre,
  fotoUrl,
  documentos,
  storageDisponible,
}: {
  clubId: string;
  nombre: string;
  fotoUrl: string | null;
  documentos: ClubDocumento[];
  storageDisponible: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [fotoEstado, setFotoEstado] = useState<{ tipo: "ok" | "error" | "info"; texto: string } | null>(null);
  const fotoRef = useRef<HTMLInputElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState<ClubDocumentoTipo>("estatutos");
  const [titulo, setTitulo] = useState("");
  const [enlace, setEnlace] = useState("");

  function avisar(res: { error?: string; ok?: string }) {
    setMensaje(res.error ? { tipo: "error", texto: res.error } : { tipo: "ok", texto: res.ok ?? "Listo." });
    if (!res.error) router.refresh();
  }

  // Al elegir la foto se sube de inmediato (no hay un segundo paso).
  function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
      setFotoEstado({ tipo: "error", texto: "Ese archivo no es una imagen." });
      return;
    }
    setFotoEstado({ tipo: "info", texto: "Subiendo foto..." });
    startTransition(async () => {
      try {
        const lista = await prepararFoto(file);
        const subida = await subirArchivo(clubId, lista);
        if (subida.error || !subida.url) {
          setFotoEstado({ tipo: "error", texto: subida.error ?? "No se pudo subir la foto." });
          return;
        }
        const res = await guardarFoto(clubId, subida.url);
        if (res.error) {
          setFotoEstado({ tipo: "error", texto: res.error });
          return;
        }
        setFotoEstado({ tipo: "ok", texto: "Foto actualizada." });
        router.refresh();
      } catch (err) {
        console.error("[foto] error al subir:", err);
        setFotoEstado({
          tipo: "error",
          texto: "No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo.",
        });
      }
    });
  }

  function agregarDocumento(e: React.FormEvent) {
    e.preventDefault();
    const file = archivoRef.current?.files?.[0];
    if (!file && !enlace.trim()) {
      return avisar({ error: "Sube un archivo o pega un enlace al documento." });
    }
    startTransition(async () => {
      let url = enlace.trim();
      let storagePath: string | null = null;
      if (file) {
        const subida = await subirArchivo(clubId, file);
        if ("error" in subida) return avisar({ error: subida.error });
        url = subida.url;
        storagePath = subida.path;
      }
      const res = await addDocumento({
        clubId,
        tipo,
        titulo: titulo || file?.name.replace(/\.[^.]+$/, "") || "",
        url,
        storagePath,
      });
      avisar(res);
      if (!res.error) {
        setTitulo("");
        setEnlace("");
        if (archivoRef.current) archivoRef.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 font-semibold text-swf-verde">Foto del club</h2>
        <div className="flex flex-wrap items-center gap-5">
          <div className="aspect-[4/3] w-48 overflow-hidden rounded-xl ring-1 ring-swf-verde/10">
            <ClubPhoto nombre={nombre} fotoUrl={fotoUrl} />
          </div>
          {storageDisponible ? (
            <div className="space-y-2 text-sm">
              <input
                ref={fotoRef}
                type="file"
                accept="image/*"
                aria-label="Elegir foto del club"
                className="sr-only"
                tabIndex={-1}
                onChange={subirFoto}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => fotoRef.current?.click()}
              >
                {pending && fotoEstado?.tipo === "info" ? "Subiendo..." : fotoUrl ? "Cambiar foto" : "Subir foto"}
              </Button>
              <p className="text-xs text-swf-verde/50">JPG, PNG o foto del celular. Se ajusta sola al tamaño.</p>
              {fotoEstado ? (
                <p
                  role="status"
                  className={
                    fotoEstado.tipo === "error"
                      ? "text-sm text-red-700"
                      : fotoEstado.tipo === "ok"
                        ? "text-sm text-green-800"
                        : "text-sm text-swf-verde/70"
                  }
                >
                  {fotoEstado.texto}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="max-w-sm text-sm text-swf-verde/60">
              La carga de archivos usa Supabase Storage y no está disponible en el modo demo. Pega
              el enlace de una imagen en el formulario de abajo.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-swf-verde">Estatutos y reglamentos</h2>
        {documentos.length === 0 ? (
          <p className="mb-4 text-sm text-swf-verde/60">Aún no hay documentos cargados para este club.</p>
        ) : (
          <ul className="mb-5 space-y-2">
            {documentos.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-swf-crema px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <Badge>{docTipoLabel(d.tipo)}</Badge>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-swf-verde underline decoration-swf-dorado underline-offset-2"
                  >
                    {d.titulo}
                  </a>
                </div>
                <form action={deleteDocumento}>
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className="text-xs text-red-700 underline">
                    Quitar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={agregarDocumento} className="space-y-3 rounded-md border border-swf-verde/15 p-4">
          <p className="text-sm font-medium text-swf-verde">Agregar documento</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <FormField label="Tipo" htmlFor="doc_tipo">
              <Select
                id="doc_tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as ClubDocumentoTipo)}
              >
                {DOC_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Título" htmlFor="doc_titulo">
              <Input
                id="doc_titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Estatutos 2024"
              />
            </FormField>
          </div>
          {storageDisponible ? (
            <FormField label="Archivo (PDF o imagen, hasta 25 MB)" htmlFor="doc_archivo">
              <input
                id="doc_archivo"
                ref={archivoRef}
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                className="block text-sm text-swf-verde"
              />
            </FormField>
          ) : null}
          <FormField
            label={storageDisponible ? "…o enlace al documento (Drive, sitio del club)" : "Enlace al documento (Drive, sitio del club)"}
            htmlFor="doc_enlace"
          >
            <Input
              id="doc_enlace"
              type="url"
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              placeholder="https://…"
            />
          </FormField>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Agregar documento"}
          </Button>
        </form>

        {mensaje ? (
          <p className={mensaje.tipo === "error" ? "mt-3 text-sm text-red-700" : "mt-3 text-sm text-green-800"}>
            {mensaje.texto}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
