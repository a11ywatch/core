// gql mutation function
export function logout(_, __, context) {
  if (context?.res?.cookie) {
    context.res.clearCookie("on");
    context.res.clearCookie("jwt");
  }
  return {
    code: 200,
    success: true,
    message: "Logged out success",
  };
}
