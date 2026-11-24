"""Convert f1-circuits GeoJSON (MIT, Tomislav Bacinger) into compact SVG paths."""
# Usage: python3 scripts/make_outlines.py path/to/f1-circuits.geojson src/data/track-outlines.json
import json, math, sys
src, out = sys.argv[1], sys.argv[2]
features = json.load(open(src))['features']
W = 1000  # longest side
result = {}
for f in features:
    cid = f['properties']['id']
    pts = f['geometry']['coordinates']
    lat0 = sum(p[1] for p in pts) / len(pts)
    k = math.cos(math.radians(lat0))
    xy = [(p[0] * k, -p[1]) for p in pts]          # equirectangular, north up
    minx = min(x for x, _ in xy); maxx = max(x for x, _ in xy)
    miny = min(y for _, y in xy); maxy = max(y for _, y in xy)
    s = W / max(maxx - minx, maxy - miny)
    pad = 30
    w = round((maxx - minx) * s + 2 * pad); h = round((maxy - miny) * s + 2 * pad)
    P = [((x - minx) * s + pad, (y - miny) * s + pad) for x, y in xy]
    d = 'M' + ' L'.join(f'{x:.0f} {y:.0f}' for x, y in P)
    if P[0] != P[-1]:
        d += ' Z'
    result[cid] = {'name': f['properties']['Name'], 'viewBox': f'0 0 {w} {h}', 'd': d}
json.dump(result, open(out, 'w'), separators=(',', ':'))
print(len(result), 'outlines,', sum(len(v['d']) for v in result.values()) // 1024, 'KB of path data')
