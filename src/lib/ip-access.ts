export type IpAccessResult = {
  allowed: boolean;
  clientIp: string | null;
  reason?: string;
};

const LOCALHOST_RANGES = ["127.0.0.1/32"];

export function getTrustedProxyIps(): string[] {
  const raw = process.env.TRUSTED_PROXY_IPS;

  if (!raw || raw.trim().length === 0) {
    return [];
  }

  return raw
    .split(",")
    .map((ip) => normalizeIp(ip.trim()))
    .filter((ip): ip is string => Boolean(ip));
}

export function getAllowedIpRanges(): string[] {
  const raw = process.env.ALLOWED_IP_RANGES;

  if (!raw || raw.trim().length === 0) {
    return process.env.NODE_ENV === "production" ? [] : LOCALHOST_RANGES;
  }

  return raw
    .split(",")
    .map((range) => range.trim())
    .filter(Boolean);
}

export function getClientIpFromHeaders(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    const forwardedIps = forwardedFor
      .split(",")
      .map((ip) => normalizeIp(ip.trim()))
      .filter((ip): ip is string => Boolean(ip));
    const trustedProxyIps = getTrustedProxyIps();
    const lastForwarder = forwardedIps.at(-1);

    if (
      forwardedIps.length > 1 &&
      lastForwarder &&
      trustedProxyIps.includes(lastForwarder)
    ) {
      return forwardedIps[0];
    }
  }

  return null;
}

export function checkIpAccess(headers: Headers): IpAccessResult {
  const clientIp = getClientIpFromHeaders(headers);
  const allowedRanges = getAllowedIpRanges();

  if (!clientIp) {
    return {
      allowed: process.env.NODE_ENV !== "production",
      clientIp,
      reason: "client_ip_missing",
    };
  }

  if (allowedRanges.some((range) => isIpInRange(clientIp, range))) {
    return { allowed: true, clientIp };
  }

  return {
    allowed: false,
    clientIp,
    reason: "client_ip_not_allowed",
  };
}

export function isIpInRange(ip: string, range: string): boolean {
  const normalizedIp = normalizeIp(ip);
  if (!normalizedIp) return false;

  if (!range.includes("/")) {
    return normalizedIp === normalizeIp(range);
  }

  const [baseIp, prefixText] = range.split("/");
  const prefix = Number(prefixText);
  const ipNumber = ipv4ToNumber(normalizedIp);
  const baseNumber = ipv4ToNumber(normalizeIp(baseIp) ?? "");

  if (ipNumber === null || baseNumber === null) return false;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipNumber & mask) === (baseNumber & mask);
}

function normalizeIp(ip: string | null): string | null {
  if (!ip) return null;

  const value = ip.trim();

  if (value.startsWith("::ffff:")) {
    return value.replace("::ffff:", "");
  }

  if (value === "::1") {
    return "127.0.0.1";
  }

  return value;
}

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  return (
    ((numbers[0] << 24) >>> 0) +
    ((numbers[1] << 16) >>> 0) +
    ((numbers[2] << 8) >>> 0) +
    numbers[3]
  ) >>> 0;
}
