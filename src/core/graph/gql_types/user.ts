export const user = `

	type ScanInformation {
		scanAttempts: Int
		usageLimit: Int
		lastScanDate: String
	}

	type ApiUsage {
		usage: Int
		usageLimit: Int
		lastScanDate: String
	}

	type User {
		id: Int
		email: String
		password: String
		jwt: String
		salt: String
		loggedIn: Boolean
		passwordRequired: Boolean
		alertEnabled: Boolean
		lastAlertSent: Int
		stripeToken: String
		role: Int
		activeSubscription: Boolean
		emailConfirmed: Boolean
		emailFilteredDates: [Int]
		websites: [Website]
		profileVisible: Boolean
		history: [History]
		scanInfo: ScanInformation
		analytics(filter: String): [Analytic]
		scripts(filter: String): [Script]
		script(filter: String, url: String): Script
		paymentSubscription: PaymentSubScription
		apiUsage: ApiUsage
		websiteLimit: Int
		downAlerts: [Website]
		emailExpDate: String
		resetCode: String
		stripeID: String
	}
`;
