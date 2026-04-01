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
const DEFAULT_COUNTRIES_DIR = 'C:\\DiskD\\Projects\\trunk_x64\\src\\web_client\\webpage\\src_react\\wp4\\src\\common\\maps\\countries';
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
/**
 * Google Polyline 编码算法
 * 将 [lng, lat] 坐标数组编码为压缩字符串
 */
export function encodePolyline(coordinates: number[][]): string {
    let output = '';
    let prevLat = 0;
    let prevLng = 0;
    for (const [lng, lat] of coordinates) {
        const latE5 = Math.round(lat * 1e5);
        const lngE5 = Math.round(lng * 1e5);
        output += encodeSignedValue(latE5 - prevLat);
        output += encodeSignedValue(lngE5 - prevLng);
        prevLat = latE5;
        prevLng = lngE5;
    }
    return output;
}

function encodeSignedValue(value: number): string {
    let v = value < 0 ? ~(value << 1) : (value << 1);
    let encoded = '';
    while (v >= 0x20) {
        encoded += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
        v >>= 5;
    }
    encoded += String.fromCharCode(v + 63);
    return encoded;
}

/**
 * 对 GeoJSON feature 的 geometry 进行 polyline 编码压缩
 * MultiPolygon/Polygon 的坐标环编码为字符串数组
 */
function encodeFeatureGeometry(feature: any): any {
    const geom = feature.geometry;
    if (!geom || !geom.coordinates) return feature;
    if (geom.type === 'Polygon') {
        return {
            ...feature,
            geometry: {
                type: geom.type,
                rings: geom.coordinates.map((ring: number[][]) => encodePolyline(ring)),
            },
        };
    }
    if (geom.type === 'MultiPolygon') {
        return {
            ...feature,
            geometry: {
                type: geom.type,
                rings: geom.coordinates.map((polygon: number[][][]) =>
                    polygon.map((ring: number[][]) => encodePolyline(ring))
                ).flat(),
            },
        };
    }
    return feature;
}
// @AI_GENERATED: end

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
    // @AI_GENERATED: Kiro v1.0
    } else if (process.argv[2] === 'subs') {
        // 遍历每个父对象，获取其 subs 里每个 iso_code 的 geo json
        for (const country of countriesAreasProvinces) {
            const parentCode = country.iso_code;
            const subsDir = path.join(FILE_DIR, parentCode);
            if (!fs.existsSync(subsDir)) {
                fs.mkdirSync(subsDir, { recursive: true });
            }
            if (!country.subs || country.subs.length === 0) continue;
            for (const sub of country.subs) {
                if (!sub.iso_code) continue;
                console.log(`获取子区域GEO: ${parentCode} -> ${sub.iso_code} (${sub.name_en})`);
                try {
                    // 清空 unzipped 目录
                    if (fs.existsSync(DEST_DIR)) {
                        const leftover = fs.readdirSync(DEST_DIR);
                        for (const f of leftover) {
                            fs.rmSync(path.join(DEST_DIR, f), { force: true });
                        }
                    }
                    await downloadAndUnzip(parentCode, 2);
                    // 处理解压后的文件，输出到父对象目录下
                    const files = fs.readdirSync(DEST_DIR);
                    for (const file of files) {
                        const fullPath = path.join(DEST_DIR, file);
                        const geojson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                        // 筛选出匹配当前 sub 的 feature
                        //@ts-ignore
                        const matched = geojson.features?.filter((f: any) => {
                            const code = f.properties?.ISO_1 || f.properties?.HASC_2 || '';
                            return code.includes(sub.iso_code);
                        });
                        if (matched && matched.length > 0) {
                            const subGeo = { type: 'FeatureCollection', name: sub.iso_code, features: matched };
                            const outFile = path.join(subsDir, `${sub.iso_code}.geo.json`);
                            fs.writeFileSync(outFile, JSON.stringify(subGeo));
                            console.log(`  已保存: ${outFile}`);
                        }
                        fs.rmSync(fullPath, { force: true });
                    }
                } catch (err) {
                    console.error(`Failed for ${parentCode}/${sub.iso_code}:`, err);
                }
            }
        }
    // @AI_GENERATED: end
    } else if (process.argv[2] === 'encode' || process.argv[2]?.startsWith('encode=')) {
        // @AI_GENERATED: Kiro v1.0
        // 对指定目录下的 geo.json 文件进行 polyline 编码压缩
        const encodeArg = process.argv[2];
        const encodePath = (encodeArg.includes('=') ? encodeArg.split('=')[1] : '') || FILE_DIR;
        if (!fs.existsSync(encodePath)) {
            throw new Error(`目录不存在: ${encodePath}`);
        }
        const files = fs.readdirSync(encodePath);
        for (const file of files) {
            const fullPath = path.join(encodePath, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                // 递归处理子目录
                const subFiles = fs.readdirSync(fullPath);
                for (const subFile of subFiles) {
                    if (!subFile.endsWith('.geo.json')) continue;
                    const subFullPath = path.join(fullPath, subFile);
                    try {
                        const geojson = JSON.parse(fs.readFileSync(subFullPath, 'utf8'));
                        if (geojson.features) {
                            geojson.features = geojson.features.map(encodeFeatureGeometry);
                        }
                        fs.writeFileSync(subFullPath, JSON.stringify(geojson));
                        console.log(`已编码: ${subFullPath}`);
                    } catch (err) {
                        console.error(`编码失败 ${subFullPath}:`, err);
                    }
                }
                continue;
            }
            if (!file.endsWith('.geo.json')) continue;
            try {
                const geojson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                if (geojson.features) {
                    geojson.features = geojson.features.map(encodeFeatureGeometry);
                }
                fs.writeFileSync(fullPath, JSON.stringify(geojson));
                console.log(`已编码: ${fullPath}`);
            } catch (err) {
                console.error(`编码失败 ${fullPath}:`, err);
            }
        }
        // @AI_GENERATED: end
    } else {
        await downloadGeoJson(process.argv[2]);
    }
    // @AI_GENERATED: end
}

main().catch(console.error);