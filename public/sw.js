importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

async function handleRequest(event) {
	const url = new URL(event.request.url);

	await scramjet.loadConfig();

	// If Scramjet wants to handle it normally
	if (scramjet.route(event)) {
		return scramjet.fetch(event);
	}

	// If a site made a relative request that resolved to the proxy origin,
	// rewrite it back through the proxy instead of letting it escape.
	if (
		url.origin === self.location.origin &&
		!url.pathname.startsWith("/scram")
	) {
		const target = scramjet.config?.url;
		if (target) {
			const proxied =
				"/scramjet/" +
				encodeURIComponent(target + url.pathname + url.search);

			return fetch(proxied, event.request);
		}
	}

	return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
	event.respondWith(handleRequest(event));
});
