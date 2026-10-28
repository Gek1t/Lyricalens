import { SongItem } from '../types';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

export type SupportedMusicPlatform = 'netease' | 'qq' | 'kugou' | 'kuwo' | 'migu' | 'spotify' | 'local';

interface ParsedMusicInput {
  platform: SupportedMusicPlatform;
  playlistId: string;
  cleanInput: string;
}

/**
 * Robust regex to extract playlist ID and detect platform from raw URLs, IDs, or shared text.
 */
export function parsePlaylistInput(rawInput: string, fallbackPlatform: SupportedMusicPlatform = 'netease'): ParsedMusicInput | null {
  const clean = (rawInput || '').trim();
  if (!clean) return null;

  let platform = fallbackPlatform;
  if (/qq\.com|y\.qq/i.test(clean)) platform = 'qq';
  else if (/163\.com|music\.163/i.test(clean)) platform = 'netease';
  else if (/kugou\.com/i.test(clean)) platform = 'kugou';
  else if (/kuwo\.cn/i.test(clean)) platform = 'kuwo';
  else if (/migu\.cn/i.test(clean)) platform = 'migu';

  // Extract ID
  let playlistId = '';

  // 1. Check dissid or id parameter
  const paramMatch = clean.match(/[?&](?:id|disstid|playlist_id|tid)=([a-zA-Z0-9_-]+)/i);
  if (paramMatch) {
    playlistId = paramMatch[1];
  }

  // 2. Check path pattern /playlist/(\d+) or /playlist_detail/(\d+)
  if (!playlistId) {
    const pathMatch = clean.match(/\/(?:playlist|playlist_detail|special\/single)\/([a-zA-Z0-9_-]+)/i);
    if (pathMatch) {
      playlistId = pathMatch[1];
    }
  }

  // 3. Check pure number or alphanumeric ID (e.g. 7022067757, 3778678)
  if (!playlistId) {
    const pureIdMatch = clean.match(/\b([0-9]{4,16})\b/);
    if (pureIdMatch) {
      playlistId = pureIdMatch[1];
    }
  }

  if (!playlistId) {
    playlistId = clean;
  }

  return {
    platform,
    playlistId,
    cleanInput: clean
  };
}

/**
 * Universal safe request helper (Capacitor native HTTP on Android/iOS to bypass CORS, standard fetch on browser)
 */
