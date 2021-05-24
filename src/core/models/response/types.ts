/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

interface ResponseParamsModel {
  msgType?: number
  statusCode?: number
  success?: boolean
  [extra: string]: any
}

interface ResponseModel {
  message: number
  code: number
  success: boolean
  [extra: string]: any
}

enum ApiResponse {
  Success,
  NotFound
}

export { ApiResponse, ResponseParamsModel, ResponseModel }
