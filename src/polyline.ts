// @AI_GENERATED: Kiro v1.0
/**
 * Google Polyline 编码/解码算法
 * 编码: 将 [lng, lat] 坐标数组压缩为字符串
 * 解码: 将压缩字符串还原为 [lng, lat] 坐标数组
 */

/**
 * 编码单个有符号整数值
 */
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
 * 将 [lng, lat] 坐标数组编码为 Google Polyline 压缩字符串
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

/**
 * 将 Google Polyline 压缩字符串解码为 [lng, lat] 坐标数组
 */
export function decodePolyline(encoded: string): number[][] {
    const coordinates: number[][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        // 解码纬度
        let shift = 0;
        let result = 0;
        let byte: number;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : (result >> 1);

        // 解码经度
        shift = 0;
        result = 0;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : (result >> 1);

        coordinates.push([lng / 1e5, lat / 1e5]);
    }
    return coordinates;
}

/**
 * 对 GeoJSON feature 的 geometry 进行 polyline 编码压缩
 * Polygon/MultiPolygon 的坐标环编码为 rings 字符串数组
 */
export function encodeFeatureGeometry(feature: any): any {
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

/**
 * 对已编码的 feature geometry 进行解码，还原为标准 GeoJSON 坐标
 * rings 字符串数组解码为 Polygon 坐标（每个 ring 作为一个 polygon）
 */
export function decodeFeatureGeometry(feature: any): any {
    const geom = feature.geometry;
    if (!geom || !geom.rings || !Array.isArray(geom.rings)) return feature;
    const decodedRings = geom.rings
        .filter((r: any) => typeof r === 'string')
        .map((ring: string) => decodePolyline(ring));
    if (geom.type === 'Polygon') {
        return {
            ...feature,
            geometry: {
                type: geom.type,
                coordinates: decodedRings,
            },
        };
    }
    if (geom.type === 'MultiPolygon') {
        // 每个 ring 作为独立的 polygon（单环）
        return {
            ...feature,
            geometry: {
                type: geom.type,
                coordinates: decodedRings.map((ring: number[][]) => [ring]),
            },
        };
    }
    return feature;
}
// @AI_GENERATED: end
