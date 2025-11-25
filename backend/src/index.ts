import dotenv from "dotenv";
import { app } from "./app";
import { connectDB } from "./db/index";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import SocketService from "./services/socketService";

// Type declaration for BigInt JSON serialization and Socket.IO global
declare global {
  interface BigInt {
    toJSON(): string;
  }
  var io: SocketIOServer;
  var socketService: SocketService;
}

// Add BigInt serialization support
BigInt.prototype.toJSON = function() {
    return this.toString();
};

dotenv.config();

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8080;
    const server = createServer(app);
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
      }
    });

    // Make io globally available for Inngest functions
    global.io = io;

    // Initialize socket service for real-time sentiment updates
    const socketService = new SocketService(io);
    global.socketService = socketService;

    // Start periodic updates (every 60 seconds)
    socketService.startPeriodicUpdates(15000);

    // Start the server
    server.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(`🔌 Socket.io server running for real-time sentiment updates`);
    });

    // Error handling for server-level errors
    app.on("error", (error) => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });
  })
  .catch((error) => {
      console.error('❌ Database connection failed:', error.message);
  });
