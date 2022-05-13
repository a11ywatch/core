export interface MessageData {
  pages: string[];
  user_id: number;
  meta: any; // meta information to call certain events
}

// Extract string data as json from queue message
export const parseData = (message, single?: boolean, skip?: boolean) => {
  let data: MessageData;
  try {
    if (single) {
      data = typeof message === "string" ? JSON.parse(message) : message;
    } else {
      data =
        typeof message === "string" ? JSON.parse(JSON.parse(message)) : message;
    }
  } catch (e) {
    if (!skip) {
      // retry once
      parseData(message, true, true);
    } else {
      console.error(e);
    }
  }

  return data;
};
