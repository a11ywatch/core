export const website = `
	type PageHeaders {
		key: String
		value: String
	}

	type Website {
		id: ID
		url: String
		user: User
		userId: Int
		domain: String
		adaScore: Float
		screenshot: String
		screenshotStill: String
		html: String
		htmlIncluded: Boolean
		cdnConnected: Boolean
		pageLoadTime: PageLoadTimeMeta
		issues(filter: String): [Issue]
		issue: [Issue]
		issuesInfo: IssueMeta
		subDomains: [SubDomain]
		script: Script
		lastScanDate: String
		documentTitle: String
		cdn: String
		pageHeaders: [PageHeaders]
		online: Boolean
		timestamp: String
		pageInsights: Boolean
		insight: PageInsights
	}

`;
