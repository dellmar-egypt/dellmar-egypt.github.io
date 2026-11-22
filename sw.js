/* عامل خدمة ديلمار ايجيبت — يجعل المتجر يعمل كتطبيق ويفتح دون إنترنت */
var CACHE = "dellmar-v26b";
var ASSETS = [
  "./",
  "./index.html",
  "./css/base.css",
  "./css/theme-harvest.css",
  "./js/data.js",
  "./js/config.js",
  "./js/app.js",
  "./js/admin.js",
  "./js/install.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./images/logo.png",
  "./images/category-soil-fertilizers.png",
  "./images/category-foliar-fertilizers.png",
  "./images/category-insecticides.png",
  "./images/category-nematicides.png",
  "./images/category-fungicides.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener("message", function (e) { if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting(); });

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    })
  );
  self.clients.claim();
});

/* الشبكة أولاً للطلبات، والتخزين المؤقت أولاً للملفات الثابتة */
self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET" || (url.protocol !== "https:" && url.protocol !== "http:")) return;
  if (url.hostname === "api.web3forms.com") return; // الطلبات دائماً عبر الشبكة

  if (url.origin === location.origin) {
    if (url.pathname.indexOf("/images/") === 0 || url.pathname.indexOf("/icons/") === 0) {
      /* الصور والأيقونات: الكاش أولاً لأنها لا تتغير */
      e.respondWith(
        caches.match(e.request).then(function (hit) {
          return hit || fetch(e.request).then(function (res) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
            return res;
          });
        })
      );
    } else {
      /* الكود والصفحات: الشبكة أولاً ليصل التحديث فوراً، والكاش احتياطي بلا إنترنت */
      e.respondWith(
        fetch(e.request, {cache:"no-store"}).then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
          return res;
        }).catch(function () { return caches.match(e.request); })
      );
    }
  }
});
