export const meta = `

	type IssueMeta {
		issuesFixedByCdn: Int
		possibleIssuesFixedByCdn: Int
		totalIssues: Int
		cdnConnected: Boolean
		skipContentIncluded: Boolean
		errorCount: Int
		warningCount: Int
		limitedCount: Int
	}

	type PageLoadTimeMeta {
		duration: Int
		durationFormated: String
		color: String
	}

	type ScriptMeta {
		skipContentEnabled: Boolean
		translateEnabled: Boolean
	}

`;
