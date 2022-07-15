import type { Response } from "express";
import type { User as UserGql } from "./schema";

export interface AppResponse extends Response {
  createIframe: (params: { url: string; baseHref: boolean }) => string;
}

export interface User extends UserGql {
  googleId?: string;
  githubId?: number;
  pageSpeedApiKey?: string; // page speed api key
}

export type { Analytic, History, Website, Pages, Issue } from "./schema";
