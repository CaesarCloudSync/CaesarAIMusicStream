import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AntDesign from "react-native-vector-icons/AntDesign";
import { useEffect, useState } from "react";
import { getTableNames } from "../SQLDB/SQLDB";
import Entypo from "react-native-vector-icons/Entypo";
import { connectToDatabase } from "../SQLDB/SQLDB";
import { getyoutubelink } from "./getstreamlinks";
import { check_if_failed_download, downloadFile } from "./DownloadSong";
import TrackPlayer, { RepeatMode } from "react-native-track-player";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getstreaminglink } from "./getstreamlinks";
import { Gesture, GestureDetector, Swipeable, Directions } from "react-native-gesture-handler";

import { prefetchsong, skipToTrack, getLoadingTrackId, subscribeToLoadingTrack, setLoadingTrackId } from "../controls/controls";
import { useNavigate } from "react-router-native";
import RNFS from "react-native-fs";
import axios from "axios";
import { convertToValidFilename } from "../tool/tools";
import { MUSICSDCARDPATH } from "../constants/constants";
import { set } from "lodash";
import notifee from '@notifee/react-native';

export default function TrackItem({ album_track, setCurrentTrack, index, num_of_tracks, album_tracks, trackforplaylist, setTrackForPlaylist, handleModal, playlist_details, playlisttrackremoved, setPlaylistTrackRemoved, downloadedsongind, setDownloadedAlbumIsFull, downloadalbumisfull, removealldownloadsdone, multiplaylistselect, setMultiplePlaylistSelect }) {
    const navigate = useNavigate();

    const [album_track_state, setAlbumTrackState] = useState(album_track);
    const [album_tracks_state, setAlbumTracksState] = useState(album_tracks);
    const [isSongLoading, setIsSongLoading] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [isSkipped, setIsSkipped] = useState(false); // true when entry exists but file was age-restricted

    useEffect(() => {
        if (!album_track_state) return;
        const unsubscribe = subscribeToLoadingTrack((trackId) => {
            setIsSongLoading(trackId === album_track_state.id && !isDownloaded);
        });
        return unsubscribe;
    }, [album_track_state?.id, isDownloaded]);

    const [isDownloading, setIsDownloading] = useState(false);
    const [addedtoqueue, setAddedToQueue] = useState(false);
    const [songIsAvailable, setSongIsAvailable] = useState(true);
    const [downloadwasremoved, setDownloadWasRemoved] = useState(false);

    const navartistprofileplaylist = async () => {
        navigate("/artistprofile", { state: { "album_tracks": [album_track_state] } });
    };

    const singleTap = Gesture.Tap().onEnd((_event, success) => {
        if (success) {
            playnowsong();
        }
    });

    const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd((_event, success) => {
        if (success) {
            if (playlist_details) {
                if (!album_track_state.ytcustom) {
                    navartistprofileplaylist();
                }
            }
        }
    });

    const longPress = Gesture.LongPress().onStart(async (_event, success) => {
        if (playlist_details) { removetrackfromplaylist(); }
    });

    const [addingqueue, setAddingQueue] = useState(false);

    const togglemultiplaylistselectlongPress = Gesture.LongPress().onStart(async (_event, success) => {
        if (multiplaylistselect === false) {
            setMultiplePlaylistSelect(true);
            setTrackForPlaylist([album_track_state]);
        } else {
            setMultiplePlaylistSelect(false);
            setTrackForPlaylist([]);
        }
    });

    const showplaylistoptionsdoubleTap = Gesture.Tap().numberOfTaps(2).onEnd((_event, success) => {
        handleModal();
    });

    const toggleaddplaylistselectsinglePress = Gesture.Tap().onEnd(async (_event, success) => {
        if (multiplaylistselect === false) {
            showplaylistoptions();
        } else {
            if (trackforplaylist !== undefined && trackforplaylist.some(item => item.name === album_track_state.name)) {
                setTrackForPlaylist(trackforplaylist.filter(item => item.name !== album_track_state.name));
            } else {
                addplaylisttomultiselect();
            }
        }
    });

    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const addplaylisttomultiselect = async () => {
        setTrackForPlaylist([...trackforplaylist, album_track_state]);
    };

    const flingleft = Gesture.Fling()
        .direction(Directions.LEFT)
        .onEnd(async (event) => {
            setAddingQueue(true);
            const queue = await AsyncStorage.getItem("queue");
            if (!queue) {
                let currentTrackInd = await TrackPlayer.getActiveTrackIndex();
                if (currentTrackInd !== undefined) {
                    let currentTrack = await TrackPlayer.getTrack(currentTrackInd);
                    const stored_album_tracks = await AsyncStorage.getItem("current-tracks");
                    if (stored_album_tracks) {
                        const current_album_tracks = JSON.parse(stored_album_tracks);
                        const currentTrackIndexInaAlbum = current_album_tracks.findIndex(track => track.id == currentTrack.id);
                        let next_track_index = currentTrackIndexInaAlbum + 1 == current_album_tracks.length ? 0 : currentTrackIndexInaAlbum + 1;
                        await AsyncStorage.setItem("track_after_queue", JSON.stringify(next_track_index));
                    }
                }
                await AsyncStorage.setItem("queue", JSON.stringify([album_tracks_state[index]]));
            } else {
                let queue_json = JSON.parse(queue);
                queue_json.push(album_tracks_state[index]);
                await AsyncStorage.setItem("queue", JSON.stringify(queue_json));
            }
            setAddedToQueue(true);
            await timeout(1200);
            setAddingQueue(false);
            await AsyncStorage.setItem(`queue-current-track-${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`, JSON.stringify(album_tracks_state));
        });

    const downloadsong = async () => {
        setIsDownloading(true);
        setIsSongLoading(true);
        try {
            const [youtube_link, title] = await getstreaminglink(album_track_state);
            if (!youtube_link) {
                await AsyncStorage.setItem(
                    `downloaded-track:${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`,
                    JSON.stringify({ ...album_track_state, skipped: true })
                );
                setIsDownloaded(true);
                Alert.alert(
                    "Track Unavailable",
                    `"${album_track_state.name}" is age-restricted and can't be downloaded.`
                );
                let number_of_downloaded = 0;
                const promises = album_tracks_state.map(async (album_track) => {
                    const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${album_track.artist}-${album_track.album_name}-${album_track.name}`);
                    if (track_downloaded) { number_of_downloaded += 1; }
                });
                await Promise.all(promises);
                if (number_of_downloaded === album_tracks_state.length) {
                    setDownloadedAlbumIsFull(prev => !prev);
                }
                return;
            }
            await downloadFile(youtube_link, album_track_state.name, title, album_track);
            await notifee.cancelNotification('complete');
            setIsDownloaded(true);
            let number_of_downloaded = 0;
            const promises = album_tracks_state.map(async (album_track) => {
                const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${album_track.artist}-${album_track.album_name}-${album_track.name}`);
                if (track_downloaded) { number_of_downloaded += 1; }
            });
            await Promise.all(promises);
            if (number_of_downloaded === album_tracks_state.length) {
                setDownloadedAlbumIsFull(!downloadalbumisfull);
            }
        } finally {
            setIsSongLoading(false);
            setIsDownloading(false);
        }
    };

    const playnowsong = async () => {
        if (!isDownloaded && getLoadingTrackId() !== null) {
            console.log("A song is already loading, ignoring press.");
            return;
        }
        
        const is_real_dl = isDownloaded && !isSkipped;
        if (!is_real_dl) {
            setIsSongLoading(true);
        }

        try {
            // 1. PREFETCH ABSOLUTE FIRST - Fetch stream link before anything else changes or gets reset
            if (!is_real_dl && typeof prefetchsong === 'function') {
                console.log("Prefetching stream URL at the beginning of the sequence...");
                try {
                    await prefetchsong(album_track_state);
                } catch (prefetchError) {
                    console.log("Prefetch encountered an error, falling back directly to link retrieval:", prefetchError);
                    await getstreaminglink(album_track_state);
                }
            }

            // Update metadata states in storage
            if (album_tracks_state && album_tracks_state.length > 0) {
                await AsyncStorage.setItem("current-tracks", JSON.stringify(album_tracks_state));
                await AsyncStorage.setItem("current-track", JSON.stringify(album_track_state));
            }
            
            // 2. CONTEXT RESET - Clear track errors and clean state only after network resolving finishes
            try {
                const activeTrackInd = await TrackPlayer.getActiveTrackIndex();
                if (activeTrackInd != null) {
                    const activeTrack = await TrackPlayer.getTrack(activeTrackInd);
                    const newContext = album_track_state.playlist_name || album_track_state.album_name;
                    const activeContext = activeTrack?.playlist_name || activeTrack?.album_name;
                    
                    if (newContext && activeContext && newContext !== activeContext) {
                        console.log('Context switch: Resetting player engine to load new context sequence.');
                        await TrackPlayer.reset();
                    }
                } else {
                    await TrackPlayer.reset();
                }
            } catch (e) {
                console.log('Context evaluation dropped into error state. Executing fallback reset:', e);
                await TrackPlayer.reset();
            }

            // 3. EXECUTE PLAYBACK - Instantly skips to the target pre-cached song
            await skipToTrack(album_track_state, 0);

        } catch (globalError) {
            console.error("Playback execution failed:", globalError);
        } finally {
            setIsSongLoading(false);
        }
    };

    const showplaylistoptions = async () => {
        setTrackForPlaylist([album_track_state]);
        handleModal();
    };

    const removetrackfromplaylist = async () => {
        await AsyncStorage.setItem(`playlist:${playlist_details.playlist_name}`, JSON.stringify({ "playlist_name": playlist_details.playlist_name, "playlist_thumbnail": playlist_details.playlist_thumbnail, "playlist_size": playlist_details.playlist_size - 1 }));
        await AsyncStorage.removeItem(`playlist-track:${playlist_details.playlist_name}-${album_track_state.name}`);
        await AsyncStorage.removeItem(`playlist-track-order:${playlist_details.playlist_name}-${album_track_state.name}`);

        const shuffled_tracks = await AsyncStorage.getItem(`shuffled-tracks:${playlist_details.playlist_name}`);
        if (shuffled_tracks) {
            const shuffled_tracks_stored = JSON.parse(shuffled_tracks);
            const new_shuffled_tracks_stored = shuffled_tracks_stored.filter(obj => album_track_state.name !== obj.name);
            await AsyncStorage.setItem(`shuffled-tracks:${playlist_details.playlist_name}`, JSON.stringify(new_shuffled_tracks_stored));
            await AsyncStorage.setItem(`current-tracks`, JSON.stringify(new_shuffled_tracks_stored));
        }
        setPlaylistTrackRemoved(!playlisttrackremoved);
    };

    const check_downloaded = async () => {
        const key = `downloaded-track:${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`;
        const track_downloaded = await AsyncStorage.getItem(key);
        if (track_downloaded) {
            const data = JSON.parse(track_downloaded);
            const skipped = data?.skipped === true;
            setIsDownloaded(true);
            setIsSkipped(skipped);
            if (!skipped) {
                const newThumbnail = `file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`)}.jpg`;
                setAlbumTracksState(prev => prev.map(track => track.id === album_track_state.id ? { ...track, thumbnail: newThumbnail } : track));
                setAlbumTrackState(prev => ({ ...prev, thumbnail: newThumbnail }));
            }
        } else {
            setIsDownloaded(false);
            setIsSkipped(false);
        }
    };

    const removedownload = async () => {
        try {
            await RNFS.unlink(`file://${MUSICSDCARDPATH}/${convertToValidFilename(`${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`)}.mp3`);
            await RNFS.unlink(`file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`)}.jpg`);
        } catch { }
        await AsyncStorage.removeItem(`downloaded-track:${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`);
        await AsyncStorage.removeItem(`downloaded-track-order:${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`);
        const numofdownloaded = await AsyncStorage.getItem("downloaded_num");
        if (numofdownloaded) {
            let keys = await AsyncStorage.getAllKeys();
            const items = await AsyncStorage.multiGet(keys.filter((key) => key.includes(`downloaded-track:`)));
            await AsyncStorage.setItem("downloaded_num", JSON.stringify(items.length));
        }
        setDownloadWasRemoved(!downloadwasremoved);
        
        let number_of_downloaded = 0;
        const promises = album_tracks_state.map(async (album_track) => {
            const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${album_track.artist}-${album_track.album_name}-${album_track.name}`);
            if (track_downloaded) { number_of_downloaded += 1; }
        });
        await Promise.all(promises);
        if (number_of_downloaded === 0) {
            await AsyncStorage.removeItem(`library-downloaded:${album_tracks_state[0].album_name}|${album_tracks_state[0].artist}`);
        }
    };

    useEffect(() => {
        check_downloaded();
    }, [downloadwasremoved, removealldownloadsdone]);

    const check_is_downloaded = async () => {
        const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`);
        if (track_downloaded) {
            const data = JSON.parse(track_downloaded);
            setIsDownloaded(true);
            setIsSkipped(data?.skipped === true);
        } else {
            setIsDownloaded(false);
            setIsSkipped(false);
        }
    };

    useEffect(() => {
        check_is_downloaded();
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            check_is_downloaded();
        }, 2000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <GestureDetector gesture={Gesture.Exclusive(flingleft)} style={{ flex: 1 }}>
            <View style={{ flex: 1, flexDirection: "row", margin: 10, alignItems: "center" }}>
                <TouchableOpacity style={{ flex: 1 }} >
                    <GestureDetector gesture={Gesture.Exclusive(doubleTap, longPress, singleTap)} >
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                            <View style={{ position: "relative", width: 60, height: 60 }}>
                                <Image style={{ borderRadius: 5, width: 60, height: 60, opacity: isSongLoading ? 0.6 : 1 }} source={{ uri: !isDownloaded ? album_track_state.thumbnail : `file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${album_track_state.artist}-${album_track_state.album_name}-${album_track_state.name}`)}.jpg` }} />
                                {isSongLoading && (
                                    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 5 }}>
                                        <ActivityIndicator size="small" color="white" />
                                    </View>
                                )}
                            </View>
                            <View style={{ padding: 6 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: "white" }}>{album_track_state.name}</Text>
                                <Text style={{ color: "grey" }}>{album_track_state.artist}</Text>
                            </View>
                        </View>
                    </GestureDetector>
                </TouchableOpacity>

                <View style={{ flex: 0.15, width: "100%", height: "100%", justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 20 }}>
                    <TouchableOpacity
                        onLongPress={() => { removedownload(); }}
                        onPress={() => {
                            const handlePress = async () => {
                                if (isDownloading || getLoadingTrackId() !== null) {
                                    return;
                                }
                                setIsSongLoading(true);
                                try {
                                    if (!isDownloaded || isSkipped) {
                                        await downloadsong();
                                    }
                                    await playnowsong();
                                } finally {
                                    setIsSongLoading(false);
                                }
                            };
                            handlePress();
                        }}
                    >
                        <MaterialCommunityIcons
                            name="download-circle-outline"
                            style={{
                                fontSize: 25,
                                color: isDownloading ? "green"
                                    : isSkipped ? "#FFA500"
                                    : isDownloaded ? "green"
                                    : "white",
                                marginRight: 15
                            }}
                        />
                    </TouchableOpacity>
                    <GestureDetector gesture={Gesture.Exclusive(showplaylistoptionsdoubleTap, togglemultiplaylistselectlongPress, toggleaddplaylistselectsinglePress)}>
                        <MaterialIcons name="playlist-add" size={24} color={trackforplaylist !== undefined && trackforplaylist.some(item => item.name === album_track_state.name) && multiplaylistselect === true ? "#7097d6" : "white"} />
                    </GestureDetector>

                    {addingqueue === true && <View style={{ width: 35, height: 25, backgroundColor: "green" }} />}
                </View>
            </View>
        </GestureDetector>
    );
}