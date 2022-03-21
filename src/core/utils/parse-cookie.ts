interface AppCookie {
  jwt?: string;
}

export function parseCookie(cookiesString?: string): AppCookie | null {
  if (!cookiesString) {
    return null;
  }
  return cookiesString
    .split(";")
    .map((cookieString) => cookieString.trim().split("="))
    .reduce(function (acc, curr) {
      acc[curr[0]] = curr[1];
      return acc;
    }, {});
}
