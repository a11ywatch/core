import { MongoClient, Collection, Db } from "mongodb";
import { EventEmitter } from "events";
import { config } from "../config/config";

let client: MongoClient; // shared client across application
let connected = false; // is client connected
let connectionState: "init" | "establishing" | "determined" = "init"; // determine connectivity detection state
let db: Db = null;

const dbEmitter = new (class DBEmitter extends EventEmitter {})();

// create a mongodb client.
const createClient = async (dbconnection?: string): Promise<MongoClient> => {
  let mclient: MongoClient;

  return new Promise((resolve) => {
    try {
      mclient = new MongoClient(dbconnection || config.DB_URL);
      connected = true;
    } catch (_) {
      console.error(
        "MongoDB not established. Start mongo on port 27017 to persist data."
      );
    }

    resolve(mclient);
  });
};

// establish top level db connection
const initDbConnection = async (dbconnection?: string) => {
  client = await createClient(dbconnection);

  if (client) {
    client = await client.connect();
    db = client.db(config.DB_NAME);
  }

  if (connectionState !== "determined") {
    dbEmitter.emit("event:init");
    connectionState = "determined";
  }
};

// @return [collection, client]  a MongoDb Collection to use and the top level client
const connect = (collectionType = "Websites"): [Collection, MongoClient] => [
  db.collection(collectionType),
  client,
];

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
    if (!connected && connectionState !== "determined") {
      connectionState = "establishing"; // mid state to determine extra reqs
      const maxTimeout = setTimeout(() => {
        resolve(connected);
      }, 100);
      dbEmitter.once("event:init", () => {
        maxTimeout && clearTimeout(maxTimeout);
        resolve(connected);
      });
      return;
    }
    resolve(connected);
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
