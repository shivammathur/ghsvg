var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as options from './options.js';
import * as gs from './ghs.js';
import * as svg from './svg.js';
dotenv.config();
export function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const ghsOptions = yield options.getOptions(process.argv);
        const data = [
            ...(yield gs.getOtherSponsors(ghsOptions.other)),
            ...(yield gs.getGithubSponsors(ghsOptions))
        ];
        fs.writeFileSync(ghsOptions.outFile, yield svg.createSVG(data, ghsOptions));
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield run();
}))().catch(error => {
    console.error(error);
});
//# sourceMappingURL=index.js.map