// response params between gql -> rest [TODO: refactor]
interface ResponseParamsModel {
  statusCode?: number; // enum map
  code?: number; // actual status code to use
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

export { ResponseParamsModel, ResponseModel };
