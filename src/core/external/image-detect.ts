import fetcher from "node-fetch";

export const imageDetect = async ({ img }: { img: string }): Promise<any> => {
  let dataSource;
  try {
    const data = await fetcher(`${process.env.MAV_CLIENT_URL}/api/parseImg`, {
      method: "POST",
      body: JSON.stringify({
        img: String(img),
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (data.status === 200) {
      dataSource = await data?.json();
    }
  } catch (e) {
    console.error(e);
  }
  return dataSource;
};
