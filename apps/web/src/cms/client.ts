import config from "@payload-config";
import { getPayload } from "payload";

/** The CMS from server code (route handlers, server actions). Payload caches the instance. */
export const cmsClient = () => getPayload({ config });
