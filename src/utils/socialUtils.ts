/**
 * Social platform configuration and utilities
 */

export interface SocialPlatform {
  name: string;
  baseUrl: string;
  usernamePrefix?: string;
  placeholder: string;
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  Instagram: {
    name: "Instagram",
    baseUrl: "https://instagram.com/",
    placeholder: "username",
  },
  GitHub: {
    name: "GitHub",
    baseUrl: "https://github.com/",
    placeholder: "username",
  },
  LinkedIn: {
    name: "LinkedIn",
    baseUrl: "https://linkedin.com/in/",
    placeholder: "username",
  },
  Twitter: {
    name: "Twitter",
    baseUrl: "https://x.com/",
    placeholder: "username",
  },
  YouTube: {
    name: "YouTube",
    baseUrl: "https://youtube.com/@",
    placeholder: "username",
  },
  Facebook: {
    name: "Facebook",
    baseUrl: "https://facebook.com/",
    placeholder: "username",
  },
  Pinterest: {
    name: "Pinterest",
    baseUrl: "https://pinterest.com/",
    placeholder: "username",
  },
  Snapchat: {
    name: "Snapchat",
    baseUrl: "https://snapchat.com/add/",
    placeholder: "username",
  },
  TikTok: {
    name: "TikTok",
    baseUrl: "https://tiktok.com/@",
    placeholder: "username",
  },
  Telegram: {
    name: "Telegram",
    baseUrl: "https://t.me/",
    placeholder: "username",
  },
  Discord: {
    name: "Discord",
    baseUrl: "https://discord.gg/",
    placeholder: "server-invite",
  },
  WhatsApp: {
    name: "WhatsApp",
    baseUrl: "https://wa.me/",
    placeholder: "phone-number",
  },
  "Custom Link": {
    name: "Custom Link",
    baseUrl: "",
    placeholder: "https://example.com",
  },
};

/**
 * Generate a social media link from platform and username
 */
export function generateSocialLink(platform: string, username: string): string {
  const platformConfig = SOCIAL_PLATFORMS[platform];

  if (!platformConfig) {
    return username.startsWith("http") ? username : `https://${username}`;
  }

  // For custom links, return the username as-is if it's a URL
  if (platform === "Custom Link") {
    return username.startsWith("http") ? username : `https://${username}`;
  }

  // For WhatsApp, handle phone numbers
  if (platform === "WhatsApp") {
    const cleanNumber = username.replace(/[^0-9]/g, "");
    return `${platformConfig.baseUrl}${cleanNumber}`;
  }

  // For all other platforms, combine base URL with username
  return `${platformConfig.baseUrl}${username}`;
}

/**
 * Extract username from a social media URL
 */
export function extractUsernameFromUrl(platform: string, url: string): string {
  const platformConfig = SOCIAL_PLATFORMS[platform];

  if (!platformConfig || platform === "Custom Link") {
    return url;
  }

  // Remove the base URL to get just the username
  if (url.startsWith(platformConfig.baseUrl)) {
    return url.replace(platformConfig.baseUrl, "");
  }

  // If it doesn't match the expected format, return as-is
  return url;
}

/**
 * Get favicon/logo for a platform or custom link
 */
export function getPlatformLogo(platform: string, url?: string): string {
  if (platform !== "Custom Link" && SOCIAL_PLATFORMS[platform]) {
    const baseUrl = SOCIAL_PLATFORMS[platform].baseUrl;
    return `https://www.google.com/s2/favicons?sz=64&domain=${new URL(baseUrl).hostname}`;
  }

  if (url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch {
      return "https://www.google.com/s2/favicons?sz=64&domain=example.com";
    }
  }

  return "https://www.google.com/s2/favicons?sz=64&domain=example.com";
}

/**
 * Get all auto-syncable platforms (excludes WhatsApp, Discord, Custom Link)
 */
export function getAutoSyncablePlatforms(): string[] {
  return Object.keys(SOCIAL_PLATFORMS).filter(
    (platform) => !["WhatsApp", "Discord", "Custom Link"].includes(platform)
  );
}

/**
 * Check if a platform supports auto-sync with global username
 */
export function isPlatformAutoSyncable(platform: string): boolean {
  return getAutoSyncablePlatforms().includes(platform);
}

/**
 * Generate auto-synced social links for a global username
 */
export function generateAutoSyncedLinks(globalUsername: string): Array<{
  platform: string;
  username: string;
  url: string;
  is_auto_synced: boolean;
}> {
  return getAutoSyncablePlatforms().map((platform) => ({
    platform,
    username: globalUsername,
    url: generateSocialLink(platform, globalUsername),
    is_auto_synced: true,
  }));
}

/**
 * Check if a social link is auto-syncable based on platform
 */
export function canAutoSync(platform: string): boolean {
  return getAutoSyncablePlatforms().includes(platform);
}

/**
 * Get platform display name with auto-sync indicator
 */
export function getPlatformDisplayName(
  platform: string,
  isAutoSynced: boolean = false
): string {
  const baseName = SOCIAL_PLATFORMS[platform]?.name || platform;
  return isAutoSynced ? `${baseName} (Auto-synced)` : baseName;
}

/**
 * Get social platform icon component
 */
export const getSocialIcon = (platform: string) => {
  // This would return the appropriate icon component
  // Implementation depends on your icon library
  return null;
};

/**
 * Social platform colors for styling
 */
export const SOCIAL_PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#E1306C',
  LinkedIn: '#0A66C2',
  GitHub: '#333333',
  Twitter: '#1DA1F2',
  Facebook: '#1877F3',
  YouTube: '#FF0000',
  WhatsApp: '#25D366',
  Telegram: '#0088CC',
  'Custom Link': '#6366F1'
};
