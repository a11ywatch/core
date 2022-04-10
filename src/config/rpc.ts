export const GRPC_PORT = 50051;
export const GRRPC_PORT_PAGEMIND = 50052;

export const GRPC_HOST = `127.0.0.1:${GRPC_PORT}`;
export const GRPC_HOST_PAGEMIND =
  process.env.GRPC_HOST_PAGEMIND || `pagemind:${GRRPC_PORT_PAGEMIND}`;
