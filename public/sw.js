const self = this;

const offlineVersion = 1;

const cacheName = "cache";

const offlineURL = "offline.html";

const filesToCache = [
  "/index.html",
  "/offline.html",
  "/script.js",
  "/robots.txt",
  "manifest.json",
];

self.addEventListener("install", (event) => {
  try {
    event.waitUntil(
      caches.open(cacheName).then((cache) => {
        console.log("ServiceWorker installed");

        return cache.addAll(filesToCache);
      })
    );
  } catch (e) {
    console.log("ServiceWorker installation failed: ", e.message);
  }
});

self.addEventListener("activate", (event) => {
  console.log("ServiceWorker activate...");
});

self.addEventListener("fetch", (event) => {
  console.log("ServiceWorker fetch: ", event.request.url);

  event.respondWith(
    fetch(event.request).catch((e) => {
      console.log(
        "ServiceWorker fetch failed. Returning offline page... ",

        e.message
      );

      return caches.open(cacheName).then((cache) => cache.match(offlineURL));
    })
  );
});

self.addEventListener("push", function (event) {
  const title = "Push Codelab";

  const notificationPromise = self.registration.showNotification(title);
  event.waitUntil(notificationPromise);

  console.log("[Service Worker] Push Received.");
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);
});

self.addEventListener("message", function (event) {
  console.log("Service worker received message:", event.data);
});
