import { MongoClient, Collection } from "mongodb";
import { config } from "../config/config";

let client: MongoClient; // shared client across application
let connected = false; // is client connected

// create a mongodb client.
const createClient = (dbconnection?: string): MongoClient => {
  let client;

  try {
    client = new MongoClient(dbconnection || config.DB_URL);
  } catch (_) {
    console.info(
      "MongoDB not established. Start mongo on port 27017 to persist data."
    );
  }

  return client;
};

const initDbConnection = async (dbconnection?: string) => {
  client = createClient(dbconnection);

  if (client) {
    try {
      client = await client?.connect();
      connected = true;
    } catch (e) {
      console.error("MongoDB failed to connected.");
    }
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

const closeDbConnection = async () => {
  if (connected) {
    try {
      await client?.close();
      connected = false;
    } catch (e) {
      console.error(e);
    }
  }
};

export { client, connected, connect, initDbConnection, closeDbConnection };
