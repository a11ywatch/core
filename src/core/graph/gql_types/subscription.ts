export const subscription = `
	type Subscription {
		websiteAdded(userId: Int): Website
		issueAdded(userId: Int): Issue
		subDomainAdded(userId: Int): SubDomain
		emailVerified(userId: Int): User
		issueRemoved: Issue
		subDomainRemoved: SubDomain
		websiteRemoved: Website
	}
`;
