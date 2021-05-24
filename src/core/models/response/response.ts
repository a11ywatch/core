/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { WEBSITE_NOT_FOUND, CRAWLER_FINISHED } from "@app/core/strings"
import { ApiResponse, ResponseParamsModel, ResponseModel } from "./types"

const responseModel = (
  { msgType, statusCode, success = true, ...extra }: ResponseParamsModel = {
    msgType: ApiResponse.Success,
    statusCode: ApiResponse.Success,
    success: true
  }
): ResponseModel => {
  let message
  let code

  switch (msgType) {
    case ApiResponse.NotFound:
      message = WEBSITE_NOT_FOUND
      break
    default:
      message = CRAWLER_FINISHED
      break
  }

  switch (statusCode) {
    case ApiResponse.NotFound:
      code = 404
      break
    default:
      code = 200
      break
  }

  return {
    ...extra,
    success,
    code,
    message
  }
}

export { responseModel }
