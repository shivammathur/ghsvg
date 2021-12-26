import * as axios from 'axios';
import * as camelcaseKeys from 'camelcase-keys';
import * as fs from 'fs';

export async function request(
  type: string,
  url: string,
  query?: string
): Promise<Record<string, any>> {
  try {
    const config = {
      headers: {
        Authorization: `bearer ${process.env['GITHUB_TOKEN']}`
      }
    };
    const response =
      type === 'get'
        ? await axios.default.get(url, config)
        : await axios.default.post(url, {query: query}, config);

    if (response.data.error) {
      console.error(`API failure: ${response.data.error}`);
      process.exit(1);
    }
    return response.data;
  } catch (error) {
    console.error(`API failure: ${url}`);
    process.exit(1);
  }
}

export async function getUserType(username: string): Promise<string> {
  return (
    await request('get', `https://api.github.com/users/${username}`)
  ).type.toLowerCase();
}

export async function getFields(type: string): Promise<Record<string, any>[]> {
  const response = await request(
    'post',
    'https://api.github.com/graphql',
    `
        {
          __type(name: "${type}") {
            fields {
              name
              description
              type {
                ofType {
                  kind
                }
              }
              args {
                name
                defaultValue
              }
            }
          }
        }
        `
  );
  return response.data.__type.fields;
}

export async function getAccountFragment(
  avatar_size?: number
): Promise<string> {
  const userFields = (await getFields('User'))
    .map((field: Record<string, any>) => {
      if (avatar_size && field.name === 'avatarUrl') {
        return `avatarUrl(size: ${avatar_size})`;
      } else if (field.args.length || field.type.ofType?.kind !== 'SCALAR') {
        return;
      }
      return field.name;
    })
    .filter(Boolean);
  const organizationFields = (await getFields('Organization'))
    .map((field: Record<string, any>) => {
      if (avatar_size && field.name === 'avatarUrl') {
        return `avatarUrl(size: ${avatar_size})`;
      } else if (
        field.args.length ||
        field.type.ofType?.kind !== 'SCALAR' ||
        field.name === 'membersCanForkPrivateRepositories'
      ) {
        return;
      }
      return field.name;
    })
    .filter(Boolean);
  return `
    ... on User {
      ${userFields.join('\n')}
    }
    ... on Organization {
      ${organizationFields.join('\n')}
    }
    `;
}

export async function getGithubSponsorsHelper(
  ghsOptions: Record<string, any>,
  results: any[] = [],
  cursor: undefined | string = undefined
): Promise<Record<string, any>[]> {
  const args = ['first: 100'];
  if (cursor) {
    args.push(`after:"${cursor}"`);
  }

  const query = `
    {
      ${ghsOptions.nodeType}(login: "${ghsOptions.username}") {
        ... on Sponsorable {
          sponsorshipsAsMaintainer(${args.join(', ')}) {
            totalCount
            pageInfo {
              endCursor
              hasNextPage
            }
            nodes {
              tier {
                id
                isOneTime
                isCustomAmount
                monthlyPriceInDollars
              }
              sponsorEntity {
                ${ghsOptions.accountFragment}
              }
            }
          }
        }
      }
    }`;
  const response = await request(
    'post',
    'https://api.github.com/graphql',
    query
  );
  const sponsorData: Record<string, any> =
    response.data[ghsOptions.nodeType].sponsorshipsAsMaintainer;
  const sponsorNodes: Record<string, any>[] = sponsorData.nodes
    .sort((a: Record<string, any>, b: Record<string, any>) => {
      return b?.tier?.monthlyPriceInDollars - a?.tier?.monthlyPriceInDollars;
    })
    .map((sponsorRecord: Record<string, any>) => {
      if (sponsorRecord.tier) {
        const [minimum, maximum]: number[] = sponsorRecord.tier.isOneTime
          ? ghsOptions.oneTimeTiersRange
          : sponsorRecord.tier.isCustomAmount
          ? ghsOptions.customAmountRange
          : ghsOptions.monthlyTiersRange;
        if (
          sponsorRecord.tier.monthlyPriceInDollars < minimum ||
          sponsorRecord.tier.monthlyPriceInDollars > maximum
        ) {
          return false;
        }
      }
      return sponsorRecord.sponsorEntity;
    })
    .filter(Boolean);
  results.push(...sponsorNodes);
  if (!ghsOptions.quiet) {
    process.stdout.write(
      `Fetching sponsors ${Math.floor(
        (results.length / sponsorData.totalCount) * 100
      )} % complete... \r`
    );
  }
  if (sponsorData['pageInfo']['hasNextPage']) {
    await getGithubSponsorsHelper(
      ghsOptions,
      results,
      sponsorData['pageInfo']['endCursor']
    );
  }
  return results;
}

export async function getGithubSponsorTiers(
  username: string
): Promise<Record<string, any>[]> {
  const tier_fields = await getFields('SponsorsTier');
  const response = await request(
    'post',
    'https://api.github.com/graphql',
    `
          {
            user(login: "${username}") {
              sponsorsListing {
                tiers(first: 20) {
                  nodes {
                    ${tier_fields.join('\n')}
                  }
                }
              }
            }
          }
        `
  );
  return response.data.user.sponsorsListing.tiers.nodes;
}

export async function getGithubSponsors(
  ghsOptions: Record<string, any>
): Promise<Record<string, any>[]> {
  ghsOptions.nodeType = await getUserType(ghsOptions.username);
  ghsOptions.accountFragment = await getAccountFragment(
    ghsOptions.svgImageWidth
  );
  return await getGithubSponsorsHelper(ghsOptions);
}

export async function getUser(username: string): Promise<Record<string, any>> {
  return camelcaseKeys.default(
    await request('get', `https://api.github.com/users/${username}`)
  );
}

export async function getOtherSponsors(
  filepath: string
): Promise<Record<string, string>[]> {
  if (!fs.existsSync(filepath)) {
    return [];
  }
  const sponsors = fs
    .readFileSync(filepath)
    .toString()
    .split(/\r?\n/)
    .filter(Boolean);
  return await Promise.all(
    sponsors.map(async sponsor => {
      return await getUser(sponsor);
    })
  );
}