export async function safeHttpRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    data?: any;
    formUrlEncoded?: boolean;
  } | Record<string, string> = {}
): Promise<any> {
  // Normalize options if only headers were passed
  const isPlainHeaders = options && !('method' in options) && !('headers' in options) && !('data' in options);
  const opts = isPlainHeaders
    ? { method: 'GET', headers: options as Record<string, string>, data: undefined, formUrlEncoded: false }
    : (options as { method?: string; headers?: Record<string, string>; data?: any; formUrlEncoded?: boolean });

  const method = opts.method || 'GET';
  const headers: Record<string, string> = { ...(opts.headers || {}) };

  // Pre-serialize body and ensure content-type headers BEFORE dispatching to either CapacitorHttp or fetch
  let body: any = undefined;
  if (opts.data) {
    if (opts.formUrlEncoded) {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(opts.data)) {
        sp.append(k, String(v));
      }
      body = sp.toString();
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (typeof opts.data === 'string') {
      body = opts.data;
    } else {
      body = JSON.stringify(opts.data);
      headers['Content-Type'] = 'application/json';
    }
  }

  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      const res = await CapacitorHttp.request({
        method,
        url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...headers
        },
        data: body !== undefined ? body : opts.data
      });

      let responseData = res.data;
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch {
          // keep as string
        }
      }

      // Extract set-cookie headers if present and attach to data
      if (responseData && typeof responseData === 'object') {
        const rawHeaders = res.headers || {};
        const rawSetCookies: string[] = [];
        for (const [k, v] of Object.entries(rawHeaders)) {
          if (k.toLowerCase().includes('cookie')) {
            if (Array.isArray(v)) {
              rawSetCookies.push(...v);
            } else if (typeof v === 'string') {
              rawSetCookies.push(v);
            }
          }
        }
        let musicU = '';
        let csrf = '';
        for (const cookieItem of rawSetCookies) {
          const mU = cookieItem.match(/MUSIC_U=([^;,\s]+)/);
          if (mU) musicU = mU[1];
          const cS = cookieItem.match(/__csrf=([^;,\s]+)/);
          if (cS) csrf = cS[1];
        }

        // Native Android Bridge fallback: Synchronous native CookieManager read (never hangs!)
        if (!musicU && isNative) {
          try {
            const nativeCookie = (window as any).AndroidNativeMedia?.getCookiesForUrl?.('https://music.163.com') || '';
            const mU = nativeCookie.match(/MUSIC_U=([^;,\s]+)/);
            if (mU) musicU = mU[1];
            const cS = nativeCookie.match(/__csrf=([^;,\s]+)/);
            if (cS) csrf = cS[1];
          } catch {
            // ignore
          }
        }

        if (musicU) {
          responseData.cookie = `MUSIC_U=${musicU}; ${csrf ? `__csrf=${csrf}; ` : ''}os=pc;`;
        }
      }

      return responseData;
    } catch (e) {
      console.warn('Capacitor native HTTP failed, falling back to standard fetch:', e);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body
  });
  let responseData: any = null;
  try {
    responseData = await res.json();
  } catch {
    // not JSON
  }
  if (!res.ok) {
    if (responseData && typeof responseData === 'object' && (responseData.error || responseData.message || responseData.msg)) {
      return responseData;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  return responseData;
}

/**
 * Directly retrieve real NetEase QR Login Unikey from public endpoint
 */
export async function getNetEaseQrKeyClient(): Promise<{ success: boolean; unikey: string }> {
  try {
    const data = await safeHttpRequest('https://music.163.com/api/login/qrcode/unikey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: { type: '3' },
      formUrlEncoded: true
    });
    if (data && data.unikey) {
      return { success: true, unikey: data.unikey };
    }
  } catch (e) {
    console.warn('Direct NetEase unikey failed:', e);
  }
  return { success: false, unikey: `ncm-${Date.now().toString(36)}` };
}

/**
 * Check NetEase QR Scan status directly from client
 * 800: expired, 801: waiting scan, 802: waiting confirm, 803: success
 */
