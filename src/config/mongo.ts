import { FastifyInstance } from "fastify";
import { FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import fb from "fastify-plugin";

import mongoose, { ConnectOptions } from "mongoose";

import { Blog, BlogModel } from "../models/blog";

export interface Models {
    Blog: BlogModel;
}

export interface Db {
    models: Models;
}

export interface MyPluginOptions {
    uri: string;
}

const connectOptions: ConnectOptions = {
    dbName: "blog",
};

const ConnectDB: FastifyPluginAsync<MyPluginOptions> = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    try {
        const uri = options.uri;
        mongoose.connection.on("connected", () => {
            fastify.log.info({ actor: "MongoDB" }, "Mongoose connected");
        });
        mongoose.connection.on("error", (err) => {
            fastify.log.error(err);
        });
        mongoose.connection.on("disconnected", () => {
            fastify.log.info({ actor: "MongoDB" }, "Mongoose disconnected");
        });
        const db = await mongoose.connect(uri, connectOptions);
        const models: Models = {
            Blog
        };
        fastify.decorate("db", {
            models
        });
    } catch (error) {
        console.error(error);
    }
}

export default fb(ConnectDB);