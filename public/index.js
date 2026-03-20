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

	// Set transport before registerSW so SharedWorker port is established first
	await connection.setTransport("/libcurl/index.mjs", [
		{ websocket: [
			"wss://dogballs.sigmasigmaonthewallwhoisthe2.workers.dev/",
			"wss://lively-bush-0aa7.sigmasigmaonthewallwhoisthe2.workers.dev/",
			"wss://shy-mouse-7929.sigmasigmaonthewallwhoisthe2.workers.dev/",
			"wss://patient-waterfall-ec44.sigmasigmaonthewallwhoisthe2.workers.dev/",
		], replace: true },
	]);

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	let url = search(address.value, searchEngine.value);
	// Redirect Google searches to DuckDuckGo to avoid captchas
	if (url.includes("google.com/search")) {
		const query = new URL(url).searchParams.get("q");
		url = "https://duckduckgo.com/?q=" + encodeURIComponent(query);
	}

	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";
	document.body.appendChild(frame.frame);
	frame.go(url);
});
