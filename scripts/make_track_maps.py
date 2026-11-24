"""
Build track-map data (speed-coloured segments, numbered corners, start/finish)
from the f1-circuits GeoJSON (MIT, Tomislav Bacinger).

Corner speed comes from geometry: the tighter the radius, the slower the
corner. Radius thresholds follow typical F1 lateral grip:
  slow   (< ~120 km/h)  radius < SLOW_R
  medium (120-200 km/h) radius < MED_R
  fast   (> ~200 km/h)  otherwise
Usage: python3 scripts/make_track_maps.py f1-circuits.geojson corners.json out.json
  corners.json: {"<circuit_id>": <official corner count>, ...}
"""
import json, math, sys

SLOW_R, MED_R = 45.0, 150.0     # metres; calibrated against published low/medium/high corner counts
CURVE_R = 400.0                 # tighter than this counts as "turning"
MIN_ANGLE = 8.0                 # degrees: smaller bends are kinks, not corners
STEP = 2.0                      # resample spacing (m)
PATH_SIGMA = 5                  # path smoothing (samples)
REVERSED = {'sg-2008'}          # dataset runs opposite to the racing direction

def load(path):
    return {f['properties']['id']: f['geometry']['coordinates'] for f in json.load(open(path))['features']}

def to_metres(coords):
    lat0 = sum(c[1] for c in coords) / len(coords)
    k = math.cos(math.radians(lat0)) * 111320.0
    return [((c[0]) * k, (c[1]) * 110540.0) for c in coords]

def resample(pts, step):
    if pts[0] != pts[-1]:
        pts = pts + [pts[0]]
    out, carry = [pts[0]], 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        d = math.hypot(x2 - x1, y2 - y1)
        t = step - carry
        while t <= d:
            out.append((x1 + (x2 - x1) * t / d, y1 + (y2 - y1) * t / d)); t += step
        carry = (carry + d) % step if d else carry
    return out[:-1] if math.hypot(out[-1][0] - out[0][0], out[-1][1] - out[0][1]) < step / 2 else out

def gsmooth(vals, sigma):
    n, r = len(vals), int(3 * sigma)
    w = [math.exp(-(i * i) / (2 * sigma * sigma)) for i in range(-r, r + 1)]
    s = sum(w)
    return [sum(w[j + r] * vals[(i + j) % n] for j in range(-r, r + 1)) / s for i in range(n)]

def analyse(coords, official):
    pts = resample(to_metres(coords), STEP)
    n = len(pts)
    # smooth the path (dataset vertices are tens of metres apart)
    xs = gsmooth([p[0] for p in pts], PATH_SIGMA); ys = gsmooth([p[1] for p in pts], PATH_SIGMA)
    head = [math.atan2(ys[(i + 1) % n] - ys[i], xs[(i + 1) % n] - xs[i]) for i in range(n)]
    dh = [math.remainder(head[(i + 1) % n] - head[i], math.tau) for i in range(n)]
    kappa = gsmooth([d / STEP for d in dh], 4)           # 1/m, + = left turn
    turning = [abs(k) > 1 / CURVE_R for k in kappa]
    # split into corner regions: contiguous turning, same direction
    regions, i = [], 0
    start = next((j for j in range(n) if not turning[j]), 0)   # begin on a straight
    order = [(start + j) % n for j in range(n)]
    cur = None
    for idx in order:
        if turning[idx]:
            sgn = 1 if kappa[idx] > 0 else -1
            if cur and cur['sgn'] == sgn and cur['last'] == (idx - 1) % n:
                cur['idx'].append(idx); cur['last'] = idx
            else:
                cur = {'sgn': sgn, 'idx': [idx], 'last': idx}; regions.append(cur)
        else:
            cur = None
    corners = []
    for r in regions:
        ang = abs(math.degrees(sum(kappa[j] * STEP for j in r['idx'])))
        if ang < MIN_ANGLE:
            continue
        apex = max(r['idx'], key=lambda j: abs(kappa[j]))
        # effective radius over the corner's core (where curvature is at least
        # half its peak): arc length / angle turned. Robust to vertex spikes.
        peak = abs(kappa[apex])
        core = [j for j in r['idx'] if abs(kappa[j]) >= 0.5 * peak]
        turned = sum(abs(kappa[j]) * STEP for j in core) or 1e-9
        rad = len(core) * STEP / turned
        kind = 'slow' if rad < SLOW_R else 'medium' if rad < MED_R else 'fast'
        corners.append({'idx': r['idx'], 'apex': apex, 'angle': ang, 'radius': rad, 'type': kind, 'dir': 'L' if r['sgn'] > 0 else 'R'})
    # keep the N most significant if we found more than the official count
    if official and len(corners) > official:
        keep = sorted(corners, key=lambda c: c['angle'], reverse=True)[:official]
        corners = [c for c in corners if c in keep]
    corners.sort(key=lambda c: c['apex'])                   # lap order from start/finish
    seg = ['straight'] * n
    for c in corners:
        for j in c['idx']:
            seg[j] = c['type']
    return xs, ys, kappa, corners, seg

