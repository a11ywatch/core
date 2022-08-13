// the types of messages to send generically
export enum HttpMessage {
  Ok,
  Unauthorized,
  Error,
  RateExceeded,
  BadRequest,
}

// valid status codes
export enum StatusCode {
  Ok = 200,
  Unauthorized = 401,
  Error = 500,
  RateLimit = 403,
  BadRequest = 400,
}

// get the status code for the message
export const getStatusCodes = (message: HttpMessage): number => {
  return StatusCode[HttpMessage[message]];
};
