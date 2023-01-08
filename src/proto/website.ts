import { load } from "@grpc/proto-loader";
import { loadPackageDefinition } from "@grpc/grpc-js";
import type {
  GrpcObject,
  Client,
  ServiceClientConstructor,
  ProtobufTypeDefinition,
} from "@grpc/grpc-js";
import { getNodeModulesPath } from "@a11ywatch/website-source-builder/dist/node-path";

let nodePath = null;

type GRPC = GrpcObject | ServiceClientConstructor | ProtobufTypeDefinition;

// the generic unwrapping of the gRPC service
type RpcService = typeof Client & {
  [service: string]: any;
};

export interface Service {
  WebsiteService?: RpcService;
  Mav?: RpcService;
  Cdn?: RpcService;
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

export const loadProto = async (target: string = "website.proto", retry?: boolean) => {
  try {
    return await load(`${nodePath || "./node_modules"}/@a11ywatch/protos/${target}`,protoConfig);
  } catch (e) {
    if(!nodePath) {
      nodePath = getNodeModulesPath();
    }
    if (!retry) {
      return await loadProto(target, true);
    } else {
      console.error(e);
    }
  }
};

export const getProto = async (
  target: string = "website.proto"
): Promise<Service & GRPC> => {
  const packageDef = await loadProto(target);

  return loadPackageDefinition(packageDef);
};
