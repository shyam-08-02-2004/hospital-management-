const mongoose = require('mongoose');

/**
 * Cached connection for serverless environments (Vercel).
 * Reuses existing connection across warm invocations.
 */
let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected, return immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => {
        console.log(`MongoDB connected: ${m.connection.host}`);
        return m;
      })
      .catch((error) => {
        console.error(`Failed to connect to MongoDB: ${error.message}`);
        cached.promise = null; // Reset so next call retries
        throw error; // Don't process.exit in serverless!
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
