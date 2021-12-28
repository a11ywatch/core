/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

export function userParams({
  id,
  email,
  emailConfirmCode,
}: {
  id?: any;
  email?: string;
  emailConfirmCode?: string;
}) {
  let searchProps = {};

  if (typeof email !== "undefined") {
    searchProps = { email };
  }

  if (typeof id !== "undefined") {
    searchProps = { ...searchProps, id: Number(id) };
  }

  if (typeof emailConfirmCode !== "undefined") {
    searchProps = { ...searchProps, emailConfirmCode };
  }

  return searchProps;
}
