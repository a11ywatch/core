export const subdomain = `
	type SubDomain {
		id: ID
		url: String
		user: User
		domain: String
		userId: Int
		adaScore: Float
		cdnConnected: Boolean
		pageLoadTime: PageLoadTimeMeta
		issues(filter: String): [Issue]
		issuesInfo: IssueMeta
		pageInsights: Boolean
		insight: PageInsights
	}
`;
