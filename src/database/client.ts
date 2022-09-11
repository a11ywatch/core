import { MongoClient, Collection } from "mongodb";
import { EventEmitter } from "events";
import { config } from "../config/config";

let client: MongoClient; // shared client across application
let connected = false; // is client connected
let connectionState: "init" | "establishing" | "determined" = "init"; // determine connectivity detection state

const dbEmitter = new (class DBEmitter extends EventEmitter {})();

// create a mongodb client.
const createClient = (dbconnection?: string): MongoClient => {
  let client;

  try {
    client = new MongoClient(dbconnection || config.DB_URL);
    connected = true;
  } catch (_) {
    console.error(
      "MongoDB not established. Start mongo on port 27017 to persist data."
    );
  }

  return client;
};

// establish top level db connection
const initDbConnection = async (dbconnection?: string) => {
  client = createClient(dbconnection);

  if (client) {
    client = await client.connect();
  }

  if (connectionState !== "determined") {
    dbEmitter.emit("event:init");
    connectionState = "determined";
  }
};

// @return [collection, client]  a MongoDb Collection to use and the top level client? TODO: refactor
const connect = async (
  collectionType = "Websites"
): Promise<[Collection, MongoClient]> => {
  const db = await client?.db(config.DB_NAME);
  const collection: Collection<any> = await db?.collection(collectionType);

  return [collection, client];
};

const closeDbConnection = async () => {
  if (connected) {
    await client.close();
    connected = false;
  }
};

// determine connection status
const pollTillConnected = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    // if the connection state has not ran yet
    if (connectionState !== "determined") {
      const maxTimeout = setTimeout(() => {
        resolve(connected);
      }, 100);
      connectionState = "establishing"; // mid state to determine extra reqs
      dbEmitter.once("event:init", () => {
        if (maxTimeout) {
          clearTimeout(maxTimeout);
        }
        resolve(connected);
      });
    } else {
      resolve(connected);
    }
  });
};

// todo: determine indexs on startup for application

export {
  client,
  connected,
  connect,
  pollTillConnected,
  initDbConnection,
  closeDbConnection,
};
