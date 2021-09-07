import {dirname, join, resolve} from 'path';
import {pathToFileURL} from 'url';
import {cosmiconfig} from 'cosmiconfig';
import type {CosmiconfigResult} from 'cosmiconfig/dist/types';
import {importDefault} from './import.js';

const CONFIG_FILENAMES: string[] = [
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

async function loadMjs(filePath: string) {
  if (!importDefault) {
    throw new Error(
      "Internal error: Native ECMAScript modules aren't supported" +
        ' by this platform.\n'
    );
  }
  try {
    return await importDefault(pathToFileURL(filePath).toString());
  } catch (error) {
    throw new Error(`mjs Error in ${filePath}:\n${error}`);
  }
}

async function loadJson5(filePath: string, content: string) {
  try {
    const json5 = await importDefault('json5');
    return json5.parse(content);
  } catch (error) {
    throw new Error(`JSON5 Error in ${filePath}:\n${error}`);
  }
}

async function loadToml(filePath: string, content: string) {
  try {
    const toml = await importDefault('@iarna/toml');
    return toml.parse(content);
  } catch (error) {
    throw new Error(`TOML Error in ${filePath}:\n${error}`);
  }
}

export async function getConfig(): Promise<any | null> {
  const configResult: CosmiconfigResult = await cosmiconfig('ghsrc', {
    transform: (result: CosmiconfigResult) => {
      if (result && result.config) {
        if (typeof result.config === 'string') {
          const dir = dirname(result.filepath);
          const modulePath = resolve(join(dir, result.config));
          result.config = require(modulePath);
        }

        if (typeof result.config !== 'object') {
          throw new Error(
            'Config is only allowed to be an object, ' +
              `but received ${typeof result.config} in "${result.filepath}"`
          );
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

  return configResult?.config;
}
