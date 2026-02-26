import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, AppState } from "react-native";
import { useLocation, useNavigate } from "react-router-native";
import TrackItem from "./TrackItem";
import AntDesign from "react-native-vector-icons/AntDesign";
import TrackPlayer, { useProgress, State, RepeatMode } from "react-native-track-player";
import TrackProgress from "../TrackProgress/TrackProgress";
import { usePlaybackState } from "react-native-track-player";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import { getstreaminglink } from "./getstreamlinks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import ShowQueue from "../ShowQueue/showqueue";
import PlaylistModal from "../PlaylistModal/playlistmodal";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { check_if_failed_download, downloadFile } from "./DownloadSong";
import RNFS from "react-native-fs";
import { convertToValidFilename } from "../tool/tools";
import { MUSICSDCARDPATH } from "../constants/constants";
import notifee from "@notifee/react-native";

export default function Tracks({ currentTrack, setCurrentTrack, seek, setSeek }) {
    const progress = useProgress();
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [multiplaylistselect, setMultiplePlaylistSelect] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [trackforplaylist, setTrackForPlaylist] = useState([]);
    const { position, duration } = useProgress(200);
    const playerState = usePlaybackState();
    const isPlaying = playerState === State.Playing;
    const [album_tracks, setAlbumTracks] = useState(location.state?.album_tracks);
    const [current_single, setCurrentSingle] = useState(location.state?.current_single);
    const [loadingaudio, setLoadingAudio] = useState(false);
    const [totalpromises, setTotalPromises] = useState(0);
    const [completedpromises, setCompletedPromises] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [downloadalbumisfull, setDownloadedAlbumIsFull] = useState(false);
    const [removealldownloadsdone, setRemoveAllDownloadsDone] = useState(false);
    const refContainer = useRef();
    const handleModal = () => setIsModalVisible(!isModalVisible);

    const navartistprofile = async () => {
        navigate("/artistprofile", { state: { album_tracks } });
    };

    /**
     * Store the current album as a local playlist.
     * Works for both "online playlist" tracks (have playlist_thumbnail) and
     * plain album tracks. No Spotify call needed.
     */
    const storeonlineplaylist = async () => {
        if (!album_tracks || album_tracks.length === 0) return;

        const hasPlaylist = "playlist_thumbnail" in album_tracks[0];
        const playlist_name = hasPlaylist
            ? album_tracks[0].playlist_name
            : `${album_tracks[0].album_name} - ${album_tracks[0].artist}`;
        const thumbnail_src = hasPlaylist
            ? album_tracks[0].playlist_thumbnail
            : album_tracks[0].thumbnail;

        const thumbnail_filePath = RNFS.DocumentDirectoryPath + `/${convertToValidFilename(playlist_name)}.jpg`;
        try {
            await RNFS.downloadFile({
                fromUrl: thumbnail_src,
                toFile: thumbnail_filePath,
                background: true,
                discretionary: true,
            }).promise;
        } catch (_) { /* thumbnail optional */ }

        const promisestore = album_tracks.map(async (track, index) => {
            const t = { ...track, playlist_local: "true", playlist_name };
            await AsyncStorage.setItem(`playlist-track:${playlist_name}-${t.name}`, JSON.stringify(t));
            await AsyncStorage.setItem(
                `playlist-track-order:${playlist_name}-${t.name}`,
                JSON.stringify({ name: t.name, order: index })
            );
        });
        await Promise.all(promisestore);

        await AsyncStorage.setItem(
            `playlist:${playlist_name}`,
            JSON.stringify({
                playlist_name,
                playlist_thumbnail: `file://${thumbnail_filePath}`,
                playlist_size: album_tracks.length,
            })
        );

        navigate("/playlists");
    };

    useEffect(() => {
        setAlbumTracks(location.state?.album_tracks || []);
    }, [location.state?.album_tracks]);

    const check_all_downloaded = async () => {
        if (!album_tracks || album_tracks.length === 0) return;
        let number_of_downloaded = 0;
        const promises = album_tracks.map(async (album_track) => {
            const downloaded = await AsyncStorage.getItem(
                `downloaded-track:${album_track.artist}-${album_track.album_name}-${album_track.name}`
            );
            if (downloaded) number_of_downloaded++;
        });
        await Promise.all(promises);
        if (number_of_downloaded === album_tracks.length) {
            const libraryKey = `library:${album_tracks[0].album_name}|${album_tracks[0].artist}`;
            const lib = await AsyncStorage.getItem(libraryKey);
            if (!lib) {
                await AsyncStorage.setItem(libraryKey, JSON.stringify(album_tracks));
                await AsyncStorage.setItem(
                    `library-downloaded:${album_tracks[0].album_name}|${album_tracks[0].artist}`,
                    JSON.stringify({ downloaded: "true" })
                );
            }
            setIsDownloaded(true);
        }
        if (number_of_downloaded === 0) {
            await AsyncStorage.removeItem(`library-downloaded:${album_tracks[0].album_name}|${album_tracks[0].artist}`);
        }
    };

    useEffect(() => { check_all_downloaded(); }, [downloadalbumisfull]);

    const downloadallsong = async () => {
        setIsDownloading(true);
        let number_of_downloaded = 0;
        const promises = album_tracks.map(async (album_track) => {
            const [youtube_link, title] = await getstreaminglink(album_track);
            await downloadFile(youtube_link, album_track.name, title, album_track);
            number_of_downloaded++;
            await notifee.cancelNotification("done");
        });
        await Promise.all(promises);
        await notifee.cancelNotification("done");
        if (number_of_downloaded === album_tracks.length) {
            const libraryKey = `library:${album_tracks[0].album_name}|${album_tracks[0].artist}`;
            const lib = await AsyncStorage.getItem(libraryKey);
            if (!lib) {
                await AsyncStorage.setItem(libraryKey, JSON.stringify(album_tracks));
                await AsyncStorage.setItem(
                    `library-downloaded:${album_tracks[0].album_name}|${album_tracks[0].artist}`,
                    JSON.stringify({ downloaded: "true" })
                );
            }
            setIsDownloaded(true);
        }
        setIsDownloaded(true);
        await notifee.cancelNotification("complete");
    };

    useEffect(() => {
        if (refContainer.current && current_single) {
            const idx = album_tracks.findIndex(t => t.name === current_single);
            if (idx !== -1) {
                refContainer.current.scrollToIndex({ animated: true, index: idx, viewPosition: 0 });
            }
        }
    }, []);

    const removealldownloads = async () => {
        const promises = album_tracks.map(async (album_track) => {
            const downloaded = await AsyncStorage.getItem(
                `downloaded-track:${album_track.artist}-${album_track.album_name}-${album_track.name}`
            );
            if (downloaded) {
                try {
                    await RNFS.unlink(`file://${MUSICSDCARDPATH}/${convertToValidFilename(`${album_track.artist}-${album_track.album_name}-${album_track.name}`)}.mp3`);
                    await RNFS.unlink(`file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${album_track.artist}-${album_track.album_name}-${album_track.name}`)}.jpg`);
                } catch (_) {}
                await AsyncStorage.removeItem(`downloaded-track:${album_track.artist}-${album_track.album_name}-${album_track.name}`);
                await AsyncStorage.removeItem(`downloaded-track-order:${album_track.artist}-${album_track.album_name}-${album_track.name}`);
                await AsyncStorage.removeItem(`library-downloaded:${album_tracks[0].album_name}|${album_tracks[0].artist}`);
                const keys = await AsyncStorage.getAllKeys();
                const items = await AsyncStorage.multiGet(keys.filter(k => k.includes("downloaded-track:")));
                await AsyncStorage.setItem("downloaded_num", JSON.stringify(items.length));
            }
        });
        await Promise.all(promises);
        setRemoveAllDownloadsDone(true);
    };

    if (!album_tracks || album_tracks.length === 0) {
        return <View style={{ flex: 1, backgroundColor: "#141212" }} />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#141212" }}>
            <View style={{ flexDirection: "row" }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => navigate(-1)}>
                    <AntDesign name="arrowleft" style={{ fontSize: 30 }} />
                </TouchableOpacity>
                {loadingaudio && (
                    <View>
                        <View style={{ width: 50, height: 3, backgroundColor: "white" }}>
                            <View style={{ width: `${(completedpromises / totalpromises) * 100}%`, height: 3, backgroundColor: "blue" }} />
                        </View>
                        <Text style={{ fontSize: 10 }}>{completedpromises}/{totalpromises}</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity
                onLongPress={storeonlineplaylist}
                onPress={navartistprofile}
                style={{ justifyContent: "center", alignItems: "center", flex: 0.4 }}
            >
                <Image
                    style={{ borderRadius: 5, width: 175, height: 175 }}
                    source={{
                        uri: "playlist_thumbnail" in album_tracks[0]
                            ? album_tracks[0].playlist_thumbnail
                            : album_tracks[0].thumbnail,
                    }}
                />
            </TouchableOpacity>

            <View style={{ flex: 0.1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "white", fontSize: 20 }}>
                    {"playlist_thumbnail" in album_tracks[0]
                        ? album_tracks[0].playlist_name
                        : album_tracks[0].album_name}
                </Text>
            </View>

            <TouchableOpacity
                style={{ alignItems: "flex-end" }}
                onLongPress={removealldownloads}
                onPress={() => { if (!isDownloaded && !isDownloading) downloadallsong(); }}
            >
                <MaterialCommunityIcons
                    name="download-circle-outline"
                    style={{ fontSize: 25, color: isDownloaded || isDownloading ? "green" : "white", marginRight: 15 }}
                />
            </TouchableOpacity>

            <FlatList
                initialScrollIndex={0}
                ref={refContainer}
                data={album_tracks}
                keyExtractor={(item, index) => `${item.id}-${item.album_id}${index}`}
                style={{ flex: 1, backgroundColor: "#141212" }}
                renderItem={({ item, index }) => (
                    <TrackItem
                        index={index}
                        setCurrentTrack={setCurrentTrack}
                        album_track={item}
                        num_of_tracks={album_tracks.length}
                        album_tracks={album_tracks}
                        setTrackForPlaylist={setTrackForPlaylist}
                        trackforplaylist={trackforplaylist}
                        handleModal={handleModal}
                        setDownloadedAlbumIsFull={setDownloadedAlbumIsFull}
                        downloadalbumisfull={downloadalbumisfull}
                        removealldownloadsdone={removealldownloadsdone}
                        multiplaylistselect={multiplaylistselect}
                        setMultiplePlaylistSelect={setMultiplePlaylistSelect}
                    />
                )}
                onScrollToIndexFailed={info => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        refContainer.current?.scrollToIndex({ index: info.index, animated: true });
                    });
                }}
            />
            <ShowCurrentTrack setAlbumTracks={setAlbumTracks} tracks={true} />
            <ShowQueue />
            <TrackProgress seek={seek} setSeek={setSeek} />
            <NavigationFooter currentpage={"home"} />
            <PlaylistModal isModalVisible={isModalVisible} setIsModalVisible={setIsModalVisible} trackforplaylist={trackforplaylist} />
        </View>
    );
}
