// Builds jobs/<slug>/plan.sfx.json from each job's captioned plan plus hand-timed
// effect cues on the output timeline. Assets live in public/assets/sfx (see SOURCES.md).
// Each cue follows a specific on-screen motion: cuts, line/graph draws, water,
// stamps, counters, typing. Volumes stay under the speech (linear 0.08-0.35).
import fs from 'fs';

const VOL = {
  pop: .26, tick: .16, click: .3, money: .2, money2: .2, hit: .26, digital: .24, enter: .24, open: .2,
  stretch: .2, glitch: .26, gear: .2, 'gear-tick': .22, data: .16, 'data-short': .18, stopwatch: .13,
  stamp: .3, shutter: .28, riser: .16, 'riser-short': .18,
  'water-soft-drip': .1, 'water-soft-stream': .045, 'water-soft-pour': .07, 'water-soft-fill': .06,
  'water-drip': .24, 'water-stream': .09, 'water-pour': .16, 'water-splash': .14, 'water-fill': .14,
  'whoosh-simple': .13, 'whoosh-high': .13, whoosh: .14, 'whoosh-low': .14, 'whoosh-med': .14, 'whoosh-data': .14,
};
// Frames from file start to its loudest point, so a cue lands on the motion.
const PEAK = {whoosh: 20, 'whoosh-low': 29, 'whoosh-high': 14, 'whoosh-med': 22, 'whoosh-data': 24, 'whoosh-simple': 15, hit: 8, riser: 57, 'riser-short': 23};
const e = (f, at, v = VOL[f]) => ({src: `assets/sfx/${f}.wav`, atFrame: Math.round(at - (PEAK[f] ?? 0)), volume: v});
const fx = (f, ...frames) => frames.map(at => e(f, at));
const seq = (f, start, n, step, v) => Array.from({length: n}, (_, i) => e(f, start + i * step, v));
// Scene cut: a whoosh variant that peaks on the cut; softer into/out of the presenter.
const cut = (at, variant = 'whoosh', soft = false) => e(variant, at, soft ? .08 : .14);

