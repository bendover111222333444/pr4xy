importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

async function handleRequest(event) {
	const url = new URL(event.request.url);

	await scramjet.loadConfig();

	// Already a Scramjet-proxied URL? Just let it go
	if (url.pathname.startsWith("/scramjet/")) {
		return fetch(event.request);
	}

	// Normal Scramjet routing
	if (scramjet.route(event)) {
		return scramjet.fetch(event);
	}

	// Rewrite same-origin requests to the external target
	if (
		url.origin === self.location.origin &&
		!url.pathname.startsWith("/scram")
	) {
		const target = scramjet.config?.url;

		if (target) {
			// Build the external URL correctly
			const externalUrl = new URL(url.pathname + url.search, target);

			// Encode for Scramjet
			const proxied = "/scramjet/" + encodeURIComponent(externalUrl.href);

			return fetch(proxied, event.request);
		}
	}

	// Default fallback
	return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
	event.respondWith(handleRequest(event));
});
