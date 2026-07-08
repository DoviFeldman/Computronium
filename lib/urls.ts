/**
 * Small URL helpers for externally-linked 3D files.
 *
 * People naturally paste GitHub "blob" page links (the pretty viewer page),
 * but the 3D viewer needs the RAW file bytes. This converts common cases.
 */

/**
 * Turn a GitHub blob URL into a raw.githubusercontent.com URL the STL
 * viewer can actually download. Non-GitHub URLs pass through untouched.
 *
 *   https://github.com/user/repo/blob/main/arm.stl
 *     → https://raw.githubusercontent.com/user/repo/main/arm.stl
 */
export function toDirectFileUrl(url: string): string {
  const m = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/
  );
  if (m) {
    return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`;
  }
  return url;
}

/** Does this URL look like an STL file the in-browser viewer can render? */
export function looksLikeStl(urlOrName: string): boolean {
  return /\.stl(\?.*)?$/i.test(urlOrName);
}