export async function checkNetEaseQrStatusClient(key: string): Promise<{
  success: boolean;
  code: number;
  message: string;
  cookie?: string;
}> {
  try {
    const timestamp = Date.now();
    const data = await safeHttpRequest(`https://music.163.com/api/login/qrcode/client/login?_t=${timestamp}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: { key, type: '3', timestamp },
      formUrlEncoded: true
    });
    if (data && typeof data === 'object') {
      const code = Number(data.code || 801);
      let cookie = data.cookie || '';
      if (code === 803 && (!cookie || !cookie.includes('MUSIC_U=')) && Capacitor.isNativePlatform()) {
        try {
          const nativeCookie = (window as any).AndroidNativeMedia?.getCookiesForUrl?.('https://music.163.com') || '';
          const mU = nativeCookie.match(/MUSIC_U=([^;,\s]+)/);
          const cS = nativeCookie.match(/__csrf=([^;,\s]+)/);
          if (mU) {
            cookie = `MUSIC_U=${mU[1]}; ${cS ? `__csrf=${cS[1]}; ` : ''}os=pc;`;
          }
        } catch {
          // ignore
        }
      }
      return {
        success: true,
        code,
        message: data.message || (code === 803 ? '授权登录成功' : code === 802 ? '待确认' : '等待扫码'),
        cookie
      };
    }
  } catch (e) {
    console.warn('Direct NetEase QR check failed:', e);
  }
  return {
    success: false,
    code: 801,
    message: '等待扫码中...'
  };
}

/**
 * Send NetEase phone SMS verification code
 */
export async function sendNetEaseCaptchaClient(
  phone: string,
  countrycode: string = '86'
): Promise<{ success: boolean; message?: string }> {
  const cleanPhone = phone.trim();
  if (!cleanPhone) {
    return { success: false, message: '请输入手机号码' };
  }

  const isNative = Capacitor.isNativePlatform();

  // 1. Try local/backend server if in web browser dev environment
  if (!isNative) {
    try {
      const res = await safeHttpRequest('/api/netease/captcha/sent', {
        method: 'POST',
        data: { phone: cleanPhone, countrycode }
      });
      if (res && (res.success || res.code === 200 || res.data?.code === 200)) {
        return { success: true, message: '短信验证码已发送，请查收' };
      }
      if (res && (res.error || res.message)) {
        return { success: false, message: res.error || res.message };
      }
    } catch {
      // fallback to direct request
    }
  }

  // 2. Direct client official endpoint via CapacitorHttp (Android/iOS) or fetch
  try {
    const directRes = await safeHttpRequest('https://music.163.com/api/sms/captcha/sent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://music.163.com/'
      },
      data: { cellphone: cleanPhone, ctcode: countrycode, secrete: 'music_middleuser_pclogin' },
      formUrlEncoded: true
    });
    if (directRes && (directRes.code === 200 || directRes.data === true)) {
      return { success: true, message: '短信验证码已发送，请查收' };
    }
    return { success: false, message: directRes?.msg || directRes?.message || '发送失败，请稍后重试' };
  } catch (err: any) {
    return { success: false, message: err?.message || '发送短信验证码异常，请检查网络' };
  }
}

/**
 * Login to NetEase via phone number and SMS captcha
 */
export async function loginNetEaseWithCaptchaClient(
  phone: string,
  captcha: string,
  countrycode: string = '86'
): Promise<{ success: boolean; cookie?: string; profile?: any; message?: string }> {
  const cleanPhone = phone.trim();
  const cleanCaptcha = captcha.trim();
  if (!cleanPhone || !cleanCaptcha) {
    return { success: false, message: '手机号和验证码不能为空' };
  }

  const isNative = Capacitor.isNativePlatform();

  // 1. Try backend server if in web dev mode
  if (!isNative) {
    try {
      const res = await safeHttpRequest('/api/netease/login/cellphone', {
        method: 'POST',
        data: { phone: cleanPhone, captcha: cleanCaptcha, countrycode }
      });
      if (res && res.success && res.cookie) {
        return {
          success: true,
          cookie: res.cookie,
          profile: res.profile,
          message: '登录成功'
        };
      }
      if (res && (res.message || res.error) && !res.success) {
        return { success: false, message: res.message || res.error };
      }
    } catch {
      // fallback
    }
  }

  // 2. Direct client official login endpoint
  try {
    const directRes = await safeHttpRequest('https://music.163.com/api/w/login/cellphone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://music.163.com/'
      },
      data: {
        phone: cleanPhone,
        countrycode,
        captcha: cleanCaptcha,
        type: '1',
        remember: 'true'
      },
      formUrlEncoded: true
    });

    if (directRes && (directRes.code === 200 || directRes.account || directRes.profile)) {
      let cookie = directRes.cookie || '';
      if (!cookie.includes('MUSIC_U=') && directRes.token) {
        cookie = `MUSIC_U=${directRes.token}; ${cookie ? cookie : 'os=pc;'}`;
      }
      if (!cookie && directRes.profile?.userId) {
        cookie = `MUSIC_U=${directRes.token || cleanPhone}; os=pc;`;
      }
      return {
        success: true,
        cookie,
        profile: directRes.profile,
        message: '登录成功'
      };
    }
    return { success: false, message: directRes?.msg || directRes?.message || '验证码错误或已失效' };
  } catch (err: any) {
    return { success: false, message: err?.message || '网络连接异常，登录失败' };
  }
}

export interface NetEaseUserProfileResult {
  success: boolean;
  profile?: {
    userId: number;
    nickname: string;
    avatarUrl: string;
    vipType?: number;
  };
  playlists?: Array<{
    id: number;
    name: string;
    coverImgUrl: string;
    trackCount: number;
    playCount: number;
  }>;
  error?: string;
}

/**
 * Fetch NetEase user profile and playlists directly using authenticated Cookie (with MUSIC_U)
 * Works client-side via CapacitorHttp / CORS-safe channels to unlock VIP user info and playlists!
 */
export async function fetchNetEaseUserProfileWithCookieClient(rawCookie: string): Promise<NetEaseUserProfileResult> {
  const cookie = (rawCookie || '').trim();
  if (!cookie) {
    return { success: false, error: '未提供网易云登录凭据 (Cookie)' };
  }

  // Format cookie: ensure it has MUSIC_U if user only pasted the token
  const normalizedCookie = cookie.startsWith('MUSIC_U=') || cookie.includes('MUSIC_U=')
    ? cookie
    : `MUSIC_U=${cookie}; os=pc;`;

  try {
    // 1. Fetch account info
    const accountUrl = 'https://music.163.com/api/nuser/account/get';
    const accData = await safeHttpRequest(accountUrl, {
      method: 'POST',
      headers: {
        'Cookie': normalizedCookie,
        'Referer': 'https://music.163.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (accData && accData.profile && accData.profile.userId) {
      const uid = accData.profile.userId;
      const profile = {
        userId: uid,
        nickname: accData.profile.nickname || '网易云VIP用户',
        avatarUrl: accData.profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        vipType: accData.profile.vipType || 0
      };

      // 2. Fetch playlists
      const plUrl = `https://music.163.com/api/user/playlist/?uid=${uid}&limit=60&offset=0`;
      const plData = await safeHttpRequest(plUrl, {
        headers: {
          'Cookie': normalizedCookie,
          'Referer': 'https://music.163.com/'
        }
      });

      const playlists: any[] = [];
      if (plData && Array.isArray(plData.playlist)) {
        plData.playlist.forEach((p: any) => {
          playlists.push({
            id: p.id,
            name: p.name || '歌单',
            coverImgUrl: p.coverImgUrl || profile.avatarUrl,
            trackCount: p.trackCount || 0,
            playCount: p.playCount || 0
          });
        });
      }

      return {
        success: true,
        profile,
        playlists
      };
    }
  } catch (e: any) {
    console.warn('Direct fetchNetEaseUserProfileWithCookieClient error:', e);
  }

  return { success: false, error: '未能验证网易云 Cookie，请确认凭据有效性' };
}

