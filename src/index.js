import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { hostname } from "node:os";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import net from "net";
import { join } from "path";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));
const scramCustomPath = fileURLToPath(new URL("../public/scram-custom/", import.meta.url));
const baremuxPath = fileURLToPath(new URL("../public/baremux/", import.meta.url));

logging.set_level(logging.NONE);

const fastify = Fastify({
	serverFactory: (handler) => {
		return createServer()
			.on("request", (req, res) => {
				res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
				res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
				handler(req, res);
			})
			.on("upgrade", (req, socket, head) => {
				if (req.url.endsWith("/wisp/")) {
					const proxy = net.createConnection(5001, "127.0.0.1", () => {
						proxy.write(
							`GET ${req.url} HTTP/1.1\r\n` +
							`Host: 127.0.0.1:5001\r\n` +
							`Upgrade: websocket\r\n` +
							`Connection: Upgrade\r\n` +
							`Sec-WebSocket-Key: ${req.headers["sec-websocket-key"]}\r\n` +
							`Sec-WebSocket-Version: ${req.headers["sec-websocket-version"]}\r\n` +
							`\r\n`
						);
						socket.pipe(proxy);
						proxy.pipe(socket);
					});
					proxy.on("error", () => socket.end());
				} else {
					socket.end();
				}
			});
	},
});

fastify.register(fastifyStatic, {
	root: publicPath,
	decorateReply: true,
});
fastify.register(fastifyStatic, {
	root: scramjetPath,
	prefix: "/scram/",
	decorateReply: false,
});
fastify.register(fastifyStatic, {
	root: scramCustomPath,
	prefix: "/scram-custom/",
	decorateReply: false,
});
fastify.register(fastifyStatic, {
	root: libcurlPath,
	prefix: "/libcurl/",
	decorateReply: false,
});
fastify.register(fastifyStatic, {
	root: baremuxPath,
	prefix: "/baremux/",
	decorateReply: false,
});

fastify.setNotFoundHandler((res, reply) => {
	return reply.code(404).type("text/html").sendFile("404.html");
});

fastify.server.on("listening", () => {
	const address = fastify.server.address();
	console.log("Listening on:");
	console.log(`\thttp://localhost:${address.port}`);
	console.log(`\thttp://${hostname()}:${address.port}`);
	console.log(
		`\thttp://${
			address.family === "IPv6" ? `[${address.address}]` : address.address
		}:${address.port}`
	);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
function shutdown() {
	console.log("SIGTERM signal received: closing HTTP server");
	fastify.close();
	process.exit(0);
}

let port = parseInt(process.env.PORT || "");
if (isNaN(port)) port = 8080;
fastify.listen({
	port: port,
	host: "0.0.0.0",
});