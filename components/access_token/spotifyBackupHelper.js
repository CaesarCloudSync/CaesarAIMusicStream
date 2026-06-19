import AsyncStorage from "@react-native-async-storage/async-storage";
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { Alert } from "react-native";
import { get_access_token } from "./getaccesstoken";

const DEFAULT_CLIENT_ID = "ca6fecf0a3d94887846407a558fd2282";
const DEFAULT_CLIENT_SECRET = "1e721eca1a254a3a96c999f9b71d65f5";
const DEFAULT_REDIRECT_URI = "caesaraimusic://callback";

export const getSpotifyBackupConfig = async () => {
  const clientId = await AsyncStorage.getItem("spotify_backup_client_id") || DEFAULT_CLIENT_ID;
  const clientSecret = await AsyncStorage.getItem("spotify_backup_client_secret") || DEFAULT_CLIENT_SECRET;
  const redirectUri = await AsyncStorage.getItem("spotify_backup_redirect_uri") || DEFAULT_REDIRECT_URI;
  const accessToken = await AsyncStorage.getItem("spotify_backup_access_token") || "";
  const refreshToken = await AsyncStorage.getItem("spotify_backup_refresh_token") || "";
  const userId = await AsyncStorage.getItem("spotify_backup_user_id") || "";
  const expiresAt = await AsyncStorage.getItem("spotify_backup_expires_at") || "0";
  return { clientId, clientSecret, redirectUri, accessToken, refreshToken, userId, expiresAt };
};

export const saveSpotifyBackupConfig = async (config) => {
  if (config.clientId !== undefined) await AsyncStorage.setItem("spotify_backup_client_id", config.clientId);
  if (config.clientSecret !== undefined) await AsyncStorage.setItem("spotify_backup_client_secret", config.clientSecret);
  if (config.redirectUri !== undefined) await AsyncStorage.setItem("spotify_backup_redirect_uri", config.redirectUri);
  if (config.accessToken !== undefined) await AsyncStorage.setItem("spotify_backup_access_token", config.accessToken);
  if (config.refreshToken !== undefined) await AsyncStorage.setItem("spotify_backup_refresh_token", config.refreshToken);
  if (config.userId !== undefined) await AsyncStorage.setItem("spotify_backup_user_id", config.userId);
  if (config.expiresAt !== undefined) await AsyncStorage.setItem("spotify_backup_expires_at", String(config.expiresAt));
};

export const clearSpotifyBackupConfig = async () => {
  await AsyncStorage.multiRemove([
    "spotify_backup_client_id",
    "spotify_backup_client_secret",
    "spotify_backup_redirect_uri",
    "spotify_backup_access_token",
    "spotify_backup_refresh_token",
    "spotify_backup_user_id",
    "spotify_backup_expires_at"
  ]);
};

// Refreshes the user access token using client credentials and the stored refresh token
export const refreshUserAccessToken = async () => {
  const { clientId, clientSecret, refreshToken } = await getSpotifyBackupConfig();
  if (!refreshToken) {
    throw new Error("No refresh token available. Please log in to Spotify.");
  }
  
  const body = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret
  };
  const formBody = Object.keys(body)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(body[key]))
    .join('&');

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody
  });

  const data = await response.json();
  if (data.error) {
    if (data.error === "invalid_grant") {
      console.warn("Spotify refresh token has expired or is invalid. Discarding connection credentials.");
      await clearSpotifyBackupConfig();
    }
    throw new Error(data.error_description || data.error);
  }

  const expiresAt = Date.now() + data.expires_in * 1000;
  await saveSpotifyBackupConfig({
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt
  });

  return data.access_token;
};

// Returns a valid user access token (refreshes if expired)
export const getUserAccessToken = async () => {
  const { accessToken, expiresAt, refreshToken } = await getSpotifyBackupConfig();
  if (!accessToken) {
    throw new Error("Spotify is not connected. Please go to Settings to authenticate.");
  }
  // Check if token has expired or is expiring in next 60 seconds
  if (refreshToken && (!expiresAt || Date.now() + 60000 > Number(expiresAt))) {
    try {
      return await refreshUserAccessToken();
    } catch (e) {
      console.error("Failed to refresh user access token:", e);
      // Fallback: try using the current access token anyway
    }
  }
  return accessToken;
};

