interface ResponseParamsModel {
  msgType?: number;
  statusCode?: number;
  success?: boolean;
  [extra: string]: any;
}

interface ResponseModel {
  code: number;
  success: boolean;
  message?: string;
  // TODO: USE DATA PROP STRICTLY
  [extra: string]: any;
}

enum ApiResponse {
  Success,
  NotFound,
}

export { ApiResponse, ResponseParamsModel, ResponseModel };
