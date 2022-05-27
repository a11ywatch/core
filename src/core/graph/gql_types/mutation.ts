import gql from "graphql-tag";

export const mutation = gql`
  type Mutation {
    register(email: String!, password: String, googleId: String): User

    login(email: String!, password: String, googleId: String): User

    logout: BasicMutationResponse

    updateUser(
      password: String
      newPassword: String
      stripeToken: String
    ): UpdateUserMutationResponse

    toggleAlert(alertEnabled: Boolean): UpdateUserMutationResponse

    toggleProfile(toggleAlert: Boolean): UpdateUserMutationResponse

    updateWebsite(
      url: String
      customHeaders: [CreatePageHeaders]
      pageInsights: Boolean
      mobile: Boolean
      standard: String
      ua: String
    ): UpdateWebSiteMutationResponse

    updateScript(
      url: String
      scriptMeta: ScriptMetaInput
      editScript: Boolean
      newScript: String
    ): UpdateScriptMutationResponse

    crawlWebsite(url: String): UpdateWebSiteMutationResponse

    scanWebsite(url: String): UpdateWebSiteMutationResponse

    forgotPassword(email: String): User

    sortWebsites(order: [String]): BasicMutationResponse

    confirmEmail(email: String): UpdateUserMutationResponse

    resetPassword(email: String, resetCode: String, jwt: String): User

    addWebsite(
      url: String!
      customHeaders: [CreatePageHeaders]
      pageInsights: Boolean
      mobile: Boolean
      standard: String
      ua: String
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

  interface MutationResponse {
    code: String!
    success: Boolean!
    message: String!
  }
`;
