"use strict";
const stockSW = "./sw.js";
const swAllowedHostnames = ["localhost", "127.0.0.1"];

async function registerSW() {
    if (!navigator.serviceWorker) {
        if (location.protocol !== "https:" && !swAllowedHostnames.includes(location.hostname))
            throw new Error("Service workers cannot be registered without https.");
        throw new Error("Your browser doesn't support service workers.");
    }

    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) await existing.unregister();
    
    await navigator.serviceWorker.register(stockSW);
    await new Promise(resolve => {
        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
        if (navigator.serviceWorker.controller) resolve();
    });
    // Give the new SW a moment to fully initialize before any fetches fire
    await new Promise(resolve => setTimeout(resolve, 500));
}
