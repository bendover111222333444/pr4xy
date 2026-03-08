"use strict";
const stockSW = "./sw.js";

const swAllowedHostnames = ["localhost", "127.0.0.1"];

async function registerSW() {
	if (!navigator.serviceWorker) {
		if (
			location.protocol !== "https:" &&
			!swAllowedHostnames.includes(location.hostname)
		)
			throw new Error("Service workers cannot be registered without https.");

		throw new Error("Your browser doesn't support service workers.");
	}

	// Unregister any existing broken service workers first
	const registrations = await navigator.serviceWorker.getRegistrations();
	for (const reg of registrations) {
		await reg.unregister();
	}

	await navigator.serviceWorker.register(stockSW);
	await navigator.serviceWorker.ready;
}
