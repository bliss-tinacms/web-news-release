import { createClient } from "tinacms/dist/client";
import { queries } from "./types.js";
export const client = createClient({ url: 'https://www.webnewsrelease.com/tina-content-proxy', token: '710974f2c3690c154687b717659256e9a06939ed', queries,  });
export default client;
  