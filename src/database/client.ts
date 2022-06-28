import { MongoClient, Collection } from "mongodb";
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

const initDbConnection = async () => {
  try {
    await closeDbConnection(); // reset db connections
  } catch (e) {
    console.error(e);
  }
  try {
    client = createClient();
    client = await client?.connect();
  } catch (e) {
    console.error("MongoDB not connected:", e);
  }
};

// @return [collection, client]  a MongoDb Collection to use and the top level client? TODO: refactor
const connect = async (
  collectionType = "Websites"
): Promise<[Collection, MongoClient]> => {
  let collection: Collection<any>;

  try {
    const db = await client?.db(config.DB_NAME);
    collection = await db?.collection(collectionType);
  } catch (e) {
    console.error(e);
  }

  return [collection, client];
};

// detect if client is connected use back compat topology
const isConnected = () => {
  if (client && "topology" in client) {
    // @ts-ignore
    return client && client.topology && client.topology?.isConnected();
  }
  return client?.isConnected();
};

const closeDbConnection = async () => {
  try {
    if (isConnected()) {
      await client?.close();
    }
  } catch (e) {
    console.error(e);
  }
};

export { client, connect, initDbConnection, closeDbConnection };
