import { removeIssue } from "./remove";
import { addIssue } from "./set";
import { getIssue, getIssues, getIssuesPaging } from "./find";
import { updateIssues } from "./update";

// Issues collection controller
export const IssuesController = ({ user } = { user: null }) => ({
  getIssue,
  getIssues,
  getIssuesPaging,
  addIssue,
  removeIssue,
  updateIssues,
});
