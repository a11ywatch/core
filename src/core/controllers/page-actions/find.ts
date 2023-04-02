import { actionsCollection } from "../../../database";

// find page actions by path
export const findPageActionsByPath = async ({ path, userId, domain }) => {
  let actions = [];

  try {
    const action = await actionsCollection.findOne({
      path,
      userId,
      domain,
    });

    if (action && action.events) {
      actions = action.events;
    }
  } catch (e) {
    console.error(e);
  }

  return actions;
};
