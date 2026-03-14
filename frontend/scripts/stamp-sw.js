/**
 * stamp-sw.js — run as "prebuild" to inject a build timestamp into sw.js
 * This ensures sw.js changes on every deploy, triggering the browser's
 * byte-diff check and putting the new SW into "waiting" state.
 */
const fs   = require("fs");
const path = require("path");

const swPath   = path.join(__dirname, "../public/sw.js");
const template = path.join(__dirname, "../public/sw.template.js");

const ts  = new Date().toISOString();
const src = fs.readFileSync(template, "utf8");
// Replace ALL occurrences of the placeholder (used in comment AND CACHE_NAME)
const stamped = src.split("__BUILD_TIMESTAMP__").join(ts);
fs.writeFileSync(swPath, stamped, "utf8");
console.log("[stamp-sw] sw.js stamped:", ts);
