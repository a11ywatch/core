import { createTestClient } from "apollo-server-testing";
import { getServerConfig } from "@app/apollo-server";
import gql from "graphql-tag";
import { initDbConnection, closeDbConnection } from "@app/database";
import { ApolloServer } from "apollo-server-fastify";

let server: ApolloServer;

describe("user", () => {
  beforeAll(async () => {
    await initDbConnection();
  });
  afterAll(async (done) => {
    await server.stop();
    await closeDbConnection();
    done();
  });
  test("create user successfully", async (done) => {
    server = new ApolloServer(getServerConfig());
    const { mutate } = createTestClient(server);

    const mutation = gql`
      mutation Register($email: String!, $password: String!) {
        register(email: $email, password: $password) {
          id
          email
        }
      }
    `;

    const email = "nancy@foo.co";
    const res = await mutate({
      mutation,
      variables: { email, password: "password" },
    });

    expect(res.data.register.email).toBe(email);
    done();
  });
});
