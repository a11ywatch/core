import type { Response } from "express";

export interface AppResponse extends Response {
  createIframe: (params: { url: string; baseHref: boolean }) => string;
}
