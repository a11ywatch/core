// the types of messages to send generically
export enum HttpMessage {
  Ok,
  NoContent,
  BadRequest,
  Unauthorized,
  ToManyRequest,
  Error,
}

// valid status codes
export enum StatusCode {
  Ok = 200,
  NoContent = 203,
  BadRequest = 400,
  Unauthorized = 401,
  ToManyRequest = 429,
  Error = 500,
}

// get the status code for the message
export const getStatusCodes = (message: HttpMessage): number => {
  return StatusCode[HttpMessage[message]];
};
