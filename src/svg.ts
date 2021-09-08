import * as axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export function compareDeps(a: string, b: string): number {
  function clipNum(dep: string) {
    return Number.parseInt((/clip-(\d+)/.exec(dep) as string[])[1]);
  }
  return clipNum(a) >= clipNum(b) ? 1 : -1;
}

export async function createSVG(
  data: Record<string, any>[],
  ghsOptions: Record<string, any>
): Promise<string> {
  const imageFormat = 'png';
  const imageWidth: number = ghsOptions.svgImageWidth;
  const svgWidth: number = ghsOptions.svgWidth;
  const imageSpacing: number = Math.floor(imageWidth / 10);
  const rows: number = Math.floor(svgWidth / (imageWidth + imageSpacing));
  const radius: number = Math.floor(imageWidth / 2);
  const defs: string[] = [];
  const images: string[] = [];
  let count = 0;
  const cacheDir = 'cache';
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
  }
  await Promise.all(
    data.map(async (sponsor: Record<string, string>, index: number) => {
      const imageX = index % rows;
      const imageY = Math.floor(index / rows);
      const locationX = imageX * (imageWidth + imageSpacing);
      const locationY = imageY * (imageWidth + imageSpacing);
      const avatarCache = path.join(
        cacheDir,
        sponsor.avatarUrl.split('/u/')[1].split('?')[0] + '.' + imageFormat
      );
      const avatar = await getAvatar(
        sponsor.avatarUrl,
        avatarCache,
        imageFormat
      );
      defs.push(`    <clipPath id="clip-${index}">
      <circle cx="${locationX + radius}" cy="${
        locationY + radius
      }" r="${radius}"/>
    </clipPath>`);
      images.push(
        `  <a xlink:href="${
          sponsor.htmlUrl || sponsor.url
        }" class="sponsor-svg" target="_blank" id="${sponsor.login}">
    <image clip-path="url(#clip-${index})" x="${locationX}" y="${locationY}" width="${imageWidth}" height="${imageWidth}" xlink:href="${avatar}"/>
  </a>`
      );
      if (!ghsOptions.quiet) {
        process.stdout.write(
          `Fetching sponsors avatars ${Math.floor(
            (++count / data.length) * 100
          )} % complete... \r`
        );
      }
    })
  );

  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${svgWidth}" height="${
    Math.ceil(data.length / rows) * (imageWidth + imageSpacing)
  }">
  <defs>
${defs.sort(compareDeps).join('\n')}
  </defs>
  <style>.sponsor-svg { cursor: pointer; }</style>
${images.sort(compareDeps).join('\n')}
</svg>
`;
}

export function getBase64Image(data: Buffer, format: string): string {
  return `data:image/${format};base64,${Buffer.from(data).toString('base64')}`;
}

export async function getAvatar(
  avatarUrl: string,
  avatarCache: string,
  format: string
): Promise<string> {
  if (!fs.existsSync(avatarCache)) {
    return await new Promise((resolve, reject) => {
      axios.default
        .get(avatarUrl, {responseType: 'arraybuffer'})
        .then(resp => {
          fs.writeFileSync(avatarCache, resp.data, {mode: 0o644});
          resolve(getBase64Image(resp.data, format));
        })
        .catch(function (err: any) {
          reject(err);
        });
    });
  } else {
    return getBase64Image(fs.readFileSync(avatarCache), format);
  }
}
