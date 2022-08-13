import { userParams } from "@app/core/utils/controller-filter";
import { connect } from "@app/database";
import { User } from "@app/types/types";

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

  try {
    const user = await collection.findOne(params);
    return [user, collection];
  } catch (e) {
    console.error(e);
    return [null, null];
  }
}

export { getUser };
