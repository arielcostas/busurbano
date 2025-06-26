import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import esES from "./locales/es-ES.json";
import glES from "./locales/gl-ES.json";
import enGB from "./locales/en-GB.json";

// Add more languages as needed
const resources = {
  "es-ES": { translation: esES },
  "gl-ES": { translation: glES },
  "en-GB": { translation: enGB },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es-ES",
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ["es-ES", "gl-ES", "en-GB"],
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["localStorage", "cookie"],
    },
  });

export default i18n;
