import fs, { open, close, readFileSync, writeFileSync, rmSync, createWriteStream } from 'node:fs';
import path, { sep } from 'path';
import { Extract } from 'unzipper';
import { pipeline } from 'node:stream/promises';
import { countriesAreasProvinces } from '../file/countries_areas_provinces';

// https://gadm.org/download_country.html
const ZIP_URL = 'https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_{code}_{level}.json.zip';
const DEST_DIR = './unzipped';

const FILE_DIR = `.${sep}geo${sep}`;

async function downloadAndUnzip(coutryCode: string, level: number | string = 1) {
  const res = await fetch(ZIP_URL.replace('{code}', coutryCode).replace('{level}', String(level)), {mode: 'no-cors'});
  if (!res.ok || !res.body) throw new Error('Failed to download');
  //@ts-ignore
    await pipeline(res.body, Extract({ path: DEST_DIR }));
}

async function processFiles(coutryCode: string, subsNameMap = {}) {
  const files = fs.readdirSync(DEST_DIR);
  for (const file of files) {
    const fullPath = path.join(DEST_DIR, file);
    console.log('处理文件:', fullPath);
    const geojson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    geojson.name = coutryCode;
    geojson.crs = undefined;
    //@ts-ignore
    geojson.features.map((f) => {
        const name = f.properties.NAME_1 || f.properties.NAME_ENG;
        
        f.properties = {
            //@ts-ignore
            name_zh: (subsNameMap[f.properties.ISO_1]?.name_zh ?? name).replace(/省$/, ''),
            //@ts-ignore
            name_en: subsNameMap[f.properties.ISO_1]?.name_en ?? name,
            //@ts-ignore
            name: subsNameMap[f.properties.ISO_1]?.name_en ?? name,
        }
    });
    const getFile = `${FILE_DIR}${coutryCode}.geo.json`;
    if(fs.existsSync(getFile)){
        fs.rmSync(getFile);
    }
    if(!fs.existsSync(FILE_DIR)){
        fs.mkdirSync(FILE_DIR);
    }
    fs.writeFileSync(getFile, JSON.stringify(geojson));

    if(fs.existsSync(fullPath)){
        fs.rmSync(fullPath);
    }
  }
}

async function main() {
    if(!process.argv[2]){
        throw new Error('No country code input')
    }
    const coutryCode = process.argv[2].toUpperCase();
    //@ts-ignore
    const subs = countriesAreasProvinces.find(c => c.iso_code === coutryCode)?.subs.reduce((ret, s) => {
        if(s.iso_32){
            //@ts-ignore
            ret[s.iso_32] = s;
        }
        return ret;
    }, {})
  await downloadAndUnzip(coutryCode, 1);
  await processFiles(coutryCode, subs);
}

main().catch(console.error);