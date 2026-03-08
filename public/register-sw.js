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

	await navigator.serviceWorker.register(stockSW);

	if (!navigator.serviceWorker.controller) {
		const reg = await navigator.serviceWorker.ready;
		reg.active.postMessage("claim");
		await new Promise(resolve => {
			navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
		});
	}
}
