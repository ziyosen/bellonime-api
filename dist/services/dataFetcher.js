"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.belloFetch = belloFetch;
exports.getFinalUrl = getFinalUrl;
exports.getFinalUrls = getFinalUrls;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
const rawCookies = [
    { name: 'cf_clearance', value: 'Z8.wwmZqUEiEaCbxYrZ6KEdeSIO4DSGpD8m_CQGp1qc-1752605874-1.2.1.1-feRaYpWKWRaP26LnmPHPn8vVbJr7niG4W10MeGoiyJOL5drtX2THF25tf0AQ9FtsTgtqUbIZZa2D6rhSwGMuj15wOHqRuKT6aQu_SoXgF.50GIP4.tWxEQ5cDeuVMQ7thRr3cq5bCcz8REZDNxf1JtEZQC1GjLhaWEqI.QMAD.XHZEijKFcSEalBPYR_jMg2uB3wFXQYsUNBwiIxZ1rsI1O_OC22FYGME2r7uO5yHEE' },
    { name: 'HstCnv4389157', value: '1' },
    { name: '_gid', value: 'GA1.2.886466388.1752605876' },
    { name: '_gat_gtag_UA_162751770_1', value: '1' },
    { name: 'HstCmu4389157', value: '1752605876209' },
    { name: '_ga_85V0GD905H', value: 'GS2.1.s1752605874$o1$g0$t1752605874$j60$l0$h0' },
    { name: '_ga', value: 'GA1.2.70994110.1752605874' },
    { name: 'HstCfa4389157', value: '1752605876209' },
    { name: 'HstCla4389157', value: '1752605876209' },
    { name: 'HstCns4389157', value: '1' },
    { name: 'HstPn4389157', value: '1' },
    { name: 'HstPt4389157', value: '1' }
];
const COOKIE_HEADER = rawCookies
    .map(c => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');
let _gotScraping;
async function getGotScraping() {
    if (!_gotScraping) {
        const mod = await Function("return import('got-scraping')")();
        _gotScraping = mod.gotScraping;
    }
    return _gotScraping;
}
async function belloFetch(url, ref, gotConfig = {}, callback) {
    const gotScraping = await getGotScraping();
    const headers = {
        'User-Agent': userAgent,
        Referer: ref,
        Cookie: COOKIE_HEADER,
        ...gotConfig.headers
    };
    const response = await gotScraping(url, {
        ...gotConfig,
        headers,
        timeout: gotConfig.timeout || { request: 10_000 }
    });
    callback?.(response);
    return response.body;
}
async function getFinalUrl(url, ref, gotConfig = {}) {
    const gotScraping = await getGotScraping();
    const headers = {
        'User-Agent': userAgent,
        Referer: ref,
        Cookie: COOKIE_HEADER,
        ...gotConfig.headers
    };
    const res = await gotScraping(url, {
        ...gotConfig,
        method: 'HEAD',
        headers,
        followRedirect: false,
        timeout: gotConfig.timeout || { request: 15_000 }
    });
    return res.headers.location ?? url;
}
async function getFinalUrls(urls, ref, config) {
    const { retries = 3, delay = 1000 } = config.retryConfig || {};
    const attempt = async (u) => {
        for (let i = 1; i <= retries; i++) {
            try {
                return await getFinalUrl(u, ref, config.gotConfig);
            }
            catch (err) {
                if (i === retries)
                    throw err;
                await new Promise(r => setTimeout(r, delay));
            }
        }
        return '';
    };
    const settled = await Promise.allSettled(urls.map(attempt));
    return settled.map(r => (r.status === 'fulfilled' ? r.value : ''));
}
