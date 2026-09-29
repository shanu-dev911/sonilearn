export function cleanOptionText(text: string): string {
  if (!text) return "";
  return text
    .replace(/^[\(\[]?[A-Da-d1-4](?:[\)\.\:\-\]]|\s)+\s*/, "")
    .trim();
}

export function cleanOptionTranslation(translation: string, english: string): string {
  const cleanedTranslation = cleanOptionText(translation || "");
  if (!cleanedTranslation) return "";

  const normalize = (text: string) => text.replace(/\s+/g, " ").trim().toLocaleLowerCase();
  return normalize(cleanedTranslation) === normalize(english) ? "" : cleanedTranslation;
}