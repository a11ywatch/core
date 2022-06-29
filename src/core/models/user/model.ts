import { SUPER_MODE } from "@app/config/config";
import { User } from "@app/schema";

const UserModel = {
  email: "",
  password: "",
  salt: "",
  id: -1, // [DEPRECATED DEFAULT]: was set to 1 to inc between as old counter
  jwt: "",
  role: process.env.SUPER_MODE ? 2 : 0,
  alertEnabled: true,
  emailConfirmed: false,
  profileVisible: false,
  lastLoginDate: "",
  passwordRequired: false,
  apiUsage: {
    lastScanDate: null,
    usage: 0, // amount of API calls made per day
    usageLimit: 3, // the limit to reset to after the day
  },
  scanInfo: {
    lastScanDate: null,
    scanAttempts: 0,
    usageLimit: 3,
  },
  websiteLimit: 1, // limit of websites a user can have
  googleId: "",
  githubId: null,
  resetCode: null,
  pageSpeedApiKey: "",
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

// wrap user with extensions based on the runtime
const extendUser = (user: User) => {
  if (!user) {
    return null;
  }
  let role = user.role;
  if (SUPER_MODE) {
    role = 3;
  }
  return { ...user, pageSpeedApiKey: user?.pageSpeedApiKey ?? "", role };
};

export { UserModel, makeUser, extendUser };
