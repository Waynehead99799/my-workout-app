import mongoose from "mongoose";

type CachedMongoose = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: CachedMongoose | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };

global.mongooseCache = cached;

export async function connectDb() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      dbName: process.env.MONGODB_DB ?? "workout_tracker",
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
