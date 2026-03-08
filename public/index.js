"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("sj-error-code");
const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
	files: {
		wasm: "/scram-custom/b4dd3fcfb3153a32.wasm",
		all: "/scram-custom/scramjet.all.js",
		sync: "/scram-custom/scramjet.sync.js",
	},
});
scramjet.init();
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
form.addEventListener("submit", async (event) => {
	event.preventDefault();
	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}
	// Wait for SW to control this page (needed so /scramjet/* is intercepted, not the server)
	if (!navigator.serviceWorker.controller) {
		const claimed = await new Promise((resolve) => {
			const t = setTimeout(() => resolve(false), 5000);
			navigator.serviceWorker.addEventListener("controllerchange", () => {
				clearTimeout(t);
				resolve(true);
			}, { once: true });
		});
		if (!claimed) {
			error.textContent = "Service worker not ready. Refresh the page and try again.";
			return;
		}
	}
	error.textContent = "";
	errorCode.textContent = "";
	let url = search(address.value, searchEngine.value);
	// Redirect Google searches to DuckDuckGo to avoid captchas
	if (url.includes("google.com/search")) {
		const query = new URL(url).searchParams.get("q");
		url = "https://duckduckgo.com/?q=" + encodeURIComponent(query);
	}
	let wispUrl = "wss://dogballs.sigmasigmaonthewallwhoisthe2.workers.dev/";
	try {
		await connection.setTransport("/libcurl/index.mjs", [
			{ websocket: wispUrl, replace: true },
		]);
	} catch (err) {
		error.textContent = "Could not connect to proxy transport (Wisp). Check Network tab for WebSocket errors.";
		errorCode.textContent = String(err?.message || err);
		return;
	}
	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";
	document.body.appendChild(frame.frame);
	try {
		frame.go(url);
	} catch (err) {
		error.textContent = "Navigation failed.";
		errorCode.textContent = String(err?.message || err);
	}
});
