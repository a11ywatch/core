import proxy from "express-http-proxy";

// move to cdn env var
export const cdnProxy = proxy("http://cdn-server:8090");
