// Last.fm API key - replace with your own from https://www.last.fm/api/account/create
export const LASTFM_API_KEY = "YOUR_LASTFM_API_KEY_HERE";
export const LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/";

// Helper to build Last.fm API URLs
export const buildLastFmUrl = (params) => {
    const queryParams = new URLSearchParams({
        ...params,
        api_key: LASTFM_API_KEY,
        format: "json",
    });
    return `${LASTFM_BASE_URL}?${queryParams.toString()}`;
};

// Kept for backward compatibility - Last.fm doesn't need OAuth tokens
export const get_access_token = async () => {
    return LASTFM_API_KEY;
};
