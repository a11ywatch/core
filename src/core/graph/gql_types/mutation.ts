import gql from "graphql-tag";

export const mutation = gql`
  type Mutation {
    register(
      email: String!
      password: String
      googleId: String
      githubId: Int
    ): User

    login(
      email: String!
      password: String
      googleId: String
      githubId: Int
    ): User

    logout: BasicMutationResponse

    updateUser(
      password: String
      newPassword: String
      stripeToken: String
    ): UpdateUserMutationResponse

    toggleAlert(alertEnabled: Boolean): UpdateUserMutationResponse

    toggleProfile(toggleAlert: Boolean): UpdateUserMutationResponse

    """
    Update website configuration
    """
    updateWebsite(
      url: String
      customHeaders: [CreatePageHeaders]
      pageInsights: Boolean
      mobile: Boolean
      standard: String
      ua: String
      actions: [PageActionsInput]
    ): UpdateWebSiteMutationResponse

    updateScript(
      url: String
      scriptMeta: ScriptMetaInput
      editScript: Boolean
      newScript: String
    ): UpdateScriptMutationResponse

    """
    Multi-page or site crawl for issues.
    """
    crawlWebsite(url: String): UpdateWebSiteMutationResponse

    """
    Scan a single page for issues.
    """
    scanWebsite(url: String): UpdateWebSiteMutationResponse

    forgotPassword(email: String): User

    """
    Determine website order when receiving results.
    """
    sortWebsites(order: [String]): BasicMutationResponse

    """
    Validate user email address is attached to user.
    """
    confirmEmail(email: String): UpdateUserMutationResponse

    """
    Set the PageSpeed API key for a user to speed up scans.
    """
    setPageSpeedKey(pageSpeedApiKey: String): UpdateUserMutationResponse

    """
    Reset the current user password by email.
    """
    resetPassword(email: String, resetCode: String, jwt: String): User

    """
    Add a website and perform a site wide scan
    """
    addWebsite(
      url: String!
      customHeaders: [CreatePageHeaders]
      pageInsights: Boolean
      mobile: Boolean
      standard: String
      ua: String
      actions: [PageActionsInput]
      robots: Boolean
      subdomains: Boolean
      tld: Boolean
    ): UpdateWebSiteMutationResponse

    filterEmailDates(emailFilteredDates: [Int], morning: Boolean): User

    removeWebsite(
      url: String
      deleteMany: Boolean
    ): UpdateWebSiteMutationResponse

    addPaymentSubscription(
      email: String
      stripeToken: String
      yearly: Boolean
    ): UpdateUserMutationResponse

    cancelSubscription(email: String): UpdateUserMutationResponse
  }

  type BasicMutationResponse implements MutationResponse {
    code: String!
    success: Boolean!
    message: String!
  }

  type UpdateWebSiteMutationResponse implements MutationResponse {
    code: String!
    success: Boolean!
    message: String!
    website: Website
  }

  type UpdateUserMutationResponse implements MutationResponse {
    code: String!
    success: Boolean!
    message: String!
    user: User
    alertEnabled: Boolean
    profileVisible: Boolean
  }

  type UpdateScriptMutationResponse implements MutationResponse {
    code: String!
    success: Boolean!
    message: String!
    script: Script
  }

  """
  General Mutation Response.
  """
  interface MutationResponse {
    code: String!
    success: Boolean!
    message: String!
  }
`;
