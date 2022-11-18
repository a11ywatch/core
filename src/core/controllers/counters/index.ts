import type { Collection, Document, WithId } from "mongodb";
import { connect } from "../../../database";
import { websiteSearchParams } from "../../utils";

const getCounter = async ({
  _id,
}): Promise<[WithId<Document>, Collection<Document>]> => {
  const [collection] = connect("Counters");
  const counter = await collection.findOne({ _id });

  return [counter, collection];
};

const getNextSequenceValue = async (sequenceName) => {
  const [hascounter, collection] = await getCounter({
    _id: sequenceName,
  });

  // insert first counter
  if (!hascounter) {
    await collection.insertOne({ _id: sequenceName, sequence_value: 0 });
    return 0;
  }

  const sequenceDocument = await collection.findOneAndUpdate(
    {
      _id: sequenceName,
    },
    { $inc: { sequence_value: 1 } },
    {
      // @ts-ignore
      returnNewDocument: true,
      projection: { sequence_value: 1, _id: 1 },
    }
  );

  // @ts-ignore
  return sequenceDocument?.value?.sequence_value;
};

const CountersController = ({ user } = { user: null }) => ({
  fixCounters: async (_, chain) => {
    const [collection] = connect("Counters");
    const counters = await collection.find().limit(150).toArray();

    return chain ? [counters, collection] : counters;
  },
  getCounter,
  getNextSequenceValue,
  getCounters: async ({ userId, pageUrl, url }) => {
    const [collection] = connect("Counters");
    return await collection
      .find(websiteSearchParams({ pageUrl, userId }))
      .limit(20)
      .toArray();
  },
});

export { getCounter, getNextSequenceValue, CountersController };
