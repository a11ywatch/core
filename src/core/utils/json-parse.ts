import { struct, Struct } from "pb-util";

// parse json either from a restful endpoint or from gRPC Json Struct
export const jsonParse = (json: string | Struct) => {
  let jsonData;
  try {
    // string was sent instead gRPC type for back compat or API call usage
    if (typeof json === "string") {
      jsonData = JSON.parse(json);
    } else if ("fields" in json) {
      jsonData = struct.decode(json);
    }
  } catch (e) {
    console.error(e);
  }

  return jsonData;
};
