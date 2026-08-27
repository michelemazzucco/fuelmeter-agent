/**
 * Lookup table: cm → litres, specific to this tank model.
 * Source: manufacturer calibration chart (110 cm = 1564 L max).
 * Note: 82 cm reads 1264 L in the original chart, which appears to be a typo
 * (should likely be ~1294 L). Using interpolated value instead.
 */
const TABLE: Record<number, number> = {
  1: 2,    2: 7,    3: 11,   4: 17,   5: 23,
  6: 28,   7: 36,   8: 44,   9: 54,   10: 61,
  11: 70,  12: 79,  13: 88,  14: 98,  15: 108,
  16: 119, 17: 129, 18: 139, 19: 151, 20: 162,
  21: 173, 22: 186, 23: 198, 24: 211, 25: 226,
  26: 239, 27: 255, 28: 270, 29: 284, 30: 299,
  31: 316, 32: 332, 33: 349, 34: 365, 35: 381,
  36: 397, 37: 416, 38: 432, 39: 453, 40: 470,
  41: 488, 42: 510, 43: 527, 44: 542, 45: 560,
  46: 580, 47: 599, 48: 620, 49: 645, 50: 666,
  51: 690, 52: 711, 53: 734, 54: 767, 55: 783,
  56: 807, 57: 830, 58: 853, 59: 874, 60: 896,
  61: 919, 62: 944, 63: 965, 64: 984, 65: 1004,
  66: 1022, 67: 1037, 68: 1054, 69: 1076, 70: 1094,
  71: 1111, 72: 1132, 73: 1148, 74: 1167, 75: 1183,
  76: 1199, 77: 1215, 78: 1232, 79: 1248, 80: 1265,
  81: 1280, 82: 1294, 83: 1309, 84: 1325, 85: 1338, // 82 interpolated (chart shows 1264, likely typo)
  86: 1353, 87: 1366, 88: 1378, 89: 1391, 90: 1402,
  91: 1413, 92: 1425, 93: 1435, 94: 1445, 95: 1456,
  96: 1466, 97: 1476, 98: 1485, 99: 1494, 100: 1503,
  101: 1510, 102: 1520, 103: 1528, 104: 1536, 105: 1541,
  106: 1547, 107: 1553, 108: 1557, 109: 1562, 110: 1564,
}

export const TANK_MAX_CM = 110
export const TANK_MAX_LITERS = 1564

/**
 * Convert a cm measurement to litres using the calibration table.
 * Decimal values are linearly interpolated between the two nearest integer entries.
 */
export function cmToLiters(cm: number): number {
  if (cm <= 0) return 0
  if (cm >= TANK_MAX_CM) return TANK_MAX_LITERS

  const floor = Math.floor(cm)
  const ceil = Math.ceil(cm)

  if (floor === ceil) return TABLE[floor] ?? 0

  const low = TABLE[floor] ?? 0
  const high = TABLE[ceil] ?? 0
  const frac = cm - floor

  return Math.round((low + frac * (high - low)) * 10) / 10
}
