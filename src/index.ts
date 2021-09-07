import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as options from './options.js';
import * as gs from './ghs.js';
import * as svg from './svg.js';

dotenv.config();

export async function run() {
  const ghsOptions: any = await options.getOptions(process.argv);
  const data = [
    ...(await gs.getOtherSponsors(ghsOptions.other)),
    ...(await gs.getGithubSponsors(ghsOptions))
  ];
  fs.writeFileSync(ghsOptions.outFile, await svg.createSVG(data, ghsOptions));
}

// call the run function
(async () => {
  await run();
})().catch(error => {
  console.error(error);
});
