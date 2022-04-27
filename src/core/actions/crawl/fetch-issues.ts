import { controller } from "@app/proto/actions/calls";
import { Website } from "@app/schema";

interface Params {
  url: string;
  userId?: number;
  pageHeaders?: any[];
  pageInsights?: boolean;
  noStore?: boolean; // prevent storing values to CDN server
  scriptsEnabled?: boolean; // scripts storing enabled for user
}

// gRPC call to scan from pagemind
export const fetchPageIssues = async (
  params: Params
): Promise<{ webPage?: Website }> => {
  try {
    return await controller.scan(params);
  } catch (e) {
    console.error(e);
  }
};
