import type { User as UserGql } from "./schema";

export interface User extends UserGql {
  googleId?: string;
  githubId?: number;
  pageSpeedApiKey?: string; // page speed api key
}

export type { Analytic, History, Website, Pages, Issue } from "./schema";
