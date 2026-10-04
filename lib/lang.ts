import { cookies } from "next/headers";

export type Lang = "en" | "fr";

export function getLang(): Lang {
  try {
    const c = cookies().get("lang");
    return c?.value === "fr" ? "fr" : "en";
  } catch {
    return "en";
  }
}

export const t = (en: string, fr: string, lang: Lang): string =>
  lang === "fr" ? fr : en;
