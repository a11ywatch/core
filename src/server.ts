import { startServer } from "./app";

// start the application server
startServer(process.env.DISABLE_HTTP === "true");
