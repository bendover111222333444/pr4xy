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

	const registration = await navigator.serviceWorker.register(stockSW);

	// Wait for the service worker to be active and controlling the page
	await new Promise((resolve) => {
		if (registration.active) return resolve();
		const sw = registration.installing || registration.waiting;
		if (sw) {
			sw.addEventListener("statechange", () => {
				if (sw.state === "activated") resolve();
			});
		} else {
			resolve();
		}
	});

	// Ensure the SW is controlling this page
	if (!navigator.serviceWorker.controller) {
		await new Promise((resolve) => {
			navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
		});
	}
}
