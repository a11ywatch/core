import { load } from "@grpc/proto-loader";
import { loadPackageDefinition } from "@grpc/grpc-js";
import type {
  GrpcObject,
  Client,
  ServiceClientConstructor,
  ProtobufTypeDefinition,
} from "@grpc/grpc-js";

type GRPC = GrpcObject | ServiceClientConstructor | ProtobufTypeDefinition;

export interface Service {
  WebsiteService?: typeof Client & {
    service?: any;
  };
  crawler?: typeof Client & {
    Greeter?: any;
  };
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
    return await load(`${__dirname}/${target}`, protoConfig);
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
