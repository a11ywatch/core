import { cookieConfigs } from "../../../../config";

// gql mutation function
export function logout(_, __, context: any) {
  if (context?.res?.clearCookie) {
    context?.res?.clearCookie("jwt", cookieConfigs);
  }

  return {
    code: 200,
    success: true,
    message: "Sign out success!",
  };
}
