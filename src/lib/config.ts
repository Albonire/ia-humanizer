/**
 * Configuración centralizada del frontend.
 *
 * Las URLs se resuelven así:
 *  - En desarrollo: "/api/..." -> Vite proxy (ver vite.config.ts) hacia el backend local.
 *  - En producción: import.meta.env.VITE_API_URL si está definido; si no, mismo origen.
 */
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export const apiUrl = (path: string): string => `${API_BASE}${path}`;

/** Clave de RapidAPI para Smodin, inyectada en tiempo de build vía .env.local (NUNCA hardcodear). */
export const RAPIDAPI_SMODIN_KEY: string =
  (import.meta.env.VITE_RAPIDAPI_SMODIN_KEY as string | undefined) ?? "";
