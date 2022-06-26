import gql from "graphql-tag";

export const user = gql`
  """
  Site wide scan info.
  """
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
    stripeToken: String
    role: Int
    activeSubscription: Boolean
    emailConfirmed: Boolean
    emailFilteredDates: [Int]
    websites(limit: Int = 0, offset: Int = 0): [Website]
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
    invoice: Invoice
    pageSpeedApiKey: String
  }
`;
