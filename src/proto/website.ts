import { load } from "@grpc/proto-loader";
import { loadPackageDefinition } from "@grpc/grpc-js";
import type {
  GrpcObject,
  Client,
  ServiceClientConstructor,
  ProtobufTypeDefinition,
} from "@grpc/grpc-js";

type GRPC = GrpcObject | ServiceClientConstructor | ProtobufTypeDefinition;

// the generic unwrapping of the gRPC service
type RpcService = typeof Client & {
  [service: string]: any;
};

export interface Service {
  WebsiteService?: RpcService;
  Mav?: RpcService;
  Pagemind?: RpcService;
  crawler?: RpcService;
}

const protoConfig = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

export const loadProto = async (target: string = "website.proto") => {
  try {
    return await load(`node_modules/@a11ywatch/protos/${target}`, protoConfig);
  } catch (e) {
    console.error(e);
  }
};

export const getProto = async (
  target: string = "website.proto"
): Promise<Service & GRPC> => {
  try {
    const packageDef = await loadProto(target);

    return loadPackageDefinition(packageDef);
  } catch (e) {
    console.error(e);
  }
};
