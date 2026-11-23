import type { VideoPlatform } from '../types';

export interface ParsedVideo {
  platform: VideoPlatform;
  embedUrl: string | null;
  platformLabel: string;
}

export function detectVideoInfo(rawUrl: string): ParsedVideo {
  const url = rawUrl.trim();
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // YouTube (watch, youtu.be, shorts, embed)
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let videoId = '';
      if (host.includes('youtu.be')) {
        videoId = parsed.pathname.slice(1).split('/')[0] ?? '';
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2] ?? '';
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/')[2] ?? '';
      } else {
        videoId = parsed.searchParams.get('v') ?? '';
      }
      return {
        platform: 'youtube',
        embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
        platformLabel: 'YouTube',
      };
    }

    // Vimeo
    if (host.includes('vimeo.com')) {
      const match = parsed.pathname.match(/\/(?:video\/)?(\d+)/);
      const videoId = match?.[1];
      return {
        platform: 'vimeo',
        embedUrl: videoId ? `https://player.vimeo.com/video/${videoId}` : null,
        platformLabel: 'Vimeo',
      };
    }

    // Google Drive file links
    if (host.includes('drive.google.com')) {
      const match = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      const fileId = match?.[1] ?? parsed.searchParams.get('id');
      return {
        platform: 'gdrive',
        embedUrl: fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null,
        platformLabel: 'Google Drive',
      };
    }

    // Instagram Reels / Posts
    if (host.includes('instagram.com')) {
      return {
        platform: 'instagram',
        embedUrl: null,
        platformLabel: 'Instagram',
      };
    }

    // Direct video URL
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(parsed.pathname)) {
      return {
        platform: 'direct',
        embedUrl: url,
        platformLabel: 'Direct Video',
      };
    }

    return {
      platform: 'other',
      embedUrl: null,
      platformLabel: host.replace(/^www\./, ''),
    };
  } catch {
    return {
      platform: 'other',
      embedUrl: null,
      platformLabel: 'Video Link',
    };
  }
}
