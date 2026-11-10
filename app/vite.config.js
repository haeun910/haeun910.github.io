import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = fileURLToPath(new URL(".", import.meta.url));

// Emits a network-first service worker whose cache name changes with every build.
// Cache Storage is shared by the whole origin (/toeic/, /toeic-next/, /toeic-free/), so each build
// names its caches with its own prefix and only ever deletes its own old caches.
function serviceWorker(prefix) {
  return {
    name: "toeic-sw",
    apply: "build",
    generateBundle(_, bundle) {
      const stamp = createHash("sha1").update(Object.keys(bundle).sort().join("|") + Date.now()).digest("hex").slice(0, 10);
      const code = `// network-first cache so the app opens offline after the first visit
const P="${prefix}-v-",C=P+"${stamp}";
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(["./","./index.html","./manifest.webmanifest"]).catch(()=>{})));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(P)&&k!==C).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);if(u.origin!==location.origin||u.pathname.endsWith("/pay.html"))return;
e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;}).catch(()=>caches.match(r).then(m=>m||(r.mode==="navigate"?caches.match("./index.html"):undefined))));});
`;
      this.emitFile({ type: "asset", fileName: "sw.js", source: code });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, here, "");
  return {
    base: env.VITE_BASE || "/toeic/",
    publicDir: "public",
    build: {
      outDir: env.VITE_OUT_DIR || "dist",
      emptyOutDir: true,
      target: "es2019",
      // the free beta has no payments, so it ships without pay.html
      rollupOptions: { input: env.VITE_FREE === "1" ? { main: here + "index.html" } : { main: here + "index.html", pay: here + "pay.html" } },
    },
    plugins: [serviceWorker((env.VITE_BASE || "/toeic/").replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9-]/gi, "-") || "app")],
  };
});
