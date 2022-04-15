export const GRPC_PORT = 50051;
export const GRPC_PORT_PAGEMIND = 50052;
export const GRPC_PORT_MAV = 50053;
export const GRPC_PORT_CRAWLER = 50055;

export const GRPC_HOST = process.env.GRPC_HOST || `0.0.0.0:${GRPC_PORT}`;

export const GRPC_HOST_PAGEMIND =
  process.env.GRPC_HOST_PAGEMIND || `pagemind:${GRPC_PORT_PAGEMIND}`;

export const GRPC_HOST_CRAWLER =
  process.env.GRPC_HOST_CRAWLER || `crawler:${GRPC_PORT_CRAWLER}`;

export const GRPC_HOST_MAV =
  process.env.GRPC_HOST_MAV || `mav:${GRPC_PORT_MAV}`;
