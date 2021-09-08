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
import * as fs from 'fs';
import * as path from 'path';
export function compareDeps(a, b) {
    function clipNum(dep) {
        return Number.parseInt(/clip-(\d+)/.exec(dep)[1]);
    }
    return clipNum(a) >= clipNum(b) ? 1 : -1;
}
export function createSVG(data, ghsOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const imageFormat = 'png';
        const imageWidth = ghsOptions.svgImageWidth;
        const svgWidth = ghsOptions.svgWidth;
        const imageSpacing = Math.floor(imageWidth / 10);
        const rows = Math.floor(svgWidth / (imageWidth + imageSpacing));
        const radius = Math.floor(imageWidth / 2);
        const defs = [];
        const images = [];
        let count = 0;
        const cacheDir = 'cache';
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        yield Promise.all(data.map((sponsor, index) => __awaiter(this, void 0, void 0, function* () {
            const imageX = index % rows;
            const imageY = Math.floor(index / rows);
            const locationX = imageX * (imageWidth + imageSpacing);
            const locationY = imageY * (imageWidth + imageSpacing);
            const avatarCache = path.join(cacheDir, sponsor.avatarUrl.split('/u/')[1].split('?')[0] + '.' + imageFormat);
            const avatar = yield getAvatar(sponsor.avatarUrl, avatarCache, imageFormat);
            defs.push(`    <clipPath id="clip-${index}">
      <circle cx="${locationX + radius}" cy="${locationY + radius}" r="${radius}"/>
    </clipPath>`);
            images.push(`  <a xlink:href="${sponsor.htmlUrl || sponsor.url}" class="sponsor-svg" target="_blank" id="${sponsor.login}">
    <image clip-path="url(#clip-${index})" x="${locationX}" y="${locationY}" width="${imageWidth}" height="${imageWidth}" xlink:href="${avatar}"/>
  </a>`);
            if (!ghsOptions.quiet) {
                process.stdout.write(`Fetching sponsors avatars ${Math.floor((++count / data.length) * 100)} % complete... \r`);
            }
        })));
        return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${svgWidth}" height="${Math.ceil(data.length / rows) * (imageWidth + imageSpacing)}">
  <defs>
${defs.sort(compareDeps).join('\n')}
  </defs>
  <style>.sponsor-svg { cursor: pointer; }</style>
${images.sort(compareDeps).join('\n')}
</svg>
`;
    });
}
export function getBase64Image(data, format) {
    return `data:image/${format};base64,${Buffer.from(data).toString('base64')}`;
}
export function getAvatar(avatarUrl, avatarCache, format) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs.existsSync(avatarCache)) {
            return yield new Promise((resolve, reject) => {
                axios.default
                    .get(avatarUrl, { responseType: 'arraybuffer' })
                    .then(resp => {
                    fs.writeFileSync(avatarCache, resp.data, { mode: 0o644 });
                    resolve(getBase64Image(resp.data, format));
                })
                    .catch(function (err) {
                    reject(err);
                });
            });
        }
        else {
            return getBase64Image(fs.readFileSync(avatarCache), format);
        }
    });
}
//# sourceMappingURL=svg.js.map