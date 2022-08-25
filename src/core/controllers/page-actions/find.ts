import { connect } from "../../../database";

// find page actions by path
export const findPageActionsByPath = async ({ path, userId }) => {
  let actions;
  try {
    const [actionsCollection] = await connect("PageActions");

    const action = await actionsCollection.findOne({
      path,
      userId,
    });

    if (action && action.events) {
      actions = action.events;
    }
  } catch (e) {
    console.error(e);
  }

  return actions;
};
