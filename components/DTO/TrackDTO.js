export class TrackDTO {
  constructor({
    id,
    name,
    artist,
    artistId,
    albumName,
    albumId,
    thumbnail,
    durationMs,
    trackNumber,
    streamingLink,
    mediaStatus,
    isDownloaded,
    isSkipped,
    playlistName,
    playlistId,
    playlistThumbnail,
    playlistLocal
  }) {
    this.id = String(id || "");
    this.name = String(name || "");
    this.artist = String(artist || "");
    this.artistId = String(artistId || "");
    this.albumName = String(albumName || "");
    this.albumId = String(albumId || "");
    this.thumbnail = String(thumbnail || "");
    this.durationMs = Number(durationMs) || 0;
    this.trackNumber = Number(trackNumber) || 0;
    this.streamingLink = String(streamingLink || "");
    this.mediaStatus = String(mediaStatus || "online");
    this.isDownloaded = !!isDownloaded;
    this.isSkipped = !!isSkipped;
    this.playlistName = String(playlistName || "");
    this.playlistId = String(playlistId || "");
    this.playlistThumbnail = String(playlistThumbnail || "");
    this.playlistLocal = playlistLocal;
  }

  static fromSpotify(item) {
    if (!item) return null;
    return new TrackDTO({
      id: item.id,
      name: item.name,
      artist: item.artists?.[0]?.name || item.artist || "",
      artistId: item.artists?.[0]?.id || item.artist_id || "",
      albumName: item.album?.name || item.album_name || "",
      albumId: item.album?.id || item.album_id || "",
      thumbnail: item.album?.images?.[0]?.url || item.thumbnail || "",
      durationMs: item.duration_ms || 0,
      trackNumber: item.track_number || 0,
      playlistName: item.playlist_name,
      playlistId: item.playlist_id,
      playlistThumbnail: item.playlist_thumbnail,
      playlistLocal: item.playlist_local,
    });
  }

  static fromTrackPlayer(track) {
    if (!track) return null;
    return new TrackDTO({
      id: track.id,
      name: track.title || track.name,
      artist: track.artist,
      artistId: track.artist_id,
      albumName: track.album || track.album_name,
      albumId: track.album_id,
      thumbnail: track.artwork || track.thumbnail,
      durationMs: track.duration ? track.duration * 1000 : 0,
      streamingLink: track.url,
      mediaStatus: track.mediastatus,
      playlistName: track.playlist_name,
      playlistId: track.playlist_id,
      playlistThumbnail: track.playlist_thumbnail,
      playlistLocal: track.playlist_local,
    });
  }

  static fromStorage(stored) {
    if (!stored) return null;
    let data = stored;
    if (typeof stored === 'string') {
      try {
        data = JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return new TrackDTO({
      id: data.id,
      name: data.name || data.title,
      artist: data.artist,
      artistId: data.artist_id,
      albumName: data.album_name || data.album,
      albumId: data.album_id,
      thumbnail: data.thumbnail || data.artwork,
      durationMs: data.duration_ms || (data.duration ? data.duration * 1000 : 0),
      trackNumber: data.track_number || 0,
      streamingLink: data.streaming_link || data.url,
      mediaStatus: data.mediastatus || "online",
      isDownloaded: data.isDownloaded,
      isSkipped: data.skipped === true,
      playlistName: data.playlist_name,
      playlistId: data.playlist_id,
      playlistThumbnail: data.playlist_thumbnail,
      playlistLocal: data.playlist_local,
    });
  }

  toTrackPlayer() {
    const durationSec = this.durationMs / 1000;
    const streamingType = this.streamingLink?.includes(".m3u8") ? "hls" : "default";
    const base = {
      id: this.id,
      url: this.streamingLink,
      title: this.name,
      artist: this.artist,
      artist_id: this.artistId,
      artwork: this.thumbnail,
      thumbnail: this.thumbnail,
      album: this.albumName,
      album_name: this.albumName,
      album_id: this.albumId,
      duration: durationSec,
      mediastatus: this.mediaStatus,
      type: streamingType,
    };
    if (this.playlistName) base.playlist_name = this.playlistName;
    if (this.playlistId) base.playlist_id = this.playlistId;
    if (this.playlistThumbnail) base.playlist_thumbnail = this.playlistThumbnail;
    if (this.playlistLocal !== undefined) base.playlist_local = this.playlistLocal;
    return base;
  }
}
