import { DEV } from "@app/config";
import path from "path";
import Piscina from "piscina";

const piscina = new Piscina({
  filename: path.resolve(__dirname, "crawl_website_worker.js"),
  // @ts-ignore
  env: process.env,
  execArgv: DEV
    ? ["-r", "ts-node/register", "-r", "tsconfig-paths/register"]
    : undefined,
});

export const workerMessage = async (props: any) => {
  try {
    await piscina.run({ ...props });
  } catch (e) {
    console.error(e);
  }
};
