export const issue = ` 
	type Issue {
		documentTitle: String
		code: String
		type: String
		typeCode: Int
		message: String
		context: String
		selector: String
		runner: String
		issue: Issue
		issues(filter: String): [Issue]
		url: String
		domain: String
		pageUrl: String
	}
`;
