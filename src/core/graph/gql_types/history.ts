export const history = `
	type History {
		id: ID
		url: String
		user: User
		issues(filter: String): [Issue]
		subDomains: [SubDomain]
		userId: Int
		domain: String
		adaScore: Float
		html: String
		htmlIncluded: Boolean
		cdnConnected: Boolean
		pageLoadTime: PageLoadTimeMeta
		issuesInfo: IssueMeta
		pageInsights: Boolean
		insight: PageInsights
	}
`;
