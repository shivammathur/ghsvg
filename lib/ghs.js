var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as axios from 'axios';
import * as camelcaseKeys from 'camelcase-keys';
import * as fs from 'fs';
export function request(type, url, query) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = {
                headers: {
                    Authorization: `bearer ${process.env['GITHUB_TOKEN']}`
                }
            };
            const response = type === 'get'
                ? yield axios.default.get(url, config)
                : yield axios.default.post(url, { query: query }, config);
            if (response.data.error) {
                console.error(`API failure: ${response.data.error}`);
                process.exit(1);
            }
            return response.data;
        }
        catch (error) {
            console.error(`API failure: ${url}`);
            process.exit(1);
        }
    });
}
export function getUserType(username) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield request('get', `https://api.github.com/users/${username}`)).type.toLowerCase();
    });
}
export function getFields(type) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield request('post', 'https://api.github.com/graphql', `
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
        `);
        return response.data.__type.fields;
    });
}
export function getAccountFragment(avatar_size) {
    return __awaiter(this, void 0, void 0, function* () {
        const userFields = (yield getFields('User'))
            .map((field) => {
            var _a;
            if (avatar_size && field.name === 'avatarUrl') {
                return `avatarUrl(size: ${avatar_size})`;
            }
            else if (field.args.length || ((_a = field.type.ofType) === null || _a === void 0 ? void 0 : _a.kind) !== 'SCALAR') {
                return;
            }
            return field.name;
        })
            .filter(Boolean);
        const organizationFields = (yield getFields('Organization'))
            .map((field) => {
            var _a;
            if (avatar_size && field.name === 'avatarUrl') {
                return `avatarUrl(size: ${avatar_size})`;
            }
            else if (field.args.length || ((_a = field.type.ofType) === null || _a === void 0 ? void 0 : _a.kind) !== 'SCALAR') {
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
    });
}
export function getGithubSponsorsHelper(ghsOptions, results = [], cursor = undefined) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const response = yield request('post', 'https://api.github.com/graphql', query);
        const sponsorData = response.data[ghsOptions.nodeType].sponsorshipsAsMaintainer;
        const sponsorNodes = sponsorData.nodes
            .map((sponsorRecord) => {
            if (sponsorRecord.tier) {
                const [minimum, maximum] = sponsorRecord.tier.isOneTime
                    ? ghsOptions.oneTimeTiersRange
                    : sponsorRecord.tier.isCustomAmount
                        ? ghsOptions.customAmountRange
                        : ghsOptions.monthlyTiersRange;
                if (sponsorRecord.tier.monthlyPriceInDollars < minimum ||
                    sponsorRecord.tier.monthlyPriceInDollars > maximum) {
                    return false;
                }
            }
            return sponsorRecord.sponsorEntity;
        })
            .filter(Boolean);
        results.push(...sponsorNodes);
        if (!ghsOptions.quiet) {
            process.stdout.write(`Fetching sponsors ${Math.floor((results.length / sponsorData.totalCount) * 100)} % complete... \r`);
        }
        if (sponsorData['pageInfo']['hasNextPage']) {
            yield getGithubSponsorsHelper(ghsOptions, results, sponsorData['pageInfo']['endCursor']);
        }
        return results;
    });
}
export function getGithubSponsorTiers(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const tier_fields = yield getFields('SponsorsTier');
        const response = yield request('post', 'https://api.github.com/graphql', `
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
        `);
        return response.data.user.sponsorsListing.tiers.nodes;
    });
}
export function getGithubSponsors(ghsOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        ghsOptions.nodeType = yield getUserType(ghsOptions.username);
        ghsOptions.accountFragment = yield getAccountFragment(ghsOptions.svgImageWidth);
        return yield getGithubSponsorsHelper(ghsOptions);
    });
}
export function getUser(username) {
    return __awaiter(this, void 0, void 0, function* () {
        return camelcaseKeys.default(yield request('get', `https://api.github.com/users/${username}`));
    });
}
export function getOtherSponsors(filepath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs.existsSync(filepath)) {
            return [];
        }
        const sponsors = fs
            .readFileSync(filepath)
            .toString()
            .split(/\r?\n/)
            .filter(Boolean);
        return yield Promise.all(sponsors.map((sponsor) => __awaiter(this, void 0, void 0, function* () {
            return yield getUser(sponsor);
        })));
    });
}
//# sourceMappingURL=ghs.js.map