// Start OAuth authentication flow
export const authorizeWithSpotify = async () => {
  const { clientId, redirectUri } = await getSpotifyBackupConfig();
  
  const scopes = "playlist-modify-public playlist-modify-private";
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  
  const isAvailable = await InAppBrowser.isAvailable();
  if (!isAvailable) {
    throw new Error("InAppBrowser is not available. Deep linking/OAuth might not work.");
  }

  const result = await InAppBrowser.openAuth(authUrl, redirectUri, {
    // iOS Properties
    dismissButtonStyle: 'cancel',
    preferredBarTintColor: 'gray',
    preferredControlTintColor: 'white',
    // Android Properties
    showTitle: true,
    toolbarColor: '#6200EE',
    secondaryToolbarColor: 'black',
    enableUrlBarHiding: true,
    enableDefaultShare: false,
    forceCloseOnRedirection: true,
  });

  if (result.type === 'success' && result.url) {
    const url = result.url;
    const codeMatch = url.match(/[?&]code=([^&#]+)/);
    if (!codeMatch) {
      throw new Error("Authorization code not found in redirect URL.");
    }
    const code = codeMatch[1];
    
    // Exchange code for access & refresh tokens
    const { clientSecret } = await getSpotifyBackupConfig();
    const body = {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    };
    const formBody = Object.keys(body)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(body[key]))
      .join('&');

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const expiresAt = Date.now() + tokenData.expires_in * 1000;
    
    // Fetch User ID
    const meResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const meData = await meResponse.json();
    if (meData.error) {
      throw new Error(meData.error.message || "Failed to retrieve Spotify profile.");
    }

    await saveSpotifyBackupConfig({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      userId: meData.id,
      expiresAt
    });

    return meData.id;
  } else {
    throw new Error("Authorization cancelled or failed.");
  }
};

export const renameSpotifyPlaylist = async (spotifyPlaylistId, newName) => {
  try {
    const token = await getUserAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: newName })
    });
    if (!response.ok) {
      const data = await response.json();
      console.error("Error renaming playlist on Spotify:", data?.error?.message || response.statusText);
    }
  } catch (e) {
    console.error("renameSpotifyPlaylist failed:", e);
  }
};

