import { getWebsitesDaily } from "@app/core/controllers/websites/find";

const getDailyWebsites = async (req?: any, res?: any) => {
  let data = [];

  try {
    data = await getWebsitesDaily(req.query?.page ?? 0);
  } catch (e) {
    console.error(e);
  }

  res.send(data);
};

export { getDailyWebsites };