/**
 * Directly fetch NetEase user profile & all playlists given a UID or profile share URL.
 * Fallback for public playlists.
 */
export async function fetchNetEaseUserDetailAndPlaylistsClient(input: string): Promise<NetEaseUserProfileResult> {
  const clean = (input || '').trim();
  if (!clean) {
    return { success: false, error: '请输入有效的网易云用户 ID 或主页分享链接' };
  }

  // Extract UID
  let uid = '';
  const paramMatch = clean.match(/[?&]id=(\d+)/);
  if (paramMatch) {
    uid = paramMatch[1];
  } else {
    const numMatch = clean.match(/\b([0-9]{4,14})\b/);
    if (numMatch) {
      uid = numMatch[1];
    }
  }

  if (!uid) {
    return { success: false, error: '未能从输入中识别到网易云数字用户 ID' };
  }

  try {
    // 1. Fetch user detail
    const detailUrl = `https://music.163.com/api/v1/user/detail/${uid}`;
    const detailData = await safeHttpRequest(detailUrl);

    let profile = {
      userId: Number(uid),
      nickname: `网易云用户 (${uid})`,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      vipType: 0
    };

    if (detailData && detailData.profile) {
      profile = {
        userId: detailData.profile.userId || Number(uid),
        nickname: detailData.profile.nickname || profile.nickname,
        avatarUrl: detailData.profile.avatarUrl || profile.avatarUrl,
        vipType: detailData.profile.vipType || 0
      };
    }

    // 2. Fetch user playlists
    const plUrl = `https://music.163.com/api/user/playlist/?uid=${uid}&limit=60&offset=0`;
    const plData = await safeHttpRequest(plUrl);

    const playlists: any[] = [];
    if (plData && Array.isArray(plData.playlist)) {
      plData.playlist.forEach((p: any) => {
        playlists.push({
          id: p.id,
          name: p.name || '精选歌单',
          coverImgUrl: p.coverImgUrl || profile.avatarUrl,
          trackCount: p.trackCount || 0,
          playCount: p.playCount || 0
        });
      });
    }

    return {
      success: true,
      profile,
      playlists
    };
  } catch (err: any) {
    return {
      success: false,
      error: `获取网易云用户信息失败: ${err.message || '网络连接异常'}`
    };
  }
}

const PALETTES: [string, string, string][] = [
  ['#7C8F6E', '#C4AC82', '#A69880'],
  ['#5B7B88', '#BCA07D', '#8C9A9E'],
  ['#8C7A6B', '#D4B896', '#6E8B7B'],
  ['#6E7B8C', '#B8A08C', '#8CA698'],
  ['#7A6B8C', '#C4B896', '#7B8C6E'],
  ['#8C6E7B', '#A0BCA8', '#988CA6']
];

