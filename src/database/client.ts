import { MongoClient } from "mongodb";
import { config } from "../config/config";

const createClient = (): MongoClient => {
  try {
    return new MongoClient(config.DB_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
  } catch (e) {
    console.error(e);
  }
};

let client: MongoClient; // shared client across application
let connection;

const initDbConnection = async () => {
  try {
    await closeDbConnection(); // reset db connections
  } catch (e) {
    console.error(e);
  }
  try {
    client = createClient();
    connection = await client?.connect();
  } catch (e) {
    console.log(e);
  }
};

const connect = async (collectionType = "Websites") => {
  let collection = [];

  try {
    const db = await connection?.db(config.DB_NAME);
    collection = await db?.collection(collectionType);
  } catch (e) {
    console.log(e);
  }

  return [collection, client];
};

// detect if client is connected
const isConnected = () =>
  client && client.topology && client.topology?.isConnected();

const closeDbConnection = async () => {
  try {
    if (isConnected()) {
      await client?.close();
    }
  } catch (e) {
    console.log(e);
  }
};

export { client, connect, initDbConnection, closeDbConnection };
