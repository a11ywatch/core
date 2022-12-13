export const GRPC_PORT_PUBLIC = 50050;
export const GRPC_PORT = 50051;
export const GRPC_PORT_PAGEMIND = 50052;
export const GRPC_PORT_MAV = 50053;
export const GRPC_PORT_CRAWLER = 50055;
export const GRRPC_PORT_CDN = 50054;

// central server
const GRPC_HOST = process.env.GRPC_HOST || `0.0.0.0:${GRPC_PORT}`;
const GRPC_HOST_PUBLIC =
  process.env.GRPC_HOST_PUBLIC || `0.0.0.0:${GRPC_PORT_PUBLIC}`;

let GRPC_HOST_PAGEMIND =
  process.env.GRPC_HOST_PAGEMIND || `127.0.0.1:${GRPC_PORT_PAGEMIND}`;
let GRPC_HOST_CRAWLER =
  process.env.GRPC_HOST_CRAWLER || `127.0.0.1:${GRPC_PORT_CRAWLER}`;
let GRPC_HOST_MAV = process.env.GRPC_HOST_MAV || `127.0.0.1:${GRPC_PORT_MAV}`;
let GRPC_HOST_CDN = process.env.GRPC_HOST_CDN || `127.0.0.1:${GRRPC_PORT_CDN}`;

// target the docker container names
if (process.env.DOCKER_CONTAINER) {
  if (!process.env.GRPC_HOST_PAGEMIND) {
    GRPC_HOST_PAGEMIND = `pagemind:${GRPC_PORT_PAGEMIND}`;
  }
  if (!process.env.GRPC_HOST_CRAWLER) {
    GRPC_HOST_CRAWLER = `crawler:${GRPC_PORT_CRAWLER}`;
  }
  if (!process.env.GRPC_HOST_MAV) {
    GRPC_HOST_MAV = `mav:${GRPC_PORT_MAV}`;
  }
  if (!process.env.GRPC_HOST_CDN) {
    GRPC_HOST_CDN = `cdn-server:${GRRPC_PORT_CDN}`;
  }
}

export {
  GRPC_HOST,
  GRPC_HOST_PUBLIC,
  GRPC_HOST_PAGEMIND,
  GRPC_HOST_CRAWLER,
  GRPC_HOST_MAV,
  GRPC_HOST_CDN,
};
