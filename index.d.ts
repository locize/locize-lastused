import { Module } from "i18next";

type AllowedHostsFunction = (hostname: string) => boolean;
export interface LocizeLastusedOptions {
  /**
   * your locize projectId
   */
  projectId: string;
  /**
   * your locize apikey (only use this in development) to add / update translations
   */
  apiKey: string;
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
   * hostnames that are allowed to create & update keys
   */
  allowedHosts?: string[] | AllowedHostsFunction;
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
