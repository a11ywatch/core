import { Collection, Document } from "mongodb";

const resObject = () => {
  return null;
};
const resArray = () => {
  return [];
};

// find recursive builder mock
const preFind = () => {
  return {
    skip: resArray,
    limit: resArray,
    toArray: resArray,
    clone: resArray,
    map: resArray,
    filter: resArray,
    count: 0,
  };
};

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
  countDocuments: () => Promise.resolve(0),
};
