export default {
  mongodbMemoryServerOptions: {
    binary: {
      version: "3.7.3",
      skipMD5: true,
    },
    instance: {
      dbName: "a11ywatch",
    },
    autoStart: true,
  },
};
