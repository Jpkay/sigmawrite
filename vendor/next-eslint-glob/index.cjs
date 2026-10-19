"use strict";
/* eslint-disable @typescript-eslint/no-require-imports -- Next loads this compatibility package through CommonJS. */

const path = require("node:path");
const fs = require("node:fs");
const {globSync: tinyGlobSync} = require("tinyglobby");

// Narrow compatibility contract for Next's getRootDirs helper. This removes
// fast-glob's unpatched braces dependency (GHSA-vfj7-8cjw-p6xm). Tinyglobby's
// directory expansion and path formatting defaults differ, so preserve the
// original caller's behavior explicitly. Revisit when upgrading the Next plugin.
function globSync(pattern, options) {
  if (typeof pattern !== "string" || !options || options.onlyDirectories !== true
    || Object.keys(options).some(key => key !== "onlyDirectories")) {
    throw new TypeError("Next ESLint glob compatibility requires a string pattern and onlyDirectories: true.");
  }
  const normalizedPattern = path.normalize(pattern);
  if (path.isAbsolute(normalizedPattern) && normalizedPattern === path.parse(normalizedPattern).root) {
    try { return fs.statSync(normalizedPattern).isDirectory() ? [normalizedPattern] : []; }
    catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") return [];
      throw error;
    }
  }
  return tinyGlobSync(pattern, {
    onlyDirectories: true,
    expandDirectories: false,
    absolute: path.isAbsolute(pattern),
  }).map(entry => {
    const normalized = path.normalize(entry);
    const root = path.parse(normalized).root;
    return normalized === root ? root : normalized.replace(/[\\/]+$/u, "");
  });
}
module.exports = {globSync};
