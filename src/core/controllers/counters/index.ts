import type { Collection, Document, WithId } from "mongodb";
import { countersCollection } from "../../../database";
import { websiteSearchParams } from "../../utils";

const getCounter = async ({
  _id,
}): Promise<[WithId<Document>, Collection<Document>]> => {
  const counter = await countersCollection.findOne({ _id });

  return [counter, countersCollection];
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
    const counters = await countersCollection.find().limit(150).toArray();

    return chain ? [counters, countersCollection] : counters;
  },
  getCounter,
  getNextSequenceValue,
  getCounters: async ({ userId, pageUrl }) =>
    await countersCollection
      .find(websiteSearchParams({ pageUrl, userId }))
      .limit(20)
      .toArray(),
});

export { getCounter, getNextSequenceValue, CountersController };
