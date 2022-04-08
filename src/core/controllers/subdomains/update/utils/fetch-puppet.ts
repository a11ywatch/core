import fetcher from "node-fetch";

export const fetchPuppet = async ({
  userId,
  url,
  pageHeaders,
  pageInsights,
}: any) => {
  let dataSource;
  try {
    // MOVE TO gRPC CALL
    const data = await fetcher(
      `${process.env.PUPPET_SERVICE}/api/getPageIssues`,
      {
        method: "POST",
        body: JSON.stringify({
          pageHeaders:
            pageHeaders && Array.isArray(pageHeaders) ? pageHeaders : undefined,
          url: String(encodeURIComponent(url)),
          userId,
          pageInsights,
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    if (data?.status === 200) {
      dataSource = await data?.json();
    }
  } catch (e) {
    console.error(e);
  }

  return dataSource;
};
