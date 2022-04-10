jest.mock("ioredis", () => {
  const rmock = require("ioredis-mock");
  rmock.prototype.call = (args) => args;
  return rmock;
});
