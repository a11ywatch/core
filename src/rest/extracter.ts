import { Request } from "express";

// extract query or body params from req
export const paramParser = (req: Request, value: string) =>
  req.query[value] || req.body[value];
