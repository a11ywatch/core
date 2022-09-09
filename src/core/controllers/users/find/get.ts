import { userParams } from "../../../utils/controller-filter";
import { connect } from "../../../../database";
import type { User } from "../../../../types/types";

type GetUserParams = {
  email?: string;
  id?: number;
  emailConfirmCode?: string;
};

// get a user from the database by email, id, or emailConfirmCode
async function getUser({
  email,
  id,
  emailConfirmCode,
}: GetUserParams): Promise<[User | null, any]> {
  const [collection] = await connect("Users");
  const params = userParams({ email, id, emailConfirmCode });

  const user = (await collection.findOne(params)) as User;

  return [user, collection];
}

export { getUser };