def build(coords, official):
    xs, ys, kappa, corners, seg = analyse(coords, official)
    n = len(xs)
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    W = 1000; s = W / max(maxx - minx, maxy - miny); pad = 70
    X = lambda x: (x - minx) * s + pad
    Y = lambda y: (maxy - y) * s + pad
    w, h = round((maxx - minx) * s + 2 * pad), round((maxy - miny) * s + 2 * pad)
    # colour runs as polylines (every 4th point keeps files small)
    runs, cur = [], None
    for i in list(range(n)) + [0]:
        if cur is None or seg[i] != cur['type']:
            if cur: cur['pts'].append((X(xs[i]), Y(ys[i])))
            cur = {'type': seg[i], 'pts': []}; runs.append(cur)
        if i % 4 == 0 or not cur['pts']:
            cur['pts'].append((X(xs[i]), Y(ys[i])))
    paths = [{'type': r['type'], 'd': 'M' + ' L'.join(f'{x:.0f} {y:.0f}' for x, y in r['pts'])} for r in runs if len(r['pts']) > 1]
    out_corners = []
    for num, c in enumerate(corners, 1):
        a = c['apex']
        tx, ty = xs[(a + 1) % n] - xs[a - 1], ys[(a + 1) % n] - ys[a - 1]
        L = math.hypot(tx, ty) or 1
        nx, ny = -ty / L, tx / L                      # left normal (metres frame)
        side = -1 if kappa[a] > 0 else 1              # label on the outside of the bend
        off = 0.045 * max(w, h) / s
        lx, ly = xs[a] + side * nx * off, ys[a] + side * ny * off
        out_corners.append({'n': num, 'type': c['type'], 'dir': c['dir'], 'radius': round(c['radius']),
                            'x': round(X(xs[a])), 'y': round(Y(ys[a])), 'lx': X(lx), 'ly': Y(ly),
                            'at': round(a / n, 4)})
    # spread labels: push apart from each other and off the track line
    R = 19 * max(w, h) / 1000                      # label radius in map units (matches TrackMap)
    track = [(X(xs[i]), Y(ys[i])) for i in range(0, n, 3)]
    labs = out_corners
    for _ in range(120):
        moved = False
        for a in labs:
            fx = fy = 0.0
            for b in labs:
                if a is b: continue
                dx, dy = a['lx'] - b['lx'], a['ly'] - b['ly']; d = math.hypot(dx, dy) or 0.01
                if d < 2.3 * R: fx += dx / d * (2.3 * R - d) * 0.5; fy += dy / d * (2.3 * R - d) * 0.5
            for tx, ty in track:
                dx, dy = a['lx'] - tx, a['ly'] - ty; d = math.hypot(dx, dy) or 0.01
                if d < 1.7 * R: fx += dx / d * (1.7 * R - d) * 0.4; fy += dy / d * (1.7 * R - d) * 0.4
            if abs(fx) + abs(fy) > 0.2:
                a['lx'] = min(w - R, max(R, a['lx'] + fx)); a['ly'] = min(h - R, max(R, a['ly'] + fy)); moved = True
        if not moved: break
    for a in labs:
        a['lx'], a['ly'] = round(a['lx']), round(a['ly'])
    # start/finish tick + direction
    ang = math.degrees(math.atan2(-(ys[1] - ys[0]), xs[1] - xs[0]))
    # speed strip along the lap: [start fraction, end fraction, type]
    strip, st = [], 0
    for i in range(1, n + 1):
        if i == n or seg[i] != seg[st]:
            strip.append([round(st / n, 4), round(i / n, 4), seg[st]]); st = i
    return {'viewBox': f'0 0 {w} {h}', 'paths': paths, 'corners': out_corners, 'strip': strip,
            'sf': {'x': round(X(xs[0])), 'y': round(Y(ys[0])), 'angle': round(ang)},
            'counts': {t: sum(1 for c in corners if c['type'] == t) for t in ('slow', 'medium', 'fast')}}

if __name__ == '__main__':
    gj, official = load(sys.argv[1]), json.load(open(sys.argv[2]))
    out = {}
    for cid, count in official.items():
        coords = gj[cid][::-1] if cid in REVERSED else gj[cid]
        if cid in REVERSED:
            coords = [coords[-1]] + coords[:-1]       # keep the same start point
        out[cid] = build(coords, count)
    json.dump(out, open(sys.argv[3], 'w'), separators=(',', ':'))
    for cid, m in out.items():
        print(cid, len(m['corners']), '/', official[cid], m['counts'])
