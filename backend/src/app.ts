import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cors from "cors";
import { ApiError } from "./utility/ApiError";
import userRouter from "./router/user.router";
import postRouter from "./router/post.router";
import commentRouter from "./router/comment.router";
import companyRouter from "./router/company.router";
import adminRouter from "./router/admin.router";
import path from "path";
import { functions } from "./inngest/server";
import { inngest } from "./inngest/client";
import { serve } from "inngest/express";
const app = express();

// CORS middleware
const frontendUrl = process.env.FRONTEND_URL
const allowedOrigins = frontendUrl ? frontendUrl.split(',').map(origin => origin.trim()) : [];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Add Json body parser middleware
app.use(express.json());
// Add URL encoded body parser middleware
app.use(express.urlencoded({ extended: true }));


// API routes - must come before static file serving
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/companies", companyRouter);
app.use("/api/v1/admin", adminRouter);

// Serve static files from React build
const buildPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(buildPath));

//  Inngest endpoint
const inngestHandler = serve({ client: inngest, functions });

app.use("/api/v1/inngest", (req, res, next) => {
  return inngestHandler(req, res, next);
});

app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(buildPath, 'index.html'));
});


// Error handling middleware
const errorHandler: ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  
  // Handle ApiError instances
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
    return;
  }
  
  // Handle other errors
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
};
app.use(errorHandler);

export { app };