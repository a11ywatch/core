import gql from "graphql-tag";

export const user = gql`
  """
  Site wide scan info.
  """
  type ScanInformation {
    totalUptime: Float
    usageLimit: Int
    lastScanDate: String
  }

  """
  User of the application.
  """
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
    role: Int
    activeSubscription: Boolean
    emailConfirmed: Boolean
    emailMorningOnly: Boolean
    emailFilteredDates: [Int]
    websites(limit: Int = 0, offset: Int = 0): [Website]
    profileVisible: Boolean
    history: [History]
    scanInfo: ScanInformation
    analytics(filter: String): [Analytic]
    paymentSubscription: PaymentSubScription
    websiteLimit: Int
    downAlerts: [Website]
    emailExpDate: String
    resetCode: String
    stripeID: String
    invoice: Invoice
    pageSpeedApiKey: String
    usageAnchorDate: String
  }
`;
