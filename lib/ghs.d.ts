export declare function request(
  type: string,
  url: string,
  query?: string
): Promise<Record<string, any>>;
export declare function getUserType(username: string): Promise<string>;
export declare function getFields(type: string): Promise<Record<string, any>[]>;
export declare function getAccountFragment(
  avatar_size?: number
): Promise<string>;
export declare function getGithubSponsorsHelper(
  ghsOptions: Record<string, any>,
  results?: any[],
  cursor?: undefined | string
): Promise<Record<string, any>[]>;
export declare function getGithubSponsorTiers(
  username: string
): Promise<Record<string, any>[]>;
export declare function getGithubSponsors(
  ghsOptions: Record<string, any>
): Promise<Record<string, any>[]>;
export declare function getUser(username: string): Promise<Record<string, any>>;
export declare function getOtherSponsors(
  filepath: string
): Promise<Record<string, string>[]>;
