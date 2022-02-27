import { MongoClient } from "mongodb";
import { config } from "@app/config";
import { log } from "@a11ywatch/log";

const createClient = (): MongoClient =>
  new MongoClient(config.DB_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

let client: MongoClient;

try {
  client = createClient();
} catch (e) {
  log(e);
}

let connection;

const initDbConnection = async () => {
  try {
    if (process.send !== undefined) {
      client = createClient();
    }
    connection = await client?.connect();
  } catch (e) {
    log(e);
  }
};

const connect = async (collectionType = "Websites") => {
  let collection = [];

  try {
    const db = await connection?.db(config.DB_NAME);
    collection = await db?.collection(collectionType);
  } catch (e) {
    log(e);
  }

  return [collection, client];
};

const closeDbConnection = async () => {
  try {
    await client?.close();
  } catch (e) {
    log(e);
  }
};

export { client, connect, initDbConnection, closeDbConnection };
