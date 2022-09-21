export function headerInt(init: RequestInit | undefined, key: string) {
  const value = parseInt(headerString(init, key) || "");
  return isNaN(value) ? undefined : value;
}

export function headerString(init: RequestInit | undefined, key: string) {
  const keyLower = key.toLowerCase();
  const headers = init?.headers as Record<string, string> | undefined;
  return headers?.[
    Object.keys(headers).find((k) => k.toLowerCase() === keyLower) || ""
  ];
}
