import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { hostname } from "node:os";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import net from "net";
import { SocksClient } from "socks";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));

const PROXY = {
	host: "198.23.239.134",
	port: 6540,
	type: 5,
	userId: "tlaqdnkf",
	password: "7gehk0l6v9li"
};

// Patch net.Socket to route all outbound connections through SOCKS5
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(options, ...args) {
	const host = typeof options === "object" ? options.host : null;
	const port = typeof options === "object" ? options.port : null;
	if (host && port && host !== "127.0.0.1" && host !== "localhost") {
		const self = this;
		SocksClient.createConnection({
			proxy: PROXY,
			command: "connect",
			destination: { host, port: Number(port) }
		}).then(({ socket }) => {
			self._handle = socket._handle;
			socket._handle = null;
			self.emit("connect");
			socket.pipe(self);
			self.pipe(socket);
		}).catch((err) => {
			self.emit("error", err);
		});
		return this;
	}
	return originalConnect.call(this, options, ...args);
};

logging.set_level(logging.NONE);
Object.assign(wisp.options, {
	allow_udp_streams: false,
	hostname_blacklist: [/example\.com/],
	dns_servers: ["1.1.1.3", "1.0.0.3"],
	dns_method: async (hostname) => hostname,
});

const fastify = Fastify({
	serverFactory: (handler) => {
		return createServer()
			.on("request", (req, res) => {
				res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
				res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
				handler(req, res);
			})
			.on("upgrade", (req, socket, head) => {
				if (req.url.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
				else socket.end();
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
