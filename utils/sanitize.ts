export function sanitizeExportFilename(name: string) {
  const cleaned = (name || "")
    .replace(/mock|sample/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "transcript";
}
