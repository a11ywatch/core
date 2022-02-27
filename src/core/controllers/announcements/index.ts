import { connect } from "@app/database";

export const AnnouncementsController = ({ user } = { user: null }) => ({
  getAnnouncement: async ({ _id }: any, chain: boolean) => {
    const [collection] = await connect("Announcements");
    const result = await collection.findOne({}, { sort: { $natural: -1 } });

    return chain ? [result, collection] : result;
  },
  getAnnouncements: async (): Promise<any[]> => {
    const [collection] = await connect("Announcements");
    return await collection.find().limit(20).toArray();
  },
  initAnnouncement: async (announcements: any[] = []): Promise<boolean> => {
    const [collection] = await connect("Announcements");

    if (announcements?.length) {
      await collection.deleteMany();
      await collection.insertMany(announcements);
      return true;
    }
    return false;
  },
});
