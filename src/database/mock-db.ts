import { Collection, Document } from "mongodb";

const resObject = () => null;

const resArray = () => {
  return [];
};

const resEnd = () => {
  return {
    toArray: resArray,
  }
};

// find recursive builder mock
const preFind = () => {
  return {
    skip: resEnd,
    limit: resEnd,
    toArray: resArray,
    clone: resEnd,
    map: resEnd,
    filter: resEnd,
    count: 0,
  };
};

const resPromise = () => Promise.resolve(0);

// partial mock db imp todo: use collection object proxy
export const mdb: Collection<Document> = {
  // @ts-ignore partial imp find
  find: () => {
    return {
      skip: preFind,
      limit: preFind,
      toArray: preFind,
      clone: preFind,
      map: preFind,
      filter: preFind,
      count: 0,
    };
  },
  findOne: resObject,
  findOneAndUpdate: resObject,
  countDocuments: resPromise,
  deleteOne: resObject,
  insertOne: resObject,
  updateMany: resObject,
  updateOne: resObject,
};