const jobs = {
  // Shared leads vs local SEO.
  video2: () => [
    cut(72), cut(303, 'whoosh', true), cut(436, 'whoosh-simple', true), cut(760, 'whoosh-high'), cut(954, 'whoosh-med'),
    cut(1294, 'whoosh-data'), cut(1833, 'whoosh-low'), cut(2026, 'whoosh', true), cut(2094, 'whoosh-simple', true),
    cut(2412, 'whoosh-low'), cut(2757, 'whoosh', true), cut(2956, 'whoosh-med', true),
    // Price up / quality down: chips, the rising price line, the falling quality line, labels.
    ...fx('pop', 73, 95), ...fx('riser-short', 222), ...fx('stretch', 244), ...fx('tick', 218, 270),
    // Bidder pins ring the house, then consequence chips.
    ...seq('tick', 477, 5, 3), ...seq('tick', 497, 5, 3), ...fx('gear-tick', 497), ...fx('pop', 620, 663, 698),
    // SEO type: words, underline draw, the big SEO slam.
    ...fx('tick', 871, 882, 893), ...fx('stretch', 897), ...fx('hit', 926),
    // Search: typing, retyping, results, top 3, incoming calls, 70% ring.
    ...seq('tick', 979, 8, 3, .12), ...seq('tick', 1042, 5, 3, .12), ...fx('data-short', 1061), ...fx('enter', 1100),
    ...fx('whoosh-simple', 1170), ...fx('digital', 1170), ...fx('gear', 1250), ...fx('pop', 1227),
    // Service pages: site builds, each page lands, searches arrow in.
    ...fx('open', 1452), ...fx('pop', 1561, 1604, 1629, 1665), ...fx('whoosh-simple', 1767), ...fx('click', 1761),
    // Business card flips into a phone, calls stack in.
    ...fx('whoosh-high', 1955), ...fx('digital', 1973, 1995, 2017),
    // Big organic numbers, ad badge struck.
    ...fx('hit', 2159, 2251), ...fx('glitch', 2369),
    // Rented vs owned diagram: nodes, lines drawing, trust meter, badge.
    ...fx('pop', 2438, 2460), ...fx('stretch', 2458), ...fx('tick', 2484), ...fx('whoosh-simple', 2577),
    ...fx('stretch', 2586), ...fx('pop', 2598), ...fx('data', 2630), ...fx('stamp', 2696),
    // Compounding curve vs monthly sawtooth reset.
    ...fx('riser', 3051), ...fx('stretch', 3051), ...seq('glitch', 3060, 4, 8, .14), ...fx('tick', 3087, 3123), ...fx('pop', 3116),
  ],
  // Fix the leak before you buy more ads.
  video4: () => [
    cut(100), cut(295, 'whoosh-high'), cut(500, 'whoosh-low'), cut(676, 'whoosh-med'), cut(1020, 'whoosh-simple'),
    cut(1255, 'whoosh-med'), cut(1655, 'whoosh', true), cut(1797, 'whoosh-low', true), cut(1955, 'whoosh-simple'),
    // Blueprint pipe: water starts flowing, joints check, valve turns, tank fills, chips.
    ...fx('water-soft-stream', 119), ...fx('enter', 151), ...fx('pop', 149, 182, 258), ...fx('gear', 184), ...fx('water-soft-fill', 190),
    // JUST RUN / MORE ADS slam, struck, the real problem.
    ...fx('hit', 378), ...fx('click', 391), ...fx('glitch', 426), ...fx('whoosh-simple', 453),
    // Lead pipe: flow, three cracks, leads dripping out.
    ...fx('water-soft-stream', 500), ...fx('glitch', 500, 538, 580), ...fx('water-soft-drip', 512, 550, 592),
    // Small vs big pipe: flow, leak splash, bigger pipe arrives, gold coin stream, equal pies draw.
    ...fx('water-soft-stream', 690), ...fx('whoosh-simple', 816),
    ...fx('money2', 842), ...fx('stretch', 921),
    // Index card stamps.
    ...fx('stamp', 1152, 1182, 1200),
    // Bucket with a hole: pour, leak stream, drips, HOLE.
    ...fx('water-soft-pour', 1303), ...fx('water-soft-drip', 1340, 1372), ...fx('pop', 1362),
    // Patched bucket: pour continues, patch stamps on, bucket fills, coins plop in.
    ...fx('stamp', 1456), ...fx('water-soft-fill', 1466),
    ...fx('money2', 1552), ...fx('water-soft-drip', 1572, 1602, 1632),
    // Spotlight on one number, then the whole picture lights up.
    ...fx('shutter', 1874), ...fx('riser-short', 1923), ...fx('open', 1923 - 28),
    // Notebook funnel: title, stages drop in, question marks.
    ...fx('click', 2019), ...fx('pop', 2070, 2132, 2232), ...fx('tick', 2086, 2148, 2248),
    // Verdict A: checks, ad spend pours in, RIGHT CALL stamp.
    ...fx('enter', 2318), ...fx('tick', 2323, 2328), ...fx('pop', 2397), ...fx('stamp', 2448),
    // Verdict B: reset, weak stage turns red and leaks, FIX THE LEAK FIRST stamp.
    ...fx('whoosh-simple', 2495), ...fx('glitch', 2502), ...fx('water-soft-drip', 2515, 2555), ...fx('pop', 2563), ...fx('stamp', 2579),
  ],
  // Stop looking smaller than you are.
  video5: () => [
    cut(100), cut(335, 'whoosh-low'), cut(560, 'whoosh-high'), cut(675, 'whoosh-med'), cut(945, 'whoosh-data'),
    cut(1180, 'whoosh-simple'), cut(1500, 'whoosh', true), cut(1676, 'whoosh', true), cut(1960, 'whoosh-low'),
    // Bid sheets slide in, price and attention fill, WON / LOST stamps.
    ...fx('whoosh-simple', 110), ...fx('click', 126, 157), ...fx('stamp', 188, 214),
    // Head outline draws, money appears, fear thud, fears appear.
    ...fx('stretch', 337), ...fx('money', 415), ...fx('hit', 440), ...fx('digital', 457, 510),
    // Rain, umbrella snaps open, insurance.
    ...fx('water-soft-stream', 556), ...fx('whoosh-simple', 570), ...fx('pop', 568), ...fx('enter', 613),
    // Quality struck, PERCEPTION slam, website and branding objects.
    ...fx('pop', 687), ...fx('glitch', 740), ...fx('hit', 792), ...fx('open', 850 - 28), ...fx('pop', 850, 895),
    // Gap label, bridge planks lay down, crew struck.
    ...fx('stretch', 994), ...fx('gear-tick', 1061), ...seq('tick', 1061, 7, 3), ...fx('enter', 1085), ...fx('pop', 1131), ...fx('glitch', 1145),
    // Balance scale: titles, pans, card drops and tips the beam, risky glow.
    ...fx('pop', 1206), ...fx('glitch', 1262), ...fx('click', 1266), ...fx('pop', 1318), ...fx('whoosh-simple', 1365),
    ...fx('stamp', 1373), ...fx('gear-tick', 1372), ...fx('tick', 1390), ...fx('digital', 1464),
    // Fix list: website opens, proof photos, process line and steps, organized bubbles, reactive struck.
    ...fx('open', 1715 - 28), ...seq('tick', 1738, 4, 4), ...fx('pop', 1782), ...fx('stretch', 1819), ...seq('tick', 1819, 4, 8),
    ...fx('pop', 1851, 1888, 1894, 1900), ...fx('tick', 1930), ...fx('glitch', 1940),
    // Phone: stopwatch, call button, search typing, results.
    ...fx('stopwatch', 2013), ...fx('pop', 2050), ...fx('tick', 2090), ...fx('open', 2137), ...seq('tick', 2161, 6, 3, .12),
    ...fx('pop', 2186, 2192, 2198),
  ],
  // Ask for the review at the peak.
  video7: () => [
    cut(165, 'whoosh', true), cut(350, 'whoosh-low'), cut(700, 'whoosh-med'), cut(1500, 'whoosh', true), cut(1595, 'whoosh-simple', true),
    // +3 weeks card, new mail piles on top of the review ask, UNOPENED badge.
    ...fx('click', 178), ...fx('data-short', 259), ...seq('tick', 259, 5, 8), ...fx('glitch', 309),
    // Finished room assembles, homeowner steps in, thought bubble, friends, sparkles.
    ...seq('pop', 437, 4, 6, .18), ...fx('whoosh-simple', 548), ...fx('open', 549), ...seq('pop', 605, 3, 6, .2), ...fx('digital', 675),
    // Curve rises to the peak, falls away, the window opens, stars, three reasons.
    ...fx('riser', 823), ...fx('enter', 823), ...fx('stretch', 829), ...fx('open', 840), ...seq('tick', 976, 5, 3, .2), ...fx('pop', 1032, 1064, 1111),
    // Three weeks later: cursor slides, email lands, X, curve fades, blank review card.
    ...fx('whoosh-simple', 1172), ...fx('pop', 1201), ...fx('glitch', 1248), ...fx('stretch', 1349), ...fx('pop', 1376),
    // Review prompt: stars fill, posted, 10 second ring, "a chore" struck.
    ...fx('whoosh-simple', 1612), ...seq('tick', 1675, 5, 4, .2), ...fx('enter', 1703), ...fx('gear', 1717), ...fx('glitch', 1787),
  ],
  // Boosting isn't Facebook ads.
  video8: () => [
    cut(160, 'whoosh', true), cut(470, 'whoosh-low'), cut(755, 'whoosh-high'), cut(1240, 'whoosh', true), cut(1325, 'whoosh-simple', true),
    cut(1590, 'whoosh-simple'), cut(1950, 'whoosh-med'), cut(2235, 'whoosh-data'), cut(2535, 'whoosh-simple'), cut(2995, 'whoosh-low'),
    cut(3295, 'whoosh-med'), cut(3418, 'whoosh', true),
    // Boost post: button pressed, $100, a couple of likes, not buyers.
    ...fx('click', 274), ...fx('money2', 323), ...fx('pop', 385, 395), ...fx('glitch', 420),
    // Zero calls / quotes / jobs, then the conclusion.
    ...fx('stamp', 496, 545, 604), ...fx('whoosh-simple', 686),
    // Boost vs lead campaign columns.
    ...fx('hit', 821), ...fx('hit', 880), ...fx('glitch', 954), ...fx('pop', 1048), ...fx('tick', 1058, 1064, 1098),
    ...fx('pop', 1167, 1177), ...fx('enter', 1205),
    // Step 1: rail advances, Leads selected, contacters vs likers.
    ...fx('enter', 1381), ...fx('pop', 1493, 1535), ...fx('glitch', 1555),
    // Step 2: form card, landing page tab, fields fill, submit ready.
    ...fx('stretch', 1590), ...fx('pop', 1612), ...fx('tick', 1645), ...seq('tick', 1818, 4, 2, .12), ...seq('tick', 1836, 4, 2, .12),
    ...seq('tick', 1878, 4, 2, .12), ...fx('click', 1898),
    // Step 3: pins drop, service ring, outside pins crossed.
    ...fx('stretch', 1950), ...seq('tick', 1990, 12, 2, .1), ...fx('open', 2008 - 28), ...fx('glitch', 2105), ...fx('pop', 2178),
    // Step 4: tracking tiles.
    ...fx('stretch', 2235), ...fx('data-short', 2314, 2402, 2489), ...fx('tick', 2511),
    // Step 5: lead notification, instant reply, automatic follow-ups, within 5 minutes.
    ...fx('stretch', 2535), ...fx('digital', 2642), ...fx('whoosh-simple', 2684), ...fx('pop', 2686, 2728, 2748), ...fx('enter', 2938),
    // Same budget lanes.
    ...fx('pop', 3061, 3067, 3124), ...fx('tick', 3149), ...fx('pop', 3185, 3201), ...fx('money', 3280), ...fx('enter', 3282),
    // The system behind the ad.
    ...fx('whoosh-simple', 3366), ...fx('gear', 3374), ...seq('pop', 3374, 4, 5, .18),
  ],
  // Big jobs don't go to the cheapest bid.
  video9: () => [
    cut(209, 'whoosh', true), cut(448, 'whoosh-low'), cut(690, 'whoosh-med'), cut(1024, 'whoosh-high'), cut(1373, 'whoosh-simple'),
    cut(1801, 'whoosh', true), cut(1893, 'whoosh-simple', true), cut(2100, 'whoosh-low'), cut(2498, 'whoosh-med'), cut(2703, 'whoosh', true),
    // Timeline grows, worry, price struck.
    ...fx('stretch', 224), ...fx('tick', 260, 291), ...fx('pop', 380), ...fx('click', 435),
    // Cost line jumps, extra bill slams, stamped unexpected.
    ...fx('stretch', 463), ...fx('hit', 486), ...fx('stamp', 562, 641),
    // Receipt prints, items check off.
    ...fx('open', 721), ...fx('tick', 840, 915, 987),
    // Guaranteed ceiling, protection shield.
    ...fx('enter', 1060), ...fx('stretch', 1093), ...fx('digital', 1285),
    // Two quotes: estimate vs signed max price, who would you trust, life savings.
    ...fx('pop', 1378, 1531), ...fx('enter', 1565), ...fx('stretch', 1604), ...fx('hit', 1643), ...fx('money2', 1768),
    // Risk bars build, surprise hits, out of pocket.
    ...fx('pop', 1905, 1931, 1941, 1957), ...fx('glitch', 1996), ...fx('money', 2032),
    // Promises struck, plan / process / proof check in.
    ...fx('glitch', 2282), ...fx('pop', 2327, 2357, 2434), ...fx('tick', 2331, 2361, 2438),
    // Bids, cheapest dims, confident one wins.
    ...seq('pop', 2531, 3, 6, .2), ...fx('whoosh-simple', 2582), ...fx('stamp', 2666), ...fx('money2', 2672),
  ],
  // Easier to find beats better.
  video10: () => [
    cut(150, 'whoosh', true), cut(416, 'whoosh-low'), cut(689, 'whoosh', true), cut(737, 'whoosh-med'), cut(1105, 'whoosh-high'),
    cut(1276, 'whoosh-data'), cut(1505, 'whoosh', true),
    ...fx('pop', 211, 232, 279), ...seq('tick', 345, 7, 3, .12), ...fx('pop', 377),
    ...fx('glitch', 518), ...fx('pop', 600), ...fx('stretch', 637), ...fx('glitch', 653),
    ...fx('tick', 813, 886, 985, 1040), ...fx('pop', 815, 888, 987, 1042), ...fx('digital', 1076),
    ...fx('open', 1136), ...seq('pop', 1208, 3, 5, .18), ...seq('tick', 1235, 3, 5, .14),
    ...fx('whoosh-simple', 1440), ...fx('enter', 1476), ...fx('money2', 1482),
  ],
  // Stop underpricing out of fear.
  video11: () => [
    cut(181, 'whoosh', true), cut(488, 'whoosh-low'), cut(816, 'whoosh-high'), cut(1135, 'whoosh-med'), cut(1400, 'whoosh-data'),
    cut(1655, 'whoosh', true), cut(1842, 'whoosh-simple', true),
    ...fx('stretch', 250), ...fx('pop', 300), ...fx('pop', 340), ...fx('stamp', 405), ...fx('glitch', 455),
    ...fx('stretch', 594), ...fx('pop', 666, 728, 781), ...fx('glitch', 690),
    ...seq('glitch', 1050, 3, 8, .16), ...fx('stamp', 1001), ...fx('enter', 950),
    ...seq('tick', 1300, 4, 7, .14), ...fx('enter', 1334), ...fx('riser-short', 1327),
    ...fx('hit', 1400), ...seq('tick', 1555, 10, 3, .1), ...fx('glitch', 1605),
    ...fx('pop', 1913), ...fx('stamp', 1990), ...seq('tick', 2071, 3, 6, .14), ...fx('enter', 2109), ...fx('money2', 2147), ...fx('pop', 2241),
  ],
  // Use the slow month (modern UI).
  video12: () => [
    cut(227, 'whoosh', true), cut(569, 'whoosh', true), cut(792, 'whoosh-high'), cut(1168, 'whoosh-med'), cut(1568, 'whoosh-simple'), cut(1699, 'whoosh-low'),
    ...fx('glitch', 292), ...fx('pop', 328, 366, 412, 461, 504),
    ...fx('glitch', 825), ...fx('click', 871), ...fx('data', 880), ...fx('pop', 961, 1025, 1071),
    ...fx('pop', 1300, 1333, 1374, 1455), ...fx('tick', 1317, 1350, 1391, 1472), ...fx('riser-short', 1488), ...fx('glitch', 1556),
    ...fx('pop', 1633, 1678),
    ...fx('glitch', 1776), ...fx('pop', 1807, 1862), ...fx('riser', 1896), ...fx('enter', 1906),
  ],
  // Wanting to quit is a feeling (modern UI, softer mix).
  video13: () => [
    cut(188, 'whoosh', true), cut(559, 'whoosh', true), cut(912, 'whoosh-low'), cut(1231, 'whoosh-simple'), cut(1624, 'whoosh-simple'), cut(1801, 'whoosh', true),
    ...fx('pop', 204, 265, 334, 400),
    ...fx('hit', 435),
    ...fx('stretch', 958),
    ...fx('glitch', 1050),
    ...fx('riser', 1137),
    ...fx('pop', 1188, 1222),
    ...fx('glitch', 1306),
    ...fx('tick', 1425, 1468, 1512),
    ...fx('whoosh-simple', 1535),
    ...fx('tick', 1567, 1577, 1587),
    ...fx('glitch', 1674),
    ...fx('riser-short', 1697),
    ...fx('pop', 1761),
  ],
  // A pretty website isn't enough (modern UI).
  video14: () => [
    cut(158, 'whoosh', true), cut(632, 'whoosh-low'), cut(852, 'whoosh', true), cut(998, 'whoosh-high'), cut(1244, 'whoosh-med'),
    cut(1513, 'whoosh-simple'), cut(1709, 'whoosh-data'), cut(1873, 'whoosh', true),
    ...fx('pop', 241), ...fx('glitch', 335, 389, 457, 527),
    ...fx('click', 667, 699), ...fx('whoosh-simple', 711), ...fx('glitch', 715),
    ...fx('pop', 1031, 1061, 1127, 1195), ...fx('enter', 1201),
    ...fx('pop', 1259, 1319, 1370), ...seq('tick', 1431, 6, 4, .1), ...fx('click', 1481), ...fx('enter', 1483),
    ...fx('stretch', 1602), ...fx('pop', 1626, 1666),
    ...fx('digital', 1811), ...fx('pop', 1829, 1847),
  ],
  // How to handle a bad review (faceless, modern UI).
  video15: () => [
    cut(203, 'whoosh'), cut(567, 'whoosh-low', true), cut(749, 'whoosh-high'), cut(944, 'whoosh-med', true), cut(1248, 'whoosh-simple'), cut(1439, 'whoosh-data', true),
    ...fx('pop', 6),
    ...fx('pop', 66),
    ...fx('glitch', 103),
    ...fx('tick', 118, 125, 132),
    ...fx('hit', 140),
    ...fx('stamp', 164),
    ...fx('pop', 263, 387, 397, 407),
    ...fx('enter', 525),
    ...fx('glitch', 629),
    ...fx('glitch', 726),
    ...fx('stretch', 870),
    ...fx('digital', 916),
    ...fx('tick', 1001, 1031, 1131),
    ...fx('click', 1221),
    ...fx('enter', 1223),
    ...fx('glitch', 1357, 1384),
    ...fx('whoosh-simple', 1401),
    ...fx('pop', 1405),
    ...fx('riser', 1505),
    ...fx('glitch', 1581),
    ...fx('enter', 1631),
  ],
  // Camera roll is your content (first skills-guided edit: sounds land on the visual frame).
  video16: () => [
    cut(166, 'whoosh-med'), cut(578, 'whoosh', true), cut(726, 'whoosh-low'), cut(1119, 'whoosh-high'), cut(1457, 'whoosh-simple'), cut(1716, 'whoosh-data'), cut(1949, 'whoosh', true),
    ...fx('pop', 248, 296, 350, 419, 454, 482),
    ...fx('enter', 538),
    ...fx('click', 814),
    ...fx('tick', 890),
    ...fx('glitch', 956),
    ...fx('pop', 1229, 1316, 1366),
    ...fx('enter', 1430),
    ...fx('pop', 1481, 1532, 1628),
    ...fx('stretch', 1691),
    ...fx('glitch', 1784),
    ...fx('shutter', 1816),
    ...fx('enter', 1900),
  ],
  // Where do your customers come from (mixed dark/light).
  video17: () => [
    cut(153, 'whoosh-high'), cut(349, 'whoosh', true), cut(577, 'whoosh-low'), cut(1050, 'whoosh-simple'), cut(1211, 'whoosh-med'), cut(1506, 'whoosh-simple'), cut(1694, 'whoosh-simple'), cut(1889, 'whoosh', true),
    ...fx('pop', 161, 182, 206, 238, 308),
    ...fx('stretch', 632),
    ...fx('pop', 742, 813, 839),
    ...fx('glitch', 849),
    ...fx('pop', 897),
    ...fx('glitch', 985, 1029),
    ...fx('glitch', 1073),
    ...fx('riser-short', 1150),
    ...fx('enter', 1161),
    ...fx('pop', 1254),
    ...fx('tick', 1322, 1370, 1415, 1452),
    ...fx('enter', 1370),
    ...fx('glitch', 1558),
    ...fx('pop', 1622),
    ...fx('tick', 1664, 1670, 1676, 1682),
    ...fx('pop', 1743),
    ...fx('stretch', 1838),
    ...fx('enter', 1866),
  ],
  // The estimate doesn't sell itself (story style).
  video18: () => [
    cut(170, 'whoosh-med'), cut(484, 'whoosh-low'), cut(944, 'whoosh-simple'), cut(1382, 'whoosh-simple'), cut(1586, 'whoosh-simple'), cut(1748, 'whoosh', true),
    ...fx('pop', 186),
    ...fx('stretch', 266),
    ...fx('tick', 278, 284, 290),
    ...fx('whoosh-simple', 295),
    ...fx('tick', 365, 378),
    ...fx('glitch', 386),
    ...fx('hit', 433),
    ...fx('pop', 538, 568),
    ...fx('stretch', 656),
    ...fx('pop', 722),
    ...fx('glitch', 782, 802),
    ...fx('whoosh-simple', 921),
    ...fx('whoosh-high', 956),
    ...fx('pop', 1027, 1098, 1139),
    ...fx('tick', 1228),
    ...fx('enter', 1289),
    ...fx('glitch', 1372),
    ...fx('pop', 1409),
    ...fx('whoosh-simple', 1435),
    ...fx('pop', 1465),
    ...fx('glitch', 1513),
    ...fx('pop', 1659),
    ...fx('stretch', 1710),
    ...fx('enter', 1732),
  ],
  // 8 vs 85 reviews (modern story kit v2).
  video19: () => [
    cut(52, 'whoosh-med'), cut(277, 'whoosh-simple'), cut(528, 'whoosh-simple'), cut(776, 'whoosh-low'), cut(1052, 'whoosh', true), cut(1114, 'whoosh-high'), cut(1516, 'whoosh-simple'), cut(1776, 'whoosh', true), cut(1891, 'whoosh-med'),
    ...fx('pop', 74, 78),
    ...fx('pop', 127, 170),
    ...fx('tick', 200),
    ...fx('data-short', 296),
    ...fx('stretch', 331),
    ...fx('data', 344),
    ...fx('pop', 385, 394, 403, 412, 421, 430),
    ...fx('whoosh-simple', 602),
    ...fx('glitch', 661),
    ...fx('enter', 707),
    ...fx('glitch', 757),
    ...fx('pop', 946, 962, 1008),
    ...fx('riser-short', 1018),
    ...fx('enter', 1032),
    ...fx('pop', 1192),
    ...fx('tick', 1273, 1319),
    ...fx('whoosh-simple', 1472),
    ...fx('tick', 1505, 1509, 1513, 1517, 1521),
    ...fx('pop', 1569),
    ...fx('gear', 1742),
    ...fx('enter', 1651),
    ...fx('pop', 1901, 1909, 1917),
    ...fx('whoosh-simple', 1985),
    ...fx('money2', 2028),
    ...fx('enter', 2049),
  ],
  // Slow replies waste paid leads (faceless, modern story).
  video20: () => [
    cut(228, 'whoosh-med'), cut(660, 'whoosh-low'), cut(1144, 'whoosh-high'), cut(1558, 'whoosh-simple'), cut(1786, 'whoosh-med'),
    ...fx('money2', 26),
    ...fx('digital', 84, 96, 108),
    ...fx('tick', 122, 130, 138),
    ...fx('glitch', 183),
    ...fx('money', 203),
    ...fx('pop', 321, 329, 337),
    ...fx('click', 343),
    ...fx('whoosh-simple', 448),
    ...fx('enter', 520),
    ...fx('pop', 579),
    ...fx('pop', 724),
    ...fx('stretch', 771),
    ...fx('tick', 794, 804, 814, 824),
    ...fx('hit', 834),
    ...fx('glitch', 903),
    ...fx('money', 1012),
    ...fx('glitch', 1103),
    ...fx('digital', 1200),
    ...fx('pop', 1283, 1295),
    ...fx('enter', 1378),
    ...fx('digital', 1472),
    ...fx('digital', 1630),
    ...fx('pop', 1678, 1704),
    ...fx('enter', 1735),
    ...fx('stretch', 1873),
    ...fx('pop', 1940),
    ...fx('money2', 1979),
  ],
  // Don't turn the tap off (story v2 + editing pack).
  video21: () => [
    cut(159, 'whoosh-med'), cut(394, 'whoosh-low'), cut(694, 'whoosh-simple'), cut(857, 'whoosh-high'), cut(1174, 'whoosh-simple'), cut(1541, 'whoosh-med'), cut(1747, 'whoosh', true), cut(1984, 'whoosh-low'),
    ...fx('pop', 169, 200, 260),
    ...fx('stretch', 359),
    ...fx('tick', 400, 420, 440),
    ...fx('hit', 612),
    ...fx('glitch', 658),
    ...fx('money2', 707),
    ...fx('whoosh-simple', 793),
    ...fx('stamp', 821),
    ...fx('glitch', 907, 958),
    ...fx('pop', 1010, 1036, 1127),
    ...fx('pop', 1371, 1413, 1483),
    ...fx('tick', 1377, 1419, 1489),
    ...fx('pop', 1602, 1608, 1614),
    ...fx('stretch', 1677),
    ...fx('glitch', 1708),
    ...fx('glitch', 2111),
    ...fx('stretch', 2150),
    ...fx('pop', 2156, 2162, 2168, 2174),
    ...fx('stretch', 2194),
  ],
  // Referrals can't be your only source (story v2 + pack).
  video22: () => [
    cut(254, 'whoosh-simple'), cut(361, 'whoosh', true), cut(475, 'whoosh-med'), cut(921, 'whoosh-low'), cut(1054, 'whoosh-high'), cut(1399, 'whoosh-simple'), cut(1630, 'whoosh', true), cut(1858, 'whoosh-med'),
    ...fx('pop', 303, 330),
    ...fx('pop', 493, 499, 505, 511),
    ...fx('whoosh-simple', 546),
    ...fx('glitch', 640),
    ...fx('pop', 703, 754, 847),
    ...fx('glitch', 941),
    ...fx('stretch', 994),
    ...fx('enter', 1078),
    ...fx('glitch', 1237),
    ...fx('whoosh-simple', 1276),
    ...fx('pop', 1331, 1339, 1347),
    ...fx('pop', 1445, 1505, 1549),
    ...fx('tick', 1453, 1513, 1557),
    ...fx('enter', 1608),
    ...fx('pop', 1939),
    ...fx('gear', 2055),
    ...fx('pop', 2079, 2085, 2091),
    ...fx('stretch', 2101),
  ],
  // Why I started Elevate (whiteboard): behind-word hits, panel whooshes, a draw/tick per diagram stroke.
  video27: () => [
    ...fx('hit', 87), cut(118), cut(1910, 'whoosh', true), ...fx('hit', 2099),
    ...fx('stretch', 175), ...fx('pop', 196, 226), ...fx('tick', 300), ...fx('pop', 366),
    cut(422, 'whoosh-simple', true), ...fx('tick', 452, 514, 567), ...fx('stretch', 604), ...fx('glitch', 657), ...fx('pop', 664),
    cut(681, 'whoosh-simple', true), ...seq('tick', 703, 7, 4, .12),
    cut(787, 'whoosh-simple', true), ...fx('data-short', 803), ...fx('glitch', 870), ...seq('tick', 962, 5, 4, .12), ...fx('gear', 1004),
    cut(1073, 'whoosh-simple', true), ...fx('pop', 1150), ...fx('tick', 1204), ...fx('pop', 1244), ...seq('tick', 1290, 9, 4, .1), ...fx('pop', 1300),
    cut(1372, 'whoosh-simple', true), ...fx('stretch', 1483), ...fx('glitch', 1518), ...seq('tick', 1525, 6, 3, .12), ...fx('pop', 1530),
    cut(1545, 'whoosh-simple', true), ...seq('tick', 1580, 6, 7, .12), ...fx('pop', 1640), ...fx('stretch', 1874), ...fx('pop', 1880),
  ],
  // Good at the work, still struggling (whiteboard): behind-word hits, panel whooshes, one cue per drawn idea.
  video28: () => [
    ...fx('hit', 186), cut(239), cut(1900, 'whoosh', true), ...fx('hit', 1941),
    ...fx('stretch', 245), ...fx('pop', 275, 329, 369), ...seq('tick', 399, 5, 3, .12),
    cut(445, 'whoosh-simple', true), ...fx('stretch', 460), ...fx('glitch', 600),
    cut(643, 'whoosh-simple', true), ...fx('shutter', 668), ...fx('pop', 690, 756),
    cut(779, 'whoosh-simple', true), ...fx('pop', 829, 875), ...fx('hit', 933),
    cut(986, 'whoosh-simple', true), ...fx('pop', 1047, 1066, 1113, 1145), ...fx('glitch', 1202), ...seq('tick', 1250, 14, 2, .1),
    cut(1329, 'whoosh-simple', true), ...fx('pop', 1362), ...fx('money', 1523), ...fx('glitch', 1546), ...fx('pop', 1554),
    cut(1596, 'whoosh-simple', true), ...fx('pop', 1626), ...fx('riser-short', 1699), ...seq('tick', 1707, 6, 3, .12),
    cut(1745, 'whoosh-simple', true), ...fx('gear-tick', 1821), ...fx('pop', 1830),
  ],
  // $500K a year = a few strong projects a month; more without a base cracks.
  video29: () => [
    ...fx('stretch', 2), ...fx('money', 6), ...seq('tick', 35, 11, 2, .1), ...fx('pop', 52), ...fx('whoosh-simple', 67), ...fx('money2', 92), ...fx('tick', 146),
    cut(182, 'whoosh', true), ...fx('hit', 264),
    cut(368, 'whoosh-simple', true), ...fx('data-short', 370), ...fx('pop', 407, 416, 426), ...fx('stretch', 440), ...fx('tick', 454),
    cut(492, 'whoosh-simple', true), ...fx('stretch', 494), ...fx('pop', 528),
    ...fx('pop', 590, 615, 642, 668), ...fx('stretch', 716), ...fx('tick', 726), ...fx('gear-tick', 782), ...fx('glitch', 818),
    cut(832, 'whoosh', true), ...fx('hit', 1022),
  ],
  // Built on sand or rock.
  video30: () => [
    ...fx('stretch', 0), ...fx('pop', 67, 124), ...fx('tick', 130), ...fx('pop', 185), ...fx('whoosh-simple', 290), ...fx('stamp', 302),
    cut(346, 'whoosh-simple', true), ...fx('pop', 395, 402), ...fx('stretch', 460, 471, 530, 540), ...fx('tick', 605, 640),
    ...fx('whoosh-low', 700), ...fx('hit', 712), ...fx('glitch', 742), ...fx('pop', 764),
    cut(832, 'whoosh-simple', true), ...fx('stretch', 853), ...fx('money', 899), ...fx('whoosh-simple', 995), ...fx('glitch', 1048),
    ...fx('hit', 1134), ...fx('hit', 1146), ...fx('hit', 1158),
    cut(1170, 'whoosh', true), ...fx('pop', 1272), ...fx('hit', 1288),
  ],
  // The best restaurant in town with no sign.
  video31: () => [
    ...fx('stretch', 0, 21), ...fx('pop', 72), ...fx('pop', 113, 120), ...fx('pop', 198, 204),
    ...fx('glitch', 289), ...fx('glitch', 332), ...seq('tick', 364, 5, 2, .1), ...fx('glitch', 372),
    cut(392, 'whoosh', true),
    cut(520, 'whoosh-simple', true), ...fx('stretch', 516), ...seq('pop', 532, 4, 12, .18), ...fx('whoosh-simple', 575),
    cut(630, 'whoosh-simple', true), ...fx('stretch', 661), ...fx('pop', 715), ...fx('stamp', 754), ...fx('whoosh-low', 780),
    ...fx('stretch', 802), ...fx('click', 828), ...fx('riser-short', 834),
    cut(872, 'whoosh', true), ...fx('hit', 879),
  ],
  // They only see a price.
  video32: () => [
    cut(52, 'whoosh-simple'), ...fx('pop', 50), ...fx('stamp', 70), ...fx('tick', 94), ...fx('glitch', 140), ...fx('money', 222), ...fx('whoosh-simple', 228),
    cut(251, 'whoosh-simple', true), ...fx('stretch', 253), ...seq('tick', 268, 4, 9, .12), ...fx('whoosh-low', 300),
    cut(364, 'whoosh-simple', true), ...fx('stretch', 362), ...fx('money2', 372), ...fx('whoosh-low', 428),
    ...fx('pop', 500, 564, 663, 688, 720, 742, 802), ...fx('whoosh-low', 861), ...fx('pop', 893),
    cut(930, 'whoosh-simple', true), ...fx('pop', 938, 1001), ...fx('whoosh-simple', 1098),
    cut(1146, 'whoosh', true), ...fx('hit', 1150),
  ],
  // A website that exists vs one that works.
  video33: () => [
    cut(100, 'whoosh-simple'), ...fx('stretch', 102), ...fx('hit', 167), ...fx('tick', 199),
    cut(247, 'whoosh-simple', true), ...fx('pop', 250, 300), ...fx('digital', 366), ...fx('tick', 380), ...seq('tick', 423, 3, 4, .1), ...fx('glitch', 473),
    cut(502, 'whoosh-simple', true), ...fx('stretch', 530), ...seq('tick', 560, 3, 3, .1), ...fx('gear', 668), ...fx('pop', 677), ...fx('gear-tick', 760), ...fx('glitch', 770),
    cut(810, 'whoosh-simple', true), ...fx('pop', 812), ...fx('glitch', 880), ...fx('whoosh-simple', 890), ...fx('pop', 895), ...fx('tick', 910),
    cut(940, 'whoosh', true), ...fx('hit', 968),
  ],
  // My dad's business: the best contractor doesn't always win.
  video34: () => [
    ...fx('hit', 5), cut(120, 'whoosh-simple', true), ...fx('stretch', 124), ...fx('pop', 186, 253, 321),
    ...fx('tick', 220, 285, 420), ...fx('stamp', 428),
    cut(445, 'whoosh-simple', true), ...fx('pop', 452, 482), ...fx('tick', 528), ...seq('tick', 585, 12, 5, .1),
    cut(705, 'whoosh-simple', true), ...fx('pop', 708, 716), ...fx('whoosh-simple', 803), ...fx('money2', 827),
    ...fx('pop', 884, 932), ...fx('digital', 1000), ...fx('gear-tick', 1046),
    cut(1060, 'whoosh', true), ...fx('hit', 1084),
  ],
  // The homeowner's journey is a bridge.
  video35: () => [
    cut(100, 'whoosh-simple'), ...fx('stretch', 104), ...fx('pop', 127, 157, 175, 223, 283, 325, 387), ...fx('tick', 415), ...fx('riser-short', 497),
    cut(545, 'whoosh-simple', true), ...fx('stretch', 548), ...seq('tick', 556, 5, 4, .1), ...fx('whoosh-low', 676), ...fx('hit', 707),
    ...fx('glitch', 773, 843, 917, 1003), ...fx('pop', 1058),
    cut(1080, 'whoosh', true), ...fx('hit', 1106),
  ],
  // Every service page is a fishing line.
  video36: () => [
    ...fx('hit', 79), cut(110, 'whoosh-simple', true), ...fx('stretch', 112), ...seq('pop', 146, 4, 22, .2), ...fx('whoosh-simple', 313), ...fx('pop', 354),
    cut(450, 'whoosh-simple', true), ...fx('stretch', 452, 518), ...fx('whoosh-simple', 526), ...fx('water-soft-drip', 664),
    ...seq('tick', 735, 3, 10, .12), ...seq('whoosh-simple', 854, 4, 6, .08),
    cut(857, 'whoosh-simple', true), ...seq('water-soft-drip', 966, 4, 18, .08), ...fx('pop', 1064),
    cut(1057, 'whoosh', true),
  ],
  // Searchers are already raising their hand.
  video37: () => [
    cut(100, 'whoosh-simple'), ...fx('pop', 102, 112, 150, 180), ...fx('hit', 209), ...fx('stretch', 240), ...fx('gear', 245),
    cut(302, 'whoosh-simple', true), ...fx('stretch', 320), ...seq('tick', 338, 6, 3, .1), ...fx('pop', 372), ...fx('pop', 455), ...fx('glitch', 478), ...fx('pop', 512, 538),
    cut(622, 'whoosh-simple', true), ...fx('whoosh-low', 676), ...fx('pop', 751, 794), ...fx('pop', 821, 874), ...fx('tick', 917),
    cut(960, 'whoosh', true), ...fx('hit', 1052),
  ],
  // Ads are fuel, not the engine.
  video38: () => [
    ...fx('hit', 79), cut(150, 'whoosh-simple', true), ...fx('stretch', 152), ...fx('water-soft-pour', 197), ...fx('pop', 250), ...fx('gear', 262), ...fx('tick', 272),
    cut(380, 'whoosh-simple', true), ...fx('money', 382), ...fx('pop', 384, 392), ...fx('stretch', 470), ...seq('tick', 486, 5, 8, .1), ...fx('glitch', 556),
    cut(581, 'whoosh-simple', true), ...fx('stretch', 578), ...fx('money2', 586), ...fx('water-soft-drip', 620, 650, 680),
    cut(725, 'whoosh', true), ...fx('hit', 802),
    cut(845, 'whoosh-simple', true), ...fx('data-short', 842), ...fx('stretch', 850), ...fx('pop', 924, 934, 944),
  ],
  // Better in real life than online.
  video39: () => [
    ...fx('hit', 112), cut(200, 'whoosh-simple', true), ...fx('stretch', 202), ...fx('pop', 210, 216), ...fx('glitch', 299),
    cut(312, 'whoosh-simple', true), ...fx('pop', 314), ...fx('shutter', 330), ...fx('glitch', 345), ...fx('pop', 383), ...seq('tick', 445, 4, 4, .1), ...fx('stretch', 491),
    cut(562, 'whoosh-simple', true), ...fx('pop', 568), ...fx('pop', 755), ...fx('stamp', 790), ...fx('pop', 800), ...fx('digital', 875),
    cut(950, 'whoosh', true), ...fx('hit', 983),
  ],
  // Two contractors, one $20K project: who feels safer?
  video40: () => [
    ...fx('money', 72), cut(100, 'whoosh-simple', true), ...fx('pop', 102, 125), ...fx('stopwatch', 176), ...fx('pop', 205, 236),
    ...fx('pop', 262), ...fx('stretch', 268), ...fx('digital', 300), ...fx('pop', 331), ...fx('shutter', 373), ...fx('click', 405), ...fx('tick', 436, 530),
    ...fx('pop', 570), ...fx('stamp', 626), ...fx('money2', 719),
    cut(800, 'whoosh-simple', true), ...fx('pop', 823), ...fx('stamp', 861),
    cut(900, 'whoosh', true), ...fx('hit', 1126),
  ],
  // Hunting every day vs building a farm.
  video41: () => [
    ...fx('hit', 101), cut(125, 'whoosh-simple', true), ...seq('tick', 127, 3, 8, .1), ...fx('whoosh-low', 140), ...fx('pop', 228),
    cut(252, 'whoosh-simple', true), ...seq('tick', 292, 6, 3, .1), ...fx('water-soft-pour', 320), ...fx('stretch', 352), ...fx('riser-short', 389),
    cut(485, 'whoosh-simple', true), ...fx('pop', 491, 598), ...fx('pop', 794),
    cut(825, 'whoosh-simple', true), ...fx('pop', 840), ...fx('glitch', 884), ...fx('pop', 914), ...fx('glitch', 961),
    cut(990, 'whoosh', true), ...fx('hit', 1023),
  ],
  // Joseph: prepare in the years of abundance.
  video42: () => [
    ...fx('hit', 91), cut(140, 'whoosh-simple', true), ...fx('stretch', 142), ...seq('tick', 153, 7, 3, .1), ...fx('pop', 300), ...fx('riser-short', 331),
    ...fx('whoosh-simple', 403), ...seq('tick', 448, 7, 3, .08),
    cut(505, 'whoosh-simple', true), ...fx('stretch', 507, 681), ...fx('money', 690), ...fx('whoosh-low', 731), ...fx('riser-short', 876),
    cut(950, 'whoosh-simple', true), ...fx('pop', 961), ...fx('data-short', 1004), ...fx('stamp', 1046),
    cut(1100, 'whoosh', true), ...fx('hit', 1136),
  ],
  // Every trade, no blueprint.
  video43: () => [
    ...fx('hit', 123), cut(190, 'whoosh-simple', true), ...fx('stretch', 192), ...fx('pop', 263, 289, 305, 320), ...fx('pop', 396), ...fx('glitch', 433),
    ...fx('gear-tick', 510), ...fx('whoosh-low', 548), ...fx('hit', 572),
    cut(592, 'whoosh-simple', true), ...seq('pop', 603, 4, 14, .18), ...fx('whoosh-simple', 781), ...fx('stamp', 801), ...fx('riser-short', 806),
  ],
  // Speed-to-lead math.
  video6: () => [
    cut(140), cut(390, 'whoosh-data'), cut(870, 'whoosh-low'), cut(1055, 'whoosh-med'), cut(1305, 'whoosh-simple'),
    cut(1655, 'whoosh-high'), cut(1925, 'whoosh-data'), cut(2045, 'whoosh', true), cut(2360, 'whoosh-simple', true),
    // 20 lead figures pop in, label, price tag swings in.
    ...fx('data-short', 22), ...fx('tick', 30), ...fx('pop', 101), ...fx('money2', 105),
    // Message threads: lanes, A's fast reply, B typing then the late reply.
    ...fx('pop', 141, 252), ...fx('digital', 189), ...fx('tick', 206), ...seq('tick', 306, 4, 10, .12), ...fx('pop', 352), ...fx('glitch', 356),
    // Dot rows: A's closes count up, total; B's row, its closes, total.
    ...fx('data', 494 - 44), ...seq('tick', 494, 8, 3), ...fx('money', 574), ...fx('whoosh-simple', 666), ...fx('tick', 767, 770), ...fx('click', 808),
    // Sameness list, then the riser into SPEED.
    ...fx('pop', 894, 944, 969), ...fx('whoosh-simple', 1003), ...fx('riser', 1032), ...fx('hit', 1032),
    // Cash stacks land on the table, $480K, $720K, a year.
    ...seq('tick', 1108, 8, 3, .12), ...fx('money', 1114), ...seq('tick', 1176, 14, 2, .1), ...fx('money2', 1180), ...fx('click', 1242),
    // Assumptions dim, phone rings, answered first, conversation keeps moving.
    ...fx('pop', 1416, 1445), ...fx('glitch', 1518), ...fx('digital', 1548, 1558, 1568), ...fx('enter', 1577), ...fx('pop', 1600, 1610, 1620, 1630),
    // Two identical ad cards, equals sign, matching rows.
    ...fx('tick', 1660), ...fx('whoosh-simple', 1751), ...fx('click', 1781), ...fx('enter', 1833, 1858, 1881),
    // Timeline draws: ad, click, the after-the-click zone lights.
    ...fx('stretch', 1925), ...fx('pop', 1929), ...fx('click', 1939), ...fx('open', 1994 - 28), ...fx('tick', 2006, 2012, 2018),
    // Sources converge, clock appears, the minute wedge sweeps, lead arrives.
    ...fx('pop', 2438, 2459, 2490), ...fx('whoosh-simple', 2524), ...fx('pop', 2579), ...fx('gear', 2655), ...fx('enter', 2700),
  ],
};
// Optional job names (`node scripts/sfx-plans.mjs video29`) limit the rebuild to those jobs.
const only = process.argv.slice(2);
for (const [job, build] of Object.entries(jobs).filter(([j]) => !only.length || only.includes(j))) {
  const plan = JSON.parse(fs.readFileSync(`jobs/${job}/plan.captioned.json`, 'utf8'));
  const total = plan.edit.cuts.reduce((s, c) => s + c.endFrame - c.startFrame, 0);
  const effects = build().map(x => ({...x, atFrame: Math.max(0, x.atFrame)})).filter(x => x.atFrame < total - 3).sort((a, b) => a.atFrame - b.atFrame);
  plan.audio = {...plan.audio, effects};
  fs.writeFileSync(`jobs/${job}/plan.sfx.json`, JSON.stringify(plan, null, 2));
  console.log(job, effects.length, 'effects');
}
