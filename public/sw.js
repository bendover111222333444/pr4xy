importScripts("/scram-custom/scramjet.all.js");

let transportReady;
let transportReadyResolve;
transportReady = new Promise(resolve => { transportReadyResolve = resolve; });

self.addEventListener("message", (event) => {
    if (event.data === "claim") {
        self.clients.claim();
    }
    if (event.data?.type === "transportReady") {
        transportReadyResolve();
    }
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

async function handleRequest(event) {
    await transportReady;
    await scramjet.loadConfig();
    if (scramjet.route(event)) {
        return scramjet.fetch(event);
    }
    return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});