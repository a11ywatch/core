import { EventEmitter } from "events";

// app emitter
class AppEmitter extends EventEmitter {}

const appEmitter = new AppEmitter(); // determine app events

export { appEmitter };