export const deleteSpotifyPlaylist = async (spotifyPlaylistId) => {
  try {
    const token = await getUserAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/followers`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const data = await response.json();
      console.error("Error deleting playlist on Spotify:", data?.error?.message || response.statusText);
      throw new Error(data?.error?.message || response.statusText);
    }
  } catch (e) {
    console.error("deleteSpotifyPlaylist failed:", e);
    throw e;
  }
};

export const syncPlaylistToSpotify = async (playlistName, forceCreate = false) => {
  try {
    const token = await getUserAccessToken();
    const { userId } = await getSpotifyBackupConfig();
    if (!userId) {
      throw new Error("Spotify user ID is not configured. Please connect Spotify first.");
    }

    const playlistJson = await AsyncStorage.getItem(`playlist:${playlistName}`);
    if (!playlistJson) return;
    const playlist = JSON.parse(playlistJson);

    let spotifyPlaylistId = playlist.spotify_playlist_id;

    if (!spotifyPlaylistId || forceCreate) {
      const createResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: playlistName,
          description: "Backed up from CaesarAIMusicStream",
          public: false
        })
      });
      
      const createData = await createResponse.json();
      if (createData.error) {
        throw new Error(createData.error.message || "Failed to create Spotify playlist.");
      }
      spotifyPlaylistId = createData.id;
      playlist.spotify_playlist_id = spotifyPlaylistId;
      playlist.spotify_backup_enabled = true;
      await AsyncStorage.setItem(`playlist:${playlistName}`, JSON.stringify(playlist));
    }

    const keys = await AsyncStorage.getAllKeys();
    const trackKeys = keys.filter(key => key.includes(`playlist-track:${playlistName}`));
    const items = await AsyncStorage.multiGet(trackKeys);
    
    const orderKeys = keys.filter(key => key.includes(`playlist-track-order:${playlistName}`));
    const orderItems = await AsyncStorage.multiGet(orderKeys);
    const orderMap = {};
    orderItems.forEach(([key, val]) => {
      if (val) {
        const orderObj = JSON.parse(val);
        orderMap[orderObj.name] = orderObj.order;
      }
    });

    const localTracks = items.map(([_, val]) => JSON.parse(val));
    localTracks.sort((a, b) => {
      const orderA = orderMap[a.name] !== undefined ? orderMap[a.name] : 9999;
      const orderB = orderMap[b.name] !== undefined ? orderMap[b.name] : 9999;
      return orderA - orderB;
    });

    const spotifyUris = [];
    const clientAccessToken = await get_access_token();

    for (const track of localTracks) {
      if (track.id && !track.ytcustom) {
        spotifyUris.push(`spotify:track:${track.id}`);
      } else {
        try {
          const query = encodeURIComponent(`track:${track.name} artist:${track.artist}`);
          const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
            headers: { Authorization: `Bearer ${clientAccessToken || token}` }
          });
          const searchData = await searchResponse.json();
          if (searchData.tracks && searchData.tracks.items.length > 0) {
            spotifyUris.push(searchData.tracks.items[0].uri);
          } else {
            console.log(`Could not find Spotify track for: ${track.name} - ${track.artist}`);
          }
        } catch (searchError) {
          console.error(`Error searching track on Spotify: ${track.name}`, searchError);
        }
      }
    }

    if (spotifyUris.length === 0) {
      const clearResponse = await fetch(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ uris: [] })
      });
      if (!clearResponse.ok) {
        if (clearResponse.status === 404) {
          playlist.spotify_playlist_id = null;
          await AsyncStorage.setItem(`playlist:${playlistName}`, JSON.stringify(playlist));
          return await syncPlaylistToSpotify(playlistName, true);
        }
        throw new Error("Failed to clear Spotify playlist tracks.");
      }
      return;
    }

    const first100 = spotifyUris.slice(0, 100);
    const putResponse = await fetch(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uris: first100 })
    });
    
    const putData = await putResponse.json();
    if (putData.error) {
      if (putResponse.status === 404) {
        playlist.spotify_playlist_id = null;
        await AsyncStorage.setItem(`playlist:${playlistName}`, JSON.stringify(playlist));
        return await syncPlaylistToSpotify(playlistName, true);
      }
      throw new Error(putData.error.message || "Failed to replace Spotify playlist tracks.");
    }

    if (spotifyUris.length > 100) {
      for (let i = 100; i < spotifyUris.length; i += 100) {
        const batch = spotifyUris.slice(i, i + 100);
        const postResponse = await fetch(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ uris: batch })
        });
        const postData = await postResponse.json();
        if (postData.error) {
          throw new Error(postData.error.message || "Failed to append tracks to Spotify playlist.");
        }
      }
    }

    console.log(`Playlist "${playlistName}" successfully backed up to Spotify.`);
  } catch (error) {
    console.error("syncPlaylistToSpotify error:", error);
    throw error;
  }
};

export const findExistingSpotifyPlaylist = async (playlistName) => {
  try {
    const token = await getUserAccessToken();
    let url = "https://api.spotify.com/v1/me/playlists?limit=50";
    while (url) {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.items) return null;
      
      const match = data.items.find(p => p.name.toLowerCase() === playlistName.toLowerCase());
      if (match) {
        return { id: match.id, name: match.name };
      }
      url = data.next;
    }
  } catch (e) {
    console.error("findExistingSpotifyPlaylist failed:", e);
  }
  return null;
};

export const triggerBackupSync = async (playlistName) => {
  try {
    const playlistJson = await AsyncStorage.getItem(`playlist:${playlistName}`);
    if (!playlistJson) return;
    const playlist = JSON.parse(playlistJson);
    if (playlist.spotify_backup_enabled && playlist.spotify_playlist_id) {
      console.log(`Triggering automatic Spotify backup sync for "${playlistName}"...`);
      await syncPlaylistToSpotify(playlistName);
    }
  } catch (e) {
    console.error("Automatic backup sync trigger failed:", e);
  }
};
