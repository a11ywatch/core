import { MongoClient, Collection, Db, Document } from "mongodb";
import { EventEmitter } from "events";
import { config } from "../config/config";
import { mdb } from "./mock-db";

let client: MongoClient; // shared client across application
let connected = false; // is client connected
let connectionState: "init" | "establishing" | "determined" = "init"; // determine connectivity detection state
let db: Db = null;

const dbEmitter = new (class DBEmitter extends EventEmitter {})();

// todo: enable dbless mode to disable persisting across stub 'client' and 'db' object methods.

// create a mongodb client.
const createClient = async (dbconnection?: string): Promise<MongoClient> => {
  let mclient: MongoClient;

  return new Promise((resolve) => {
    try {
      mclient = new MongoClient(dbconnection || config.DB_URL);
      connected = true;
    } catch (_) {
      console.error(
        "MongoDB not established. Start mongo on port 27017 to persist data and restart or use the `initDbConnection` method."
      );
    }

    resolve(mclient);
  });
};
let pagesCollection: Collection<Document> = null;
let analyticsCollection: Collection<Document> = null;
let issuesCollection: Collection<Document> = null;
let usersCollection: Collection<Document> = null;
let websitesCollection: Collection<Document> = null;
let actionsCollection: Collection<Document> = null;
let historyCollection: Collection<Document> = null;
let countersCollection: Collection<Document> = null;
let pageSpeedCollection: Collection<Document> = null;

// establish top level db connection
const initDbConnection = async (dbconnection?: string) => {
  client = await createClient(dbconnection);

  if (client) {
    client = await client.connect();
    db = client.db(config.DB_NAME);

    // establish app collections
    analyticsCollection = db.collection("Analytics");
    pagesCollection = db.collection("Pages");
    issuesCollection = db.collection("Issues");
    usersCollection = db.collection("Users");
    websitesCollection = db.collection("Websites");
    actionsCollection = db.collection("PageActions");
    historyCollection = db.collection("History");
    countersCollection = db.collection("Counters");
    pageSpeedCollection = db.collection("PageSpeed");
  }

  if (connectionState !== "determined") {
    dbEmitter.emit("event:init");
    connectionState = "determined";
  }
};

// @return [collection, client]  a MongoDb Collection to use and the top level client
const connect = (collectionType = "Websites"): [Collection, MongoClient] => [
  db ? db.collection(collectionType) : mdb,
  client,
];

const closeDbConnection = async () => {
  if (connected) {
    client && (await client.close());
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

export {
  db,
  client,
  connected,
  connect,
  pollTillConnected,
  initDbConnection,
  closeDbConnection,
  // collections
  analyticsCollection,
  issuesCollection,
  pagesCollection,
  usersCollection,
  websitesCollection,
  actionsCollection,
  historyCollection,
  countersCollection,
  pageSpeedCollection,
};
