import { Injectable } from "@angular/core";

const PREFIX = "game-apps:";

/** Preferencias tipadas sobre localStorage. Nunca lanza: en modo privado o sin cuota simplemente no persiste. */
@Injectable({ providedIn: "root" })
export class PreferencesService {
  public load<T>(key: string, fallback: T, guard?: (value: unknown) => value is T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      const parsed: unknown = JSON.parse(raw);
      if (guard && !guard(parsed)) return fallback;
      // Se mezclan los objetos para que campos nuevos tengan valor por defecto en datos antiguos.
      if (isRecord(fallback) && isRecord(parsed)) return { ...fallback, ...parsed } as T;
      return parsed as T;
    } catch {
      return fallback;
    }
  }

  public save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Sin almacenamiento disponible: el juego sigue, solo no recuerda.
    }
  }

  public remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // Ver save().
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
