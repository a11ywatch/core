/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { decodeJwt, verifyJwt } from "./auth";

export const getUser = (bearerToken: string): any => {
  const token = bearerToken?.includes("Bearer ")
    ? bearerToken.split(" ")[1]
    : bearerToken;

  if (token) {
    // todo: check verify passing of decode
    if (verifyJwt(token)) {
      return decodeJwt(token);
    }
  }

  return false;
};
