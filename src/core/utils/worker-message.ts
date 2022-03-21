import path from "path";
import Piscina from "piscina";

const piscina = new Piscina({
  filename: path.resolve(__dirname, "watcher_crawl_worker.js"),
  // @ts-ignore
  env: process.env,
});

export const workerMessage = async (
  props: any,
  workerPath: string = "watcher-crawl"
) => {
  try {
    try {
      if (workerPath === "crawl_website") {
        await piscina.run(
          { ...props },
          { filename: path.resolve(__dirname, "crawl_website_worker.js") }
        );
      } else {
        await piscina.run({ ...props });
      }
    } catch (e) {
      console.error(e);
    }
  } catch (e) {
    console.error(e);
  }
};
