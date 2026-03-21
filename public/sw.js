importScripts("/scram-custom/scramjet.all.js");

self.addEventListener("message", (event) => {
    if (event.data === "claim") {
        self.clients.claim();
    }
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

async function handleRequest(event) {
    const url = new URL(event.request.url);

    // shh

    await scramjet.loadConfig();
    if (scramjet.route(event)) {
        return scramjet.fetch(event);
    }
    return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});
