import { FastifyInstance, FastifyPluginOptions, FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

import fb from "fastify-plugin";

import { Db } from "../config/mongo";

import { BlogAttributes } from "../models/blog";
import { RedisClient } from "../config/redis";

declare module "fastify" {
    interface FastifyInstance {
        db: Db;
    }
}

interface blogParams {
    id: string;
}

const blogRoutes: FastifyPluginAsync<RedisClient> = async (server: FastifyInstance, options: FastifyPluginOptions) => {
    server.get("/blogs", async (request: FastifyRequest, reply: FastifyReply) => {
        const cahedBlogs = await server.redis.get("blogs");
        if (cahedBlogs) {
            return reply.status(200).send(JSON.parse(cahedBlogs));
        }
        try {
            const { Blog } = server.db.models;
            const blogs = await Blog.find({});
            await server.redis.set("blogs", JSON.stringify(blogs), "EX", 60);
            return reply.status(200).send(blogs);
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: "Internal Server Error" });
        }
    });

    server.post<{ Body: BlogAttributes }>("/blogs", async (request, reply: FastifyReply) => {
        try {
            const { Blog } = server.db.models;
            const blog = Blog.addOne(request.body);
            await blog.save();
            await server.redis.set(`blog:${blog._id}`, JSON.stringify(blog), "EX", 60);
            return reply.status(201).send(blog);
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: "Internal Server Error" });
        }
    });

    server.get<{ Params: blogParams }>("/blogs/:id", async (request, reply: FastifyReply) => {
        const { id } = request.params;
        const cachedBlog = await server.redis.get(`blog:${id}`);
        if (cachedBlog) {
            return reply.status(200).send(JSON.parse(cachedBlog));
        }
        try {
            const { Blog } = server.db.models;
            const blog = await Blog.findById(request.params.id);
            if (!blog) {
                return reply.status(404).send({ message: "Blog not found" });
            }
            await server.redis.set(`blog:${blog._id}`, JSON.stringify(blog), "EX", 60);
            return reply.status(200).send(blog);
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: "Internal Server Error" });
        }
    });

    server.put<{ Params: blogParams, Body: BlogAttributes }>("/blogs/:id", async (request, reply: FastifyReply) => {
        try {
            const { Blog } = server.db.models;
            const blog = await Blog.findByIdAndUpdate(request.params.id, request.body, { new: true });
            if (!blog) {
                return reply.status(404).send({ message: "Blog not found" });
            }
            await server.redis.set(`blog:${blog._id}`, JSON.stringify(blog), "EX", 60);
            return reply.status(200).send(blog);
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: "Internal Server Error" });
        }
    });

    server.delete<{ Params: blogParams }>("/blogs/:id", async (request, reply: FastifyReply) => {
        try {
            const { Blog } = server.db.models;
            const blog = await Blog.findByIdAndDelete(request.params.id);
            if (!blog) {
                return reply.status(404).send({ message: "Blog not found" });
            }
            await server.redis.del(`blog:${blog._id}`);
            return reply.status(204).send();
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: "Internal Server Error" });
        }
    });
}

export default fb(blogRoutes);