/**
 * Client-Side Direct Music Playlist Ingestion Engine
 * Zero backend dependency: directly queries NetEase, QQ Music, and Meting endpoints.
 */
export async function fetchPlaylistClient(
  input: string,
  targetPlatform?: SupportedMusicPlatform
): Promise<{ success: boolean; playlistName: string; songs: SongItem[]; error?: string }> {
  const parsed = parsePlaylistInput(input, targetPlatform);
  if (!parsed) {
    return { success: false, playlistName: '', songs: [], error: '请输入有效的歌单链接、分享文本或歌单 ID' };
  }

  const { platform, playlistId } = parsed;

  // 1. QQ 音乐 (Tencent QQ Music)
  if (platform === 'qq') {
    // Attempt A: Official QQ Music disstid API
    try {
      const qqUrl = `https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&disstid=${playlistId}&format=json`;
      const data = await safeHttpRequest(qqUrl, {
        'Referer': 'https://y.qq.com/'
      });
      if (data && data.code === 0 && Array.isArray(data.cdlist) && data.cdlist.length > 0) {
        const cd = data.cdlist[0];
        const playlistName = cd.dissname || `QQ音乐歌单 (${playlistId})`;
        const songlist = cd.songlist || [];
        const songs: SongItem[] = songlist.map((s: any, idx: number) => {
          const mid = s.songmid || s.mid || String(s.songid);
          const singerName = Array.isArray(s.singer) ? s.singer.map((x: any) => x.name).join('/') : (s.singer || 'QQ音乐歌手');
          const coverUrl = s.albummid
            ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg`
            : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
          const audioUrl = `https://api.injahow.cn/meting/?type=url&id=${mid}&server=tencent`;

          return {
            id: `qq-${mid}`,
            title: s.songname || '未知曲目',
            artist: singerName,
            duration: s.interval || 210,
            albumArtUrl: coverUrl,
            audioUrl,
            lrcText: `[00:00.00]${s.songname || '未知曲目'} - ${singerName}\n[00:04.00]QQ音乐 SQ 无损音源同步\n[00:09.00]LyricaLens Academic Immersion`,
            palette: PALETTES[idx % PALETTES.length],
            keyVocab: []
          };
        });

        if (songs.length > 0) {
          return { success: true, playlistName, songs };
        }
      }
    } catch (e) {
      console.warn('QQ Music official API failed, trying Meting fallback:', e);
    }

    // Attempt B: Meting API fallback for QQ Music
    try {
      const metingUrl = `https://api.injahow.cn/meting/?type=playlist&id=${playlistId}&server=tencent`;
      const list = await safeHttpRequest(metingUrl);
      if (Array.isArray(list) && list.length > 0) {
        const songs: SongItem[] = list.map((item: any, idx: number) => ({
          id: `qq-${item.id || item.songid || idx}`,
          title: item.name || item.title || '未知曲目',
          artist: item.artist || item.author || 'QQ音乐歌手',
          duration: item.duration || 210,
          albumArtUrl: item.pic || item.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          audioUrl: item.url || item.mp3 || `https://api.injahow.cn/meting/?type=url&id=${item.id}&server=tencent`,
          lrcText: item.lrc || `[00:00.00]${item.name || '未知曲目'} - ${item.artist || 'QQ音乐歌手'}\n[00:04.00]QQ音乐 SQ 音源同步`,
          palette: PALETTES[idx % PALETTES.length],
          keyVocab: []
        }));
        return { success: true, playlistName: `QQ音乐精选歌单 (${songs.length} 首)`, songs };
      }
    } catch (e) {
      console.warn('QQ Music Meting fallback failed:', e);
    }
  }

  // 2. 网易云音乐 (NetEase Cloud Music)
  if (platform === 'netease') {
    // Attempt A: Official NetEase v3 detail API
    try {
      const ncmUrl = `https://music.163.com/api/v3/playlist/detail?id=${playlistId}`;
      const data = await safeHttpRequest(ncmUrl, {
        'Referer': 'https://music.163.com/'
      });

      if (data && data.code === 200 && data.playlist) {
        const pl = data.playlist;
        const playlistName = pl.name || `网易云歌单 (${playlistId})`;
        const rawTracks = pl.tracks || [];
        const songs: SongItem[] = rawTracks.map((t: any, idx: number) => {
          const songId = String(t.id);
          const artists = Array.isArray(t.ar) ? t.ar.map((a: any) => a.name).join('/') : '网易云音乐人';
          const cover = t.al?.picUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
          const audioUrl = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;

          return {
            id: `ncm-${songId}`,
            title: t.name || '未知曲目',
            artist: artists,
            duration: Math.round((t.dt || 210000) / 1000),
            albumArtUrl: cover,
            audioUrl,
            lrcText: `[00:00.00]${t.name || '未知曲目'} - ${artists}\n[00:04.00]网易云音乐 原声同步\n[00:09.00]LyricaLens Academic Immersion`,
            palette: PALETTES[idx % PALETTES.length],
            keyVocab: []
          };
        });

        if (songs.length > 0) {
          return { success: true, playlistName, songs };
        }
      }
    } catch (e) {
      console.warn('NetEase official detail API failed, trying Meting fallback:', e);
    }

    // Attempt B: Meting NetEase fallback
    try {
      const metingUrl = `https://api.injahow.cn/meting/?type=playlist&id=${playlistId}&server=netease`;
      const list = await safeHttpRequest(metingUrl);
      if (Array.isArray(list) && list.length > 0) {
        const songs: SongItem[] = list.map((item: any, idx: number) => ({
          id: `ncm-${item.id || idx}`,
          title: item.name || item.title || '未知曲目',
          artist: item.artist || item.author || '网易云歌手',
          duration: item.duration || 210,
          albumArtUrl: item.pic || item.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          audioUrl: item.url || item.mp3 || `https://music.163.com/song/media/outer/url?id=${item.id}.mp3`,
          lrcText: item.lrc || `[00:00.00]${item.name || '未知曲目'} - ${item.artist || '网易云歌手'}\n[00:04.00]网易云音乐 原声同步`,
          palette: PALETTES[idx % PALETTES.length],
          keyVocab: []
        }));
        return { success: true, playlistName: `网易云精选歌单 (${songs.length} 首)`, songs };
      }
    } catch (e) {
      console.warn('NetEase Meting fallback failed:', e);
    }
  }

  // 3. 酷狗 / 酷我 / 咪咕 / Spotify Multi-platform Meting
  const serverMap: Record<string, string> = {
    kugou: 'kugou',
    kuwo: 'kuwo',
    migu: 'migu',
    spotify: 'netease'
  };
  const server = serverMap[platform] || 'netease';
  try {
    const metingUrl = `https://api.injahow.cn/meting/?type=playlist&id=${playlistId}&server=${server}`;
    const list = await safeHttpRequest(metingUrl);
    if (Array.isArray(list) && list.length > 0) {
      const songs: SongItem[] = list.map((item: any, idx: number) => ({
        id: `${platform}-${item.id || idx}`,
        title: item.name || item.title || '未知曲目',
        artist: item.artist || item.author || '歌手',
        duration: item.duration || 210,
        albumArtUrl: item.pic || item.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        audioUrl: item.url || item.mp3 || '',
        lrcText: item.lrc || `[00:00.00]${item.name || '未知曲目'} - ${item.artist || '歌手'}\n[00:04.00]多平台音频流同步`,
        palette: PALETTES[idx % PALETTES.length],
        keyVocab: []
      }));
      return { success: true, playlistName: `${platform.toUpperCase()} 歌单 (${songs.length} 首)`, songs };
    }
  } catch (e) {
    console.warn(`Multi-platform Meting failed for ${platform}:`, e);
  }

  return {
    success: false,
    playlistName: '',
    songs: [],
    error: `无法同步「${input}」歌单，请确认该歌单设置为公开可访问，或尝试在 ${platform === 'qq' ? 'QQ 音乐' : '网易云音乐'} 中复制正确的分享链接`
  };
}

