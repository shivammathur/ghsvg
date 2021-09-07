var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { dirname, join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { cosmiconfig } from 'cosmiconfig';
import { importDefault } from './import.js';
const CONFIG_FILENAMES = [
    '.ghsrc',
    '.ghsrc.json',
    '.ghsrc.json5',
    '.ghsrc.js',
    '.ghsrc.cjs',
    '.ghsrc.mjs',
    '.ghsrc.yaml',
    '.ghsrc.yml',
    '.ghsrc.toml'
];
function loadMjs(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!importDefault) {
            throw new Error("Internal error: Native ECMAScript modules aren't supported" +
                ' by this platform.\n');
        }
        try {
            return yield importDefault(pathToFileURL(filePath).toString());
        }
        catch (error) {
            throw new Error(`mjs Error in ${filePath}:\n${error}`);
        }
    });
}
function loadJson5(filePath, content) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const json5 = yield importDefault('json5');
            return json5.parse(content);
        }
        catch (error) {
            throw new Error(`JSON5 Error in ${filePath}:\n${error}`);
        }
    });
}
function loadToml(filePath, content) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const toml = yield importDefault('@iarna/toml');
            return toml.parse(content);
        }
        catch (error) {
            throw new Error(`TOML Error in ${filePath}:\n${error}`);
        }
    });
}
export function getConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const configResult = yield cosmiconfig('ghsrc', {
            transform: (result) => {
                if (result && result.config) {
                    if (typeof result.config === 'string') {
                        const dir = dirname(result.filepath);
                        const modulePath = resolve(join(dir, result.config));
                        result.config = require(modulePath);
                    }
                    if (typeof result.config !== 'object') {
                        throw new Error('Config is only allowed to be an object, ' +
                            `but received ${typeof result.config} in "${result.filepath}"`);
                    }
                    delete result.config.$schema;
                }
                return result;
            },
            searchPlaces: CONFIG_FILENAMES,
            loaders: {
                '.json5': loadJson5,
                '.mjs': loadMjs,
                '.toml': loadToml
            }
        }).search();
        return configResult === null || configResult === void 0 ? void 0 : configResult.config;
    });
}
//# sourceMappingURL=config.js.map