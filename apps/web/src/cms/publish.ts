import { APIError, type CollectionBeforeChangeHook } from "payload";
import { recentlyAuthenticated } from "./access";

/**
 * Publishing anything learners see is always-ask (docs/10): only the creator,
 * confirmed with their passkey in the last five minutes.
 */
export const requireCreatorToPublish: CollectionBeforeChangeHook = ({ data, req }) => {
  if (data._status === "published" && !req.context?.system && !recentlyAuthenticated(req)) throw new APIError("Publishing needs the creator to confirm with their passkey first.", 403);
  return data;
};
