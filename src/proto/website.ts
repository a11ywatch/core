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

export const getProto = async (
  target: string = "website.proto"
): Promise<Service & GRPC> => {
  try {
    const packageDef = await load(`${__dirname}/${target}`, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    return loadPackageDefinition(packageDef);
  } catch (e) {
    console.error(e);
  }
};
