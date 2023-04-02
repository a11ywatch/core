import { removeIssue } from "./remove";
import { addIssue } from "./set";
import { getIssue, getIssues, getIssuesPaging } from "./find";
import { updateIssues } from "./update";
import { issuesCollection } from "../../../database";

// Issues collection controller
export const IssuesController = ({ user } = { user: null }) => ({
  getCollection: issuesCollection,
  getIssue,
  getIssues,
  getIssuesPaging,
  addIssue,
  removeIssue,
  updateIssues,
});
