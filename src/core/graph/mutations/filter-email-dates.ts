import { EMAIL_ERROR } from "../../strings";
import { getPayLoad } from "../../utils/query-payload";

export const filterEmailDates = async (
  _,
  { emailFilteredDates, morning, ...props },
  context
) => {
  const { audience, userId } = getPayLoad(context, props);

  const loginUser = await context.models.User.updateFilterEmailDates({
    audience,
    id: userId,
    emailFilteredDates,
    morning,
  });

  if (!loginUser) {
    throw new Error(EMAIL_ERROR);
  }

  return { emailFilteredDates, ...loginUser };
};