export interface PlatformAuthProfile {
  platform: SupportedMusicPlatform;
  userId?: string | number;
  nickname: string;
  avatarUrl?: string;
  isVip?: boolean;
  vipLabel?: string;
  credentialSummary?: string;
  updatedAt: number;
}

export function getStoredPlatformAuth(platform: SupportedMusicPlatform): PlatformAuthProfile | null {
  try {
    const raw = localStorage.getItem(`lyricalens_${platform}_profile`);
    if (!raw) return null;
    const parsed: PlatformAuthProfile = JSON.parse(raw);
    if (platform === 'qq' && parsed) {
      const qqCookie = localStorage.getItem('lyricalens_qq_cookie') || '';
      const cookieUinMatch = qqCookie.match(/(?:pt2gguin|p_uin|uin|ptui_loginuin)=o?0*([1-9][0-9]{4,12})/);
      const existingUinMatch = String(parsed.userId || '').match(/^o?0*([1-9][0-9]{4,12})$/);
      const cleanUin = cookieUinMatch?.[1] || existingUinMatch?.[1] || '';
      if (cleanUin) {
        parsed.userId = cleanUin;
        parsed.avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${cleanUin}&s=100`;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredPlatformAuth(
  platform: SupportedMusicPlatform,
  profile: PlatformAuthProfile,
  cookieOrToken?: string
): void {
  try {
    localStorage.setItem(`lyricalens_${platform}_profile`, JSON.stringify(profile));
    if (cookieOrToken !== undefined) {
      localStorage.setItem(`lyricalens_${platform}_cookie`, cookieOrToken.trim());
    }
  } catch (e) {
    console.warn('Failed to save platform auth to localStorage:', e);
  }
}

export function removeStoredPlatformAuth(platform: SupportedMusicPlatform): void {
  try {
    localStorage.removeItem(`lyricalens_${platform}_profile`);
    localStorage.removeItem(`lyricalens_${platform}_cookie`);
    localStorage.removeItem(`lyricalens_${platform}_playlists`);
  } catch (e) {
    console.warn('Failed to remove platform auth:', e);
  }
}

/**
 * Universal Song Audio Stream Resolver for Client / Mobile Standalone App
 */
export async function resolveSongAudioClient(
  songId: string,
  platform: SupportedMusicPlatform = 'netease',
  ncmCookie?: string
): Promise<string | null> {
  const cleanId = songId.replace(/^(?:ncm|qq|kugou|kuwo|migu|spotify)-/, '').trim();
  if (!cleanId) return null;

  // 1. If NetEase with VIP cookie
  if (platform === 'netease' && ncmCookie) {
    try {
      const normalizedCookie = ncmCookie.includes('MUSIC_U=') ? ncmCookie : `MUSIC_U=${ncmCookie}; os=pc;`;
      const direct = await safeHttpRequest('https://music.163.com/api/song/enhance/player/url', {
        method: 'POST',
        headers: {
          'Cookie': normalizedCookie,
          'Referer': 'https://music.163.com/'
        },
        data: { ids: `[${cleanId}]`, br: '320000' },
        formUrlEncoded: true
      });
      const url = direct?.data?.[0]?.url;
      if (url && /^https?:\/\//i.test(url)) {
        return url;
      }
    } catch {}
  }

  // 2. High-speed multi-platform Meting resolver
  const serverMap: Record<string, string> = {
    netease: 'netease',
    qq: 'tencent',
    kugou: 'kugou',
    kuwo: 'kuwo',
    migu: 'migu'
  };
  const server = serverMap[platform] || 'netease';
  const metingUrls = [
    `https://api.injahow.cn/meting/?type=url&id=${encodeURIComponent(cleanId)}&server=${server}`,
    `https://meting.iqiq.io/api?type=url&id=${encodeURIComponent(cleanId)}&server=${server}`
  ];

  for (const endpoint of metingUrls) {
    try {
      const res = await safeHttpRequest(endpoint);
      if (typeof res === 'string' && /^https?:\/\//i.test(res) && !res.includes('404')) {
        return res;
      }
      if (res && res.url && /^https?:\/\//i.test(res.url)) {
        return res.url;
      }
    } catch {}
  }

  // 3. Kuwo direct fallback
  if (platform === 'kuwo') {
    try {
      const kwUrl = `http://antiserver.kuwo.cn/anti.s?type=convert_url&rid=${cleanId}&format=mp3&response=url`;
      const playRes = await safeHttpRequest(kwUrl);
      if (typeof playRes === 'string' && playRes.startsWith('http')) {
        return playRes.trim();
      }
    } catch {}
  }

  return null;
}

