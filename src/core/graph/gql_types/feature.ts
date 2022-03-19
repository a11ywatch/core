export const feature = `
	type Feature {
		id: ID
		feature: String
		enabled: Boolean
		user: [User]
		accountType: String
	}
`;
