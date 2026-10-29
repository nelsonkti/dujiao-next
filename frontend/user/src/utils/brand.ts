export const DEFAULT_BRAND_NAME = 'JD1688'
export const DEFAULT_BRAND_LOGO = '/jd1688.svg'

export function resolveBrandName(value: unknown): string {
  const name = String(value || '').trim()
  return name.replace(/dujiao-next(?:\s*·\s*D&N)?|D&J Studio/gi, DEFAULT_BRAND_NAME) || DEFAULT_BRAND_NAME
}
