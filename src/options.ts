import * as commander from 'commander';
import * as config from './config.js';
const program = new commander.Command();
const LEGACY_FLAG_MAP: Record<string, string> = {
  '-mr': '--mr',
  '-or': '--or',
  '-cr': '--cr',
  '-os': '--os',
  '-sw': '--sw',
  '-siw': '--siw',
  '-sis': '--sis'
};

program
  .option('-u, --username [username]', 'username to fetch the sponsors')
  .option('-q, --quiet', "don't log anything", false)
  .option(
    '-r, --range [minimum-maximum|all]',
    'specify a range in dollar amounts for tiers'
  )
  .option(
    '--mr, --monthly-tiers-range [none|minimum-maximum|all]',
    'specify a different range for monthly sponsor tiers'
  )
  .option(
    '--or, --one-time-tiers-range [none|minimum-maximum|all]',
    'specify a different range for one-time sponsors tiers'
  )
  .option(
    '--cr, --custom-amount-range [none|minimum-maximum|all]',
    'specify a different range for custom amounts'
  )
  .option(
    '--os, --other-sponsors [file]',
    'specify a file with sponsors other than GitHub Sponsors'
  )
  .option('--sw, --svg-width [svgWidth]', 'width of the svg', parseFloat)
  .option(
    '--siw, --svg-image-width [svgImageWidth]',
    'width of each image in the svg',
    parseFloat
  )
  .option(
    '--sis, --svg-image-space [svgImageSpace]',
    'space between each image in the svg',
    parseFloat
  )
  .option('-o, --out-file [outFile]', 'Output svg file.');

export function normalizeLegacyArgs(args: string[]): string[] {
  return args.map(arg => {
    if (LEGACY_FLAG_MAP[arg]) {
      return LEGACY_FLAG_MAP[arg];
    }

    const separatorIndex = arg.indexOf('=');
    if (separatorIndex !== -1) {
      const flag = arg.slice(0, separatorIndex);
      const value = arg.slice(separatorIndex + 1);
      if (LEGACY_FLAG_MAP[flag]) {
        return `${LEGACY_FLAG_MAP[flag]}=${value}`;
      }
    }

    return arg;
  });
}

export async function getRange(
  type: string,
  cliOpts: Record<string, any>,
  configOpts: Record<string, any>
): Promise<string | number[]> {
  let range: any = 'all';
  if (cliOpts[type] && cliOpts[type] != 'all') {
    cliOpts[type] = /^\d+$/.test(cliOpts[type].toString())
      ? [cliOpts[type], cliOpts[type]].join('-')
      : cliOpts[type];
    range = cliOpts[type]
      .toString()
      .split(/ *- */)
      .map((opt: string) => parseInt(opt));
  } else if (configOpts[type] && configOpts[type] != 'all') {
    range = Array.isArray(configOpts[type])
      ? configOpts[type].map((opt: string) => parseInt(opt))
      : [parseInt(configOpts[type]), parseInt(configOpts[type])];
  } else if (type != 'range') {
    range = await getRange('range', cliOpts, configOpts);
  }

  if (Array.isArray(range)) {
    if (range[0] > range[1]) {
      console.error(`Minimum cannot be greater than maximum in ${type}.`);
      process.exit(1);
    }
    if (range.some(el => !Number.isInteger(el)) || range.length != 2) {
      console.error(`Wrong value for ${type}.`);
      process.exit(1);
    }
  }

  return range;
}

export async function getOptions(args: string[]): Promise<Record<string, any>> {
  program.parse(normalizeLegacyArgs(args), {from: 'node'});

  const configOpts: Record<string, any> = await config.getConfig();
  const cliOpts = program.opts();

  const svgImageWidth: number =
    cliOpts.svgImageWidth || configOpts.svgImageWidth || 64;
  const svgImageSpace: number =
    cliOpts.svgImageSpace ||
    configOpts.svgImageSpace ||
    Math.floor(svgImageWidth / 10);

  return {
    username: cliOpts.username || configOpts.username,
    range: await getRange('range', cliOpts, configOpts),
    monthlyTiersRange: await getRange('monthlyTiersRange', cliOpts, configOpts),
    oneTimeTiersRange: await getRange('oneTimeTiersRange', cliOpts, configOpts),
    customAmountRange: await getRange('customAmountRange', cliOpts, configOpts),
    svgWidth: cliOpts.svgWidth || configOpts.svgWidth || 1024,
    svgImageWidth: svgImageWidth,
    svgImageSpace: svgImageSpace,
    outFile: cliOpts.outFile || configOpts.outFile || 'sponsors.svg',
    otherSponsors: cliOpts.otherSponsors || configOpts.otherSponsors,
    quiet: cliOpts.quiet
  };
}
