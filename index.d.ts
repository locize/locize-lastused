import { Module } from "i18next";

export interface LocizeLastusedOptions {
  /**
   * your locize projectId
   */
  projectId: string;
  /**
   * your locize apikey (only use this in development); falls back to `backend.apiKey`
   */
  apiKey?: string;
  /**
   * the reference (source) language of your project (default "en")
   */
  referenceLng?: string;
  /**
   * the version of translations to load
   */
  version?: string;
  /**
   * path to post last used information
   */
  lastUsedPath?: string;
  /**
   * allow cross domain requests
   */
  crossDomain?: boolean;
  /**
   * set JSON as content type
   */
  setContentTypeJSON?: boolean;
  /**
   * the first new key starts a wait of this many milliseconds, then everything waiting is sent (default 90000)
   */
  debounceSubmit?: number;
  /**
   * a key looked up again this long after it was sent is sent again, in milliseconds (default 43500000, 12 hours and 5 minutes)
   */
  resubmitAfter?: number;
  /**
   * hostnames that are allowed to send last used data (default ["localhost"])
   */
  allowedHosts?: readonly string[];
}

declare module "i18next" {
  // i18next <= 26 also declares `locizeLastUsed` on InitOptions; that type has to stay assignable to this one.
  interface CustomPluginOptions {
    locizeLastUsed?: LocizeLastusedOptions;
  }
}

declare class LocizeLastusedBackend implements Module
{
  static type: "3rdParty";

  init(
    options?: LocizeLastusedOptions,
  ): void;


  type: "3rdParty";
  options: LocizeLastusedOptions;
}

export default LocizeLastusedBackend;
