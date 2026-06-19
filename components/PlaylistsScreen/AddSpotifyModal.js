import { useEffect, useState, useCallback } from "react";
import { Modal } from "../PlaylistModal/modal";
import {
  TouchableOpacity,
  Text,
  FlatList,
  TextInput,
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Entypo from "react-native-vector-icons/Entypo";
import MaterialDesignIcons from "react-native-vector-icons/MaterialCommunityIcons";
import RNFS from "react-native-fs";
import InAppBrowser from "react-native-inappbrowser-reborn";
import { convertToValidFilename } from "../tool/tools";
import { get_access_token } from "../access_token/getaccesstoken";
import { getUserAccessToken } from "../access_token/spotifyBackupHelper";

export default function AddSpotifyPlaylistModal({
  isModalVisible,
  setIsModalVisible,
  playlistchanged,
  setPlaylistChanged,
}) {
  const [userInput, setUserInput] = useState("");
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [notConnected, setNotConnected] = useState(false);
  const [urlImporting, setUrlImporting] = useState(false);

  const handleModal = () => setIsModalVisible(() => !isModalVisible);

  // ─── notify parent of change ───────────────────────────────────────────────
  const notifyChange = () => {
    setPlaylistChanged((prev) => !prev);
  };

  // ─── store a fetched playlist into AsyncStorage ────────────────────────────
  const storeonlineplaylist = async (album_tracks, spotifyPlaylistId = null) => {
    if (!album_tracks || album_tracks.length === 0) return;
    if (!("playlist_thumbnail" in album_tracks[0])) return;

    const promisestore = album_tracks.map(async (playlist_track) => {
      playlist_track["playlist_local"] = "true";
      await AsyncStorage.setItem(
        `playlist-track:${playlist_track.playlist_name}-${playlist_track.name}`,
        JSON.stringify(playlist_track)
      );
    });
    await Promise.all(promisestore);

    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(
      keys.filter((key) =>
        key.includes(`playlist-track:${album_tracks[0].playlist_name}`)
      )
    );
    const playlist_tracks = items.map((item) => JSON.parse(item[1]));
    const num_of_tracks = playlist_tracks.length;

    // download thumbnail
    const thumbnail_filePath =
      RNFS.DocumentDirectoryPath +
      `/${convertToValidFilename(album_tracks[0].playlist_name)}.jpg`;
    await RNFS.downloadFile({
      fromUrl: album_tracks[0].playlist_thumbnail,
      toFile: thumbnail_filePath,
      background: true,
      discretionary: true,
    });

    // save playlist metadata — include sync fields if a spotifyPlaylistId is provided
    const playlistMeta = {
      playlist_name: album_tracks[0].playlist_name,
      playlist_thumbnail: `file://${thumbnail_filePath}`,
      playlist_size: num_of_tracks,
    };
    if (spotifyPlaylistId) {
      playlistMeta.spotify_playlist_id = spotifyPlaylistId;
      playlistMeta.spotify_backup_enabled = true;
    }
    await AsyncStorage.setItem(
      `playlist:${album_tracks[0].playlist_name}`,
      JSON.stringify(playlistMeta)
    );

    // save order
    const promiseorder = album_tracks.map(async (playlist_track, ind) => {
      await AsyncStorage.setItem(
        `playlist-track-order:${playlist_track.playlist_name}-${playlist_track.name}`,
        JSON.stringify({ name: playlist_track.name, order: ind })
      );
    });
    await Promise.all(promiseorder);

    setIsModalVisible(false);
    notifyChange();
  };

  // ─── fetch full tracks for a playlist ID ──────────────────────────────────
  const fetchAndImportPlaylist = async (playlistId, playlistName, thumbnailUrl, autoSync) => {
    const access_token = await get_access_token();
    const headers = { Authorization: `Bearer ${access_token}` };
    const resp = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      { headers }
    );
    const feedresult = await resp.json();
    const playlist_thumbnail =
      feedresult.images && feedresult.images.length > 0
        ? feedresult.images[0].url
        : thumbnailUrl;
    const playlist_name = playlistName || `${feedresult.name} - ${feedresult.owner.display_name}`;

    const album_tracks = feedresult.tracks.items
      .filter((ti) => ti && ti.track)
      .map((trackitem) => {
        const track = trackitem.track;
        return {
          playlist_thumbnail,
          playlist_id: feedresult.id,
          playlist_name,
          album_id: track.album.id,
          album_name: track.album.name,
          name: track.name,
          id: track.id,
          artist: track.artists[0].name,
          artist_id: track.artists[0].id,
          thumbnail:
            track.album.images && track.album.images[0]
              ? track.album.images[0].url
              : playlist_thumbnail,
          track_number: track.track_number,
          duration_ms: track.duration_ms,
        };
      });

    await storeonlineplaylist(album_tracks, autoSync ? feedresult.id : null);
  };

  // ─── import via pasted URL ─────────────────────────────────────────────────
  const storespotifyplaylist = async () => {
    try {
      const match = userInput.match(/playlist\/([a-zA-Z0-9]+)/);
      if (!match) {
        alert("Invalid Spotify Playlist URL: " + userInput);
        return;
      }
      setUrlImporting(true);
      await fetchAndImportPlaylist(match[1], null, null, true);
    } catch (error) {
      console.error("Error fetching Spotify playlist:", error);
      alert("Error fetching Spotify playlist. Please check the URL and try again.");
    } finally {
      setUrlImporting(false);
    }
  };

  // ─── open Spotify in in-app browser ───────────────────────────────────────
  async function openLink() {
    try {
      const isAvailable = await InAppBrowser.isAvailable();
      const url = "https://open.spotify.com/";
      if (isAvailable) {
        InAppBrowser.open(url, {
          dismissButtonStyle: "cancel",
          preferredBarTintColor: "gray",
          preferredControlTintColor: "white",
          showTitle: true,
          toolbarColor: "#6200EE",
          secondaryToolbarColor: "black",
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: true,
        });
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  // ─── load user's Spotify playlists ────────────────────────────────────────
  const loadSpotifyPlaylists = useCallback(async () => {
    setLoadingPlaylists(true);
    setNotConnected(false);
    try {
      const token = await getUserAccessToken();
      const allPlaylists = [];
      let url = "https://api.spotify.com/v1/me/playlists?limit=50";
      while (url) {
        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json();
        if (!data.items) break;
        allPlaylists.push(...data.items);
        url = data.next;
      }
      setSpotifyPlaylists(allPlaylists);
    } catch (e) {
      console.error("Could not load Spotify playlists:", e);
      setNotConnected(true);
    } finally {
      setLoadingPlaylists(false);
    }
  }, []);

  useEffect(() => {
    if (isModalVisible) {
      loadSpotifyPlaylists();
    }
  }, [isModalVisible]);

  // ─── import a playlist from the browse list ────────────────────────────────
  const handleImportFromList = async (item) => {
    if (importingId) return;
    setImportingId(item.id);
    try {
      const playlistName = `${item.name} - ${item.owner.display_name}`;
      const thumbnailUrl =
        item.images && item.images.length > 0 ? item.images[0].url : null;
      await fetchAndImportPlaylist(item.id, playlistName, thumbnailUrl, true);
    } catch (e) {
      console.error("Import failed:", e);
      alert("Failed to import playlist: " + e.message);
    } finally {
      setImportingId(null);
    }
  };

  // ─── playlist row ──────────────────────────────────────────────────────────
  const renderPlaylistItem = ({ item }) => {
    const thumb =
      item.images && item.images.length > 0 ? item.images[0].url : null;
    const isImporting = importingId === item.id;

    return (
      <View style={styles.playlistRow}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={[styles.thumb,{marginRight:10}]} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <MaterialDesignIcons name="music" size={22} color="#888" />
          </View>
        )}
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.playlistMeta}>
            {item.tracks.total} tracks · {item.owner.display_name}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.importBtn, isImporting && styles.importBtnDisabled]}
          onPress={() => handleImportFromList(item)}
          disabled={!!importingId}
        >
          {isImporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialDesignIcons name="spotify" size={16} color="#fff" />
              <Text style={styles.importBtnText}>Import</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal isVisible={isModalVisible}>
      <Modal.Container>
        <Modal.Body>
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Spotify Playlist</Text>
            <TouchableOpacity onPress={handleModal} style={styles.closeBtn}>
              <Entypo name="cross" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── URL Paste Section ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Paste a URL</Text>
            <View style={styles.urlRow}>
              <TextInput
                style={styles.urlInput}
                placeholder="Spotify Playlist URL…"
                placeholderTextColor="#666"
                onChangeText={setUserInput}
                value={userInput}
                onSubmitEditing={storespotifyplaylist}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={openLink}
              >
                <MaterialDesignIcons name="web" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.urlImportBtn,
                (!userInput || urlImporting) && styles.urlImportBtnDisabled,
              ]}
              onPress={storespotifyplaylist}
              disabled={!userInput || urlImporting}
            >
              {urlImporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialDesignIcons name="spotify" size={16} color="#fff" />
                  <Text style={styles.urlImportBtnText}>Import from URL</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── My Playlists Browser ── */}
          <View style={styles.section}>
            <View style={styles.browseHeader}>
              <Text style={styles.sectionLabel}>My Spotify Playlists</Text>
              <TouchableOpacity onPress={loadSpotifyPlaylists} disabled={loadingPlaylists}>
                <MaterialDesignIcons
                  name="refresh"
                  size={18}
                  color={loadingPlaylists ? "#555" : "#1db954"}
                />
              </TouchableOpacity>
            </View>

            {loadingPlaylists ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1db954" />
                <Text style={styles.loadingText}>Loading playlists…</Text>
              </View>
            ) : notConnected ? (
              <View style={styles.centered}>
                <MaterialDesignIcons name="spotify" size={36} color="#555" />
                <Text style={styles.notConnectedText}>
                  Not connected to Spotify.{"\n"}Go to Settings → Connect Spotify.
                </Text>
              </View>
            ) : spotifyPlaylists.length === 0 ? (
              <View style={styles.centered}>
                <Text style={styles.notConnectedText}>No playlists found.</Text>
              </View>
            ) : (
              <FlatList
                data={spotifyPlaylists}
                keyExtractor={(item) => item.id}
                renderItem={renderPlaylistItem}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              />
            )}
          </View>
        </Modal.Body>
      </Modal.Container>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  section: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  sectionLabel: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: "#1e1b1b",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  browseBtn: {
    backgroundColor: "#2a2a2a",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  urlImportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1db954",
    borderRadius: 8,
    paddingVertical: 10,
  },
  urlImportBtnDisabled: {
    backgroundColor: "#1a7a3a",
    opacity: 0.6,
  },
  urlImportBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginHorizontal: 14,
    marginVertical: 12,
  },
  browseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  list: {
    maxHeight: 320,
  },
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    gap: 10,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: "#2a2a2a",
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  playlistMeta: {
    color: "#888",
    fontSize: 12,
  },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1db954",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 76,
    justifyContent: "center",
  },
  importBtnDisabled: {
    backgroundColor: "#1a7a3a",
    opacity: 0.7,
  },
  importBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    color: "#888",
    fontSize: 13,
    marginTop: 8,
  },
  notConnectedText: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});