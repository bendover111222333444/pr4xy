importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

async function handleRequest(event) {
	const url = new URL(event.request.url);

	await scramjet.loadConfig();

	// Let Scramjet handle its normal routes first
	if (scramjet.route(event)) {
		return scramjet.fetch(event);
	}

	// Only rewrite if it's a truly external target
	// Prevent fetching self
	if (
		url.origin === self.location.origin &&
		!url.pathname.startsWith("/scram")
	) {
		const target = scramjet.config?.url;

		if (target && !target.startsWith(self.location.origin)) {
			// Construct proxied URL using only the **external target**, never your own origin
			const proxied =
				"/scramjet/" +
				encodeURIComponent(target + url.pathname + url.search);

			return fetch(proxied, event.request);
		} else {
			// If the target is your own origin, abort to prevent recursion
			console.warn("Blocked fetch to self-origin:", target);
			return new Response("Cannot fetch self-origin URL", { status: 400 });
		}
	}

	// Default: just fetch normally
	return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
	event.respondWith(handleRequest(event));
});
