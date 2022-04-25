import { controller } from "@app/proto/actions/calls";

interface Params {
  url: string;
  userId?: number;
  pageHeaders?: any[];
  pageInsights?: boolean;
  noStore?: boolean; // prevent storing values to CDN server
}

// gRPC call to scan from pagemind
export const fetchPuppet = async (params: Params) => {
  let dataSource;
  try {
    dataSource = await controller.scan(params);
  } catch (e) {
    console.error(e);
  }

  return dataSource;
};
