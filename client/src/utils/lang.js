// import franc from "franc-min";
import { franc } from "franc-min";
import langs from "langs";
import axios from "axios";

/** Detect language of given text.
 * @returns { iso2: "en", name: "English" } */
export const detectLanguage = (text = "") => {
  const code3 = franc(text);              // e.g. "hin"
  if (code3 === "und") return { iso2: "en", name: "English" }; // fall-back
  const lang = langs.where("3", code3);   // => { 1: "hi", name: "Hindi", … }
  return lang
    ? { iso2: lang["1"] || lang["2"], name: lang.name }
    : { iso2: "en", name: "English" };
};

/** Translate text with LibreTranslate (free demo server). */
export const translateText = async (text, sourceIso2, targetIso2) => {
  if (sourceIso2 === targetIso2) return text; // no need
  const { data } = await axios.post("https://libretranslate.de/translate", {
    q: text,
    source: sourceIso2,
    target: targetIso2,
    format: "text",
  });
  return data.translatedText;
};
