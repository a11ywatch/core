import { cookieConfigs } from "../../../../config";

// gql mutation function
export function logout(_, __, context) {
  if (context?.res?.cookie) {
    // context?.res?.cookie("jwt", "", cookieConfigs);
    context?.res?.clearCookie("jwt", cookieConfigs);
  }

  return {
    code: 200,
    success: true,
    message: "Sign out success!",
  };
}
