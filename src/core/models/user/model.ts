const UserModel = {
  email: "",
  password: "",
  salt: "",
  id: -1,
  jwt: "",
  role: 0,
  alertEnabled: true,
  emailConfirmed: false,
  googleId: "",
  profileVisible: false,
  lastLoginDate: "",
  passwordRequired: false,
  websiteLimit: 0, // limit of websites a user can have
};

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
