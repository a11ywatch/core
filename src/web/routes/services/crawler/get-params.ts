// get the params from the active crawl
export const getParams = (data) => {
  return data && typeof data == "string"
    ? JSON.parse(data)
    : { domain: undefined, user_id: undefined };
};
