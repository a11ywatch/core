import { SUPER_MODE } from "../../../config/config";

const UserModel = {
  email: "",
  password: "",
  salt: "",
  id: -1, // [DEPRECATED DEFAULT]: was set to 1 to inc between as old counter
  jwt: "",
  role: SUPER_MODE ? 2 : 0,
  alertEnabled: true,
  emailConfirmed: false,
  profileVisible: false,
  lastLoginDate: "",
  passwordRequired: false,
  // api usage
  scanInfo: {
    lastScanDate: null,
    totalUptime: 0, // total scan uptime
  },
  websiteLimit: 1, // limit of websites a user can have
  googleId: "",
  githubId: null,
  resetCode: null,
  pageSpeedApiKey: "",
  stripeToken: "", // payments
};

// add defaults from user model and set the lastLoginDate to the current date
const makeUser = (extra: any = {}): typeof UserModel => {
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
