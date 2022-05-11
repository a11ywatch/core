const UserModel = {
  email: "",
  password: "",
  salt: "",
  id: -1, // [DEPRECATED DEFAULT]: was set to 1 to inc between as old counter
  jwt: "",
  role: process.env.SUPER_MODE ? 1 : 0,
  alertEnabled: true,
  emailConfirmed: false,
  googleId: "",
  profileVisible: false,
  lastLoginDate: "",
  passwordRequired: false,
  apiUsage: {
    lastScanDate: null,
    usage: 0, // amount of API calls made per day
    usageLimit: 3, // the limit to reset to after the day
  },
  websiteLimit: 1, // limit of websites a user can have
};

// add defaults from user model and set the lastLoginDate to the current date
const makeUser = (
  { url, domain, ...extra }: any = { url: "", domain: "" }
): typeof UserModel => {
  return Object.assign(
    {},
    UserModel,
    {
      lastLoginDate: new Date(),
    },
    extra
  );
};

export { UserModel, makeUser };
