var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as commander from 'commander';
import * as config from './config.js';
const program = new commander.Command();
program
    .option('-u, --username [username]', 'username to fetch the sponsors')
    .option('-q, --quiet', "don't log anything", false)
    .option('-r, --range [minimum-maximum|all]', 'specify a range in dollar amounts for tiers')
    .option('-mr, --monthly-tiers-range [none|minimum-maximum|all]', 'specify a different range for monthly sponsor tiers')
    .option('-or, --one-time-tiers-range [none|minimum-maximum|all]', 'specify a different range for one-time sponsors tiers')
    .option('-cr, --custom-amount-range [none|minimum-maximum|all]', 'specify a different range for custom amounts')
    .option('-os, --other-sponsors [file]', 'specify a file with sponsors other than GitHub Sponsors')
    .option('-sw, --svg-width [svgWidth]', 'width of the svg')
    .option('-siw, --svg-image-width [svgImageWidth]', 'width of each image in the svg')
    .option('-o, --out-file [outFile]', 'Output svg file.');
export function getRange(type, cliOpts, configOpts) {
    return __awaiter(this, void 0, void 0, function* () {
        let range = 'all';
        if (cliOpts[type] && cliOpts[type] != 'all') {
            cliOpts[type] = /^\d+$/.test(cliOpts[type].toString())
                ? [cliOpts[type], cliOpts[type]].join('-')
                : cliOpts[type];
            range = cliOpts[type]
                .toString()
                .split(/ *- */)
                .map((opt) => parseInt(opt));
        }
        else if (configOpts[type] && configOpts[type] != 'all') {
            range = Array.isArray(configOpts[type])
                ? configOpts[type].map((opt) => parseInt(opt))
                : [parseInt(configOpts[type]), parseInt(configOpts[type])];
        }
        else if (type != 'range') {
            range = yield getRange('range', cliOpts, configOpts);
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
    });
}
export function getOptions(args) {
    return __awaiter(this, void 0, void 0, function* () {
        program.parse(args);
        const configOpts = yield config.getConfig();
        const cliOpts = program.opts();
        return {
            username: cliOpts.username || configOpts.username,
            range: yield getRange('range', cliOpts, configOpts),
            monthlyTiersRange: yield getRange('monthlyTiersRange', cliOpts, configOpts),
            oneTimeTiersRange: yield getRange('oneTimeTiersRange', cliOpts, configOpts),
            customAmountRange: yield getRange('customAmountRange', cliOpts, configOpts),
            svgWidth: cliOpts.svgWidth || configOpts.svgWidth || 1024,
            svgImageWidth: cliOpts.svgImageWidth || configOpts.svgImageWidth || 64,
            outFile: cliOpts.outFile || configOpts.outFile || 'sponsors.svg',
            otherSponsors: cliOpts.otherSponsors || configOpts.otherSponsors,
            quiet: cliOpts.quiet
        };
    });
}
//# sourceMappingURL=options.js.map