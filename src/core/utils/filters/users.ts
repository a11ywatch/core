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
