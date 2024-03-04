import { Schema, Document, Model, model } from "mongoose";

export interface BlogAttributes {
    title: string;
    content: string;
    category: string;
}

export interface BlogDocument extends Document {
    title: string;
    content: string;
    category: string;
    createdAt: string;
    updatedAt: string;
}

export interface BlogModel extends Model<BlogDocument> {
    addOne(doc: BlogAttributes): BlogDocument;
}

export const BlogSchema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        category: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: true
    }
);

BlogSchema.statics.addOne = function (doc: BlogAttributes) {
    return new Blog(doc);
};

export const Blog = model<BlogDocument, BlogModel>("Blog", BlogSchema);