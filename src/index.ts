import fastify, { FastifyInstance } from "fastify";
import pino from "pino";
import db from "./config/mongo";
import blogRoutes from "./routes/blog";
import redis from "@fastify/redis";


let envPort = process.env.PORT;
if (envPort == undefined || envPort == "") {
    envPort = "3000";
}

const Port = parseInt(envPort);

const server = fastify({
    logger: pino({
        level: "info",
    }),
});

server.register(db, {
    uri: "mongodb://localhost:27000/blog",
});

server.register(redis, {
    host: "localhost",
    port: 6379,
});

server.register(blogRoutes);

server.listen({ port: Port }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
    server.log.info(`Server listening on ${address}`);
    server.redis.get("blogs").then((res) => {
        console.log(res);
    });
});