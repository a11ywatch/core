import http from "http";

export const httpGet = (target: string) => {
  return new Promise((resolve, reject) => {
    const req = http.get(target, (res) => {
      res.on("data", (d) => {
        resolve(d);
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
};
