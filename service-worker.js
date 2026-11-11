// ارفع رقم CACHE عند كل نشر
const CACHE = 'sana-app-shell-v21';
const APP_SHELL = [
  './index.html', './reading.html', './reading.css', './dictation.html', './diagnostics.html',
  './reading-app-config.js', './sana-core.js', './sana-progress.js', './sana-text.js',
  './manifest.webmanifest', './pwa-register.js',
  './vendor/microsoft.cognitiveservices.speech.sdk.bundle-min.js', './vendor/speech-processor.js',
  './fonts/noto-naskh-arabic-arabic-400-normal.woff2', './fonts/noto-naskh-arabic-arabic-600-normal.woff2', './fonts/noto-naskh-arabic-arabic-700-normal.woff2',
  './fonts/baloo-bhaijaan-2-arabic-500-normal.woff2', './fonts/baloo-bhaijaan-2-arabic-700-normal.woff2', './fonts/baloo-bhaijaan-2-arabic-800-normal.woff2',
  './icons/icon-192.png', './icons/icon-512.png'
];
const STATIC_DIRS = ['/vendor/', '/fonts/', '/icons/'];

self.addEventListener('install', event => {
  // إضافة كل ملف على حدة: غياب ملف واحد لا يُفشل التثبيت كاملًا
  event.waitUntil(caches.open(CACHE).then(cache =>
    Promise.allSettled(APP_SHELL.map(u => cache.add(u)))
  ));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE && !k.startsWith('sana-tts-')).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/__tts__/')) return;

  const isStatic = STATIC_DIRS.some(d => url.pathname.includes(d));
  if (isStatic) {
    // الملفات الثقيلة الثابتة: من الكاش أولًا
    event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(request, copy)); }
      return res;
    })));
    return;
  }
  // الصفحات: من الشبكة أولًا ثم الكاش
  event.respondWith(
    fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(c => c.put(request, copy)); }
      return response;
    }).catch(() => caches.match(request))
  );
});
