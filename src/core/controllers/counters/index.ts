import type { Collection, Document, WithId } from "mongodb";
import { connect } from "../../../database";
import { websiteSearchParams } from "../../utils";

const getCounter = async ({
  _id,
}): Promise<[WithId<Document>, Collection<Document>]> => {
  try {
    const [collection] = await connect("Counters");
    const counter = await collection.findOne({ _id });

    return [counter, collection];
  } catch (e) {
    console.error(e);
    return [null, null];
  }
};

const getNextSequenceValue = async (sequenceName) => {
  try {
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
  } catch (e) {
    console.error(e);
  }
};

const CountersController = ({ user } = { user: null }) => ({
  fixCounters: async (_, chain) => {
    try {
      const [collection] = await connect("Counters");
      const counters = await collection.find().limit(150).toArray();

      return chain ? [counters, collection] : counters;
    } catch (e) {
      console.error(e);
    }
  },
  getCounter,
  getNextSequenceValue,
  getCounters: async ({ userId, pageUrl, url }) => {
    try {
      const [collection] = await connect("Counters");
      return await collection
        .find(websiteSearchParams({ pageUrl, userId }))
        .limit(20)
        .toArray();
    } catch (e) {
      console.error(e);
    }
  },
});

export { getCounter, getNextSequenceValue, CountersController };
