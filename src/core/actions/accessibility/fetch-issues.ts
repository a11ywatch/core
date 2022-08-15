import { controller, ScanRpcParams } from "../../../proto/actions/calls";
import type { PageMindScanResponse } from "../../../types/schema";

// gRPC call to scan from pagemind
export const fetchPageIssues = async (
  params: ScanRpcParams
): Promise<PageMindScanResponse> => {
  try {
    return await controller.scan(params);
  } catch (e) {
    console.error(e);
  }
};
