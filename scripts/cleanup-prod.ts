
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CODE_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".json", ".css", ".scss", ".md", ".yml", ".yaml", ".html",
]);
const IGNORE_DIRS = new Set([
  "node_modules", ".next", "dist", "build", ".git", ".turbo", ".vercel", ".vscode", ".idea", "__pycache__", "dev"
]);

const todoLine = /(^\s*\/\/\s*(?:TODO|FIXME|HACK).*$)|(^\s*#\s*(?:TODO|FIXME|HACK).*$)/gim;
const blockComment = /\/\*[\s\S]*?\*\//g;    // strip blocks that contain TODO/FIXME/HACK
const commentedConsole = /^\s*\/\/\s*console\.(?:log|debug|info)\s*\(.*?\)\s*;?\s*$/gim;
const consoleDev = /^\s*console\.(?:log|debug|info)\s*\([^)\n]*(mock|sample|test|debug|todo|fixme)[^)\n]*\)\s*;?\s*$/gim;

const placeholders: Array<[RegExp, string]> = [
  [/Sample Doctor/gi, ""],
  [/Mock Transcript/gi, ""],
  [/Demo User/gi, ""],
  [/Sample Text/gi, ""],
  [/Enter doctor ID/gi, ""],
  [/Enter\s+Doctor\s+ID/gi, ""],
];

function isIgnoredDir(dir: string) {
  const base = path.basename(dir);
  if (IGNORE_DIRS.has(base)) return true;
  if (base.startsWith(".cache")) return true;
  return false;
}

function *walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (isIgnoredDir(full)) continue;
      yield *walk(full);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (CODE_EXTS.has(ext)) yield full;
    }
  }
}

function removeTodoBlocks(text: string): string {
  return text.replace(blockComment, (block) => (/(TODO|FIXME|HACK)/i.test(block) ? "" : block));
}

function normalizeBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n");
}

