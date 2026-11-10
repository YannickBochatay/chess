// La version du cache
const VERSION = "v1.0";

// Le nom du cache
const CACHE_NAME = `chess-${VERSION}`;

// Les ressources statiques nécessaires au fonctionnement de l'application
// find . -type f -printf '"%p",\n'
const APP_STATIC_RESOURCES = [
  "./lib/chessboard/index.js",
  "./lib/chessboard/styles.css",
  "./lib/chessboard/img/bB.svg",
  "./lib/chessboard/img/wB.svg",
  "./lib/chessboard/img/bK.svg",
  "./lib/chessboard/img/wK.svg",
  "./lib/chessboard/img/bN.svg",
  "./lib/chessboard/img/wN.svg",
  "./lib/chessboard/img/bP.svg",
  "./lib/chessboard/img/wP.svg",
  "./lib/chessboard/img/bQ.svg",
  "./lib/chessboard/img/wQ.svg",
  "./lib/chessboard/img/bR.svg",
  "./lib/chessboard/img/wR.svg",
  "./lib/jquery/index.js",
  "./lib/chess.js/index.js",
  "./lib/confetti/index.js",
  "./lib/sumi.css/index.css",
  "./lib/stockfish/stockfish-19-lite-single.js",
  "./lib/stockfish/stockfish-19-lite-single.wasm",
  "./index.html",
  "./styles.css",
  "./src/confetti.js",
  "./src/index.js",
  "./src/board.js",
  "./src/game.js",
  "./src/controls.js",
  "./src/stockfish.js"
];

// Lors de l'installation, on met en cache les ressources statiques
self.addEventListener("install", (event) => {

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      cache.addAll(APP_STATIC_RESOURCES);
    })()
  );
  skipWaiting();
});

// Lors de l'activation, on supprime les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        }),
      );
      await clients.claim();
    })(),
  );
});

// Interception des requêtes serveur
self.addEventListener("fetch", (event) => {

  if (event.request.method !== 'GET') return

  // Pour toutes les autres requêtes, on passe par le cache
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request, { ignoreSearch : true });
      if (cachedResponse) return cachedResponse
      
      return new Response(
        JSON.stringify({ details : "Vous êtes hors ligne et la ressource n'est pas en cache" }),
        {
          status: 503,
          headers: {'Content-Type':'application/json'}
        });
    })(),
  );
});