import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import morgan from "morgan";
import { authenticate } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import authRouter from "./routes/auth";
import companiesRouter from "./routes/companies";
import contactsRouter from "./routes/contacts";
import notesRouter from "./routes/notes";
import stagesRouter from "./routes/stages";

type Application = import("express").Application;
type Request = import("express").Request;
type Response = import("express").Response;
type NextFunction = import("express").NextFunction;

function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req: Request, res: Response) =>
    res.json({ status: "ok" }),
  );

  app.use(morgan(process.env.NODE_ENV === "test" ? "tiny" : "combined"));

  const apiLimiter =
    process.env.NODE_ENV === "test"
      ? (_req: Request, _res: Response, next: NextFunction) => next()
      : rateLimit({
          windowMs: 15 * 60 * 1000,
          max: 300,
          standardHeaders: true,
          legacyHeaders: false,
          message: { error: "Too many requests, please try again later" },
        });
  app.use("/api/", apiLimiter);

  app.use("/api/auth", authRouter);
  app.use("/api/companies", authenticate, companiesRouter);
  app.use("/api/stages", authenticate, stagesRouter);
  app.use("/api/contacts", authenticate, contactsRouter);
  app.use("/api/notes", authenticate, notesRouter);
  app.use(errorHandler);

  return app;
}

export { createApp };
