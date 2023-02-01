import { connect } from "../../../database";

// find page actions by path
export const findPageActionsByPath = async ({ path, userId }) => {
  const [actionsCollection] = connect("PageActions");
  let actions = [];

  try {
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
