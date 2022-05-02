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
  data?: any;
  errors?: any;
  [extra: string]: any;
}

enum ApiResponse {
  Success,
  NotFound,
}

export { ApiResponse, ResponseParamsModel, ResponseModel };
