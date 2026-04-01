import fs, { open, close, readFileSync, writeFileSync, rmSync, createWriteStream } from 'node:fs';
import path, { sep } from 'path';
import { Extract } from 'unzipper';
import { Readable } from 'node:stream';
import { countriesAreasProvinces } from '../file/countries_areas_provinces';

// https://gadm.org/download_country.html
const ZIP_URL = 'https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_{code}_{level}.json.zip';
const DEST_DIR = './unzipped';

const FILE_DIR = `.${sep}geo${sep}`;

// @AI_GENERATED: Kiro v1.0
const DEFAULT_COUNTRIES_DIR = 'C:\\countries';
// @AI_GENERATED: end

// @AI_GENERATED: Kiro v1.0
async function downloadAndUnzip(coutryCode: string, level: number | string = 1) {
    const url = ZIP_URL.replace('{code}', coutryCode).replace('{level}', String(level));

    // 最多尝试3次下载
    let res: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            res = await fetch(url, { mode: 'no-cors' });
            if (res.ok && res.body) break;
        } catch (err) {
            console.error(`下载失败 (第${attempt}次):`, err);
        }
        if (attempt < 3) {
            console.log(`等待1秒后重试...`);
            await new Promise(r => setTimeout(r, 1000));
        }
        res = null;
    }
    if (!res || !res.ok || !res.body) throw new Error(`Failed to download after 3 attempts: ${url}`);

    if (!fs.existsSync(DEST_DIR)) {
        fs.mkdirSync(DEST_DIR, { recursive: true });
    }

    // 流式解压，但通过 Extract 的 promise() 确保所有文件完全写入
    const extractor = Extract({ path: DEST_DIR });
    //@ts-ignore
    Readable.fromWeb(res.body).pipe(extractor);
    await extractor.promise();
}
// @AI_GENERATED: end

async function processFiles(coutryCode: string, subsNameMap = {}) {
    const files = fs.readdirSync(DEST_DIR);
    for (const file of files) {
        const fullPath = path.join(DEST_DIR, file);
        console.log('处理文件:', fullPath);
        const jsonStr = fs.readFileSync(fullPath, 'utf8');
        try{
            const geojson = JSON.parse(jsonStr);
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
            if (fs.existsSync(getFile)) {
                fs.rmSync(getFile);
            }
            if (!fs.existsSync(FILE_DIR)) {
                fs.mkdirSync(FILE_DIR);
            }
            fs.writeFileSync(getFile, JSON.stringify(geojson));

            if (fs.existsSync(fullPath)) {
                fs.rmSync(fullPath);
            }
        }catch(e){
            console.log('json字符:', jsonStr);
        }
    }
}

// @AI_GENERATED: Kiro v1.0
export interface DirEntry {
    name: string;
    isDirectory: boolean;
    size: number;
}

const SIZE_LIMIT = 10 * 1024; // 10KB

export function filterEntries(entries: DirEntry[]): DirEntry[] {
    return entries.filter(e => !e.isDirectory && e.size < SIZE_LIMIT);
}

export function extractCountryCode(filename: string): string {
    return filename.split('.')[0];
}
// @AI_GENERATED: end

async function downloadGeoJson(countryIsoCode: string) {
    if (!countryIsoCode) {
        throw new Error('No country code input')
    }
    const coutryCode = countryIsoCode.toUpperCase();
    //@ts-ignore
    const subs = countriesAreasProvinces.find(c => c.iso_code === coutryCode)?.subs.reduce((ret, s) => {
        if (s.iso_32) {
            //@ts-ignore
            ret[s.iso_32] = s;
        }
        return ret;
    }, {})
    await downloadAndUnzip(coutryCode, 1);
    await processFiles(coutryCode, subs);
}

async function main() {
    if (!process.argv[2]) {
        throw new Error('No country code input')
    }
    // @AI_GENERATED: Kiro v1.0
    const dirArg = process.argv.find(a => a === 'dir' || a.startsWith('dir='));
    if (dirArg) {
        const dirPath = (dirArg.includes('=') ? dirArg.split('=')[1] : '') || DEFAULT_COUNTRIES_DIR;
        if (!fs.existsSync(dirPath)) {
            throw new Error(`目录不存在: ${dirPath}`);
        }
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) continue;
            const fullPath = path.join(dirPath, entry.name);
            const stat = fs.statSync(fullPath);
            if (stat.size >= SIZE_LIMIT) continue;
            const countryCode = extractCountryCode(entry.name);
            console.log(`国家GEO获取: ${entry.name} -> ${countryCode}`);
            try {
                // 清空 unzipped 目录，防止残留文件干扰下一轮解析
                if (fs.existsSync(DEST_DIR)) {
                    const leftover = fs.readdirSync(DEST_DIR);
                    for (const f of leftover) {
                        fs.rmSync(path.join(DEST_DIR, f), { force: true });
                    }
                }
                
                await downloadGeoJson(countryCode);
            } catch (err) {
                console.error(`Failed for ${countryCode}:`, err);
            }
        }
    } else {
        await downloadGeoJson(process.argv[2]);
    }
    // @AI_GENERATED: end
}

main().catch(console.error);