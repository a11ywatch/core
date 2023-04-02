import { userParams } from "../../../utils/controller-filter";
import { usersCollection } from "../../../../database";
import type { User } from "../../../../types/types";
import { validateUID } from "../../../../web/params/extracter";

type GetUserParams = {
  email?: string;
  id?: number;
  emailConfirmCode?: string;
};

// get a user from the database by email, id, or emailConfirmCode
async function getUser({
  email,
  emailConfirmCode,
  id,
}: GetUserParams): Promise<[User | null, any]> {
  const block = !email && !emailConfirmCode && !validateUID(id);

  // prevent user find on empty queries
  if (block || !usersCollection) {
    return [null, usersCollection];
  }

  const params = userParams({ email, id, emailConfirmCode });

  const user = (await usersCollection.findOne(params)) as User;

  return [user, usersCollection];
}

export { getUser };
