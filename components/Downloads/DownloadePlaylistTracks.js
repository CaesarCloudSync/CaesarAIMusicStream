import { useEffect, useState, useCallback, useMemo } from "react"
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native"
import { useNavigate } from "react-router-native"
import TrackItem from "../Tracks/TrackItem"
import AntDesign from "react-native-vector-icons/AntDesign"
import TrackPlayer, { State, useProgress } from "react-native-track-player";
import TrackProgress from "../TrackProgress/TrackProgress";
import { usePlaybackState } from 'react-native-track-player';
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import ShowQueue from "../ShowQueue/showqueue"
import { TextInput } from "react-native-gesture-handler"
import PlaylistModal from "../PlaylistModal/playlistmodal"
import { GestureDetector, Gesture } from "react-native-gesture-handler"
import RNFS from "react-native-fs";
import { skipToTrack } from "../controls/controls";

const BATCH_SIZE = 20;
const SHUFFLE_KEY = "shuffled-tracks:downloaded";

export default function DownloadedPlaylistTracks({ currentTrack, setCurrentTrack, seek, setSeek }) {

    const { position, duration } = useProgress(200);
    const navigate = useNavigate();
    const [trackforplaylist, setTrackForPlaylist] = useState([]);
    const playerState = usePlaybackState();

    // allTracks: the currently active order (shuffled or sorted).
    // sortedTracks: always the original sorted order, used to restore after unshuffle.
    const [allTracks, setAllTracks] = useState([]);
    const [sortedTracks, setSortedTracks] = useState([]);
    const [hasbeenshuffled, setHasBeenShuffled] = useState(false);

    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [filteruserinput, setFilterInput] = useState("");
    const [playlisttrackremoved, setPlaylistTrackRemoved] = useState(false);
    const [isfilterTyping, setIsFilterTyping] = useState(false);

    const handleModal = () => setIsModalVisible(v => !v);

    // Stable filtered list
    const filteredTracks = useMemo(() => {
        if (filteruserinput === "") return allTracks;
        const q = filteruserinput.toLowerCase();
        return allTracks.filter(item =>
            item.name?.toLowerCase().includes(q) ||
            item.artist?.toLowerCase().includes(q)
        );
    }, [allTracks, filteruserinput]);

    // Reset visible count when filter changes
    useEffect(() => {
        setVisibleCount(BATCH_SIZE);
    }, [filteruserinput]);

    const visibleTracks = useMemo(() => filteredTracks.slice(0, visibleCount), [filteredTracks, visibleCount]);

    const loadMoreTracks = useCallback(() => {
        if (isLoadingMore) return;
        if (visibleCount >= filteredTracks.length) return;
        setIsLoadingMore(true);
        setVisibleCount(prev => prev + BATCH_SIZE);
        setIsLoadingMore(false);
    }, [isLoadingMore, visibleCount, filteredTracks.length]);

    // ── Shuffle: same pattern as PlaylistTracks ────────────────────────────────
    const shuffletracks = async () => {
        const base = sortedTracks.length > 0 ? sortedTracks : allTracks;
        if (base.length === 0) return;
        const shuffled = base
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
        await TrackPlayer.reset();
        setHasBeenShuffled(true);
        await AsyncStorage.setItem(SHUFFLE_KEY, JSON.stringify(shuffled));
        setAllTracks(shuffled);
        setVisibleCount(BATCH_SIZE);
        await AsyncStorage.setItem("current-tracks", JSON.stringify(shuffled));
    };

    const unlockshuffle = async () => {
        setHasBeenShuffled(false);
        await AsyncStorage.removeItem(SHUFFLE_KEY);
        await TrackPlayer.reset();
        setAllTracks(sortedTracks);
        setVisibleCount(BATCH_SIZE);
        await AsyncStorage.setItem("current-tracks", JSON.stringify(sortedTracks));
    };

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .runOnJS(true)
        .onEnd((_event, success) => {
            if (success) { shuffletracks(); }
        });

    // ── Load downloaded tracks from storage ───────────────────────────────────
    const getplaylist = async () => {
        let keys = await AsyncStorage.getAllKeys();

        // Only fetch real track entries — exclude order keys
        const trackKeys = keys.filter(k =>
            k.includes("downloaded-track:") &&
            !k.includes("downloaded-track-order:")
        );
        const items = await AsyncStorage.multiGet(trackKeys);
        const playlist_tracks = items
            .filter(item => item[1] !== null)
            .map(item => { try { return JSON.parse(item[1]); } catch { return null; } })
            .filter(obj => obj !== null && obj.name); // skip null / malformed entries

        const orderKeys = keys.filter(k => k.includes("downloaded-track-order:"));
        const items_order = await AsyncStorage.multiGet(orderKeys);
        const playlist_tracks_order = items_order
            .filter(item => item[1] !== null)
            .map(item => { try { return JSON.parse(item[1]); } catch { return null; } })
            .filter(Boolean);

        playlist_tracks.sort((a, b) => {
            try {
                const oA = playlist_tracks_order.find(o => o.name === a.name)?.order ?? 0;
                const oB = playlist_tracks_order.find(o => o.name === b.name)?.order ?? 0;
                return oA - oB;
            } catch { return 0; }
        });

        setSortedTracks(playlist_tracks);

        // Check if a shuffle is already locked
        const shuffled = await AsyncStorage.getItem(SHUFFLE_KEY);
        if (shuffled) {
            const parsed = JSON.parse(shuffled).filter(obj => obj !== null && obj.name);
            setHasBeenShuffled(true);
            setAllTracks(parsed);
        } else {
            setAllTracks(playlist_tracks);
        }
        setVisibleCount(BATCH_SIZE);
    };

    useEffect(() => {
        getplaylist();
    }, [playlisttrackremoved]);

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator size="small" color="white" />
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#141212" }}>

            {/* Header row */}
            <View style={{ flexDirection: "row" }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { navigate(-1); }}>
                    <AntDesign name="arrowleft" style={{ fontSize: 30 }} />
                </TouchableOpacity>
            </View>

            {/* Cover art — double-tap to shuffle */}
            <TouchableOpacity style={{ justifyContent: "center", alignItems: "center", flex: 0.5 }}>
                <View style={{ borderRadius: 5, overflow: "hidden", width: 175, height: 175 }}>
                    <GestureDetector gesture={Gesture.Exclusive(doubleTap)}>
                        <Image style={{ borderRadius: 5, width: 175, height: 175 }} source={require('../../assets/Download.png')} />
                    </GestureDetector>
                </View>
            </TouchableOpacity>

            {/* Title + track count */}
            <View style={{ flex: isfilterTyping ? 0.9 : 0.1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "white", fontSize: 20 }}>Downloaded Songs</Text>
                <Text style={{ color: "grey", fontSize: 15 }}>{allTracks.length} Tracks</Text>
            </View>

            {/* Shuffle lock — same style as PlaylistTracks */}
            {hasbeenshuffled === true &&
                <View style={{ alignItems: "flex-end", marginRight: 20, marginBottom: 4 }}>
                    <TouchableOpacity onLongPress={() => { unlockshuffle(); }}>
                        <AntDesign name="lock" size={20} style={{ color: "green" }} />
                    </TouchableOpacity>
                </View>
            }

            {/* Filter/Search */}
            <View style={{ flexDirection: "row" }}>
                <AntDesign style={{ position: "relative", top: 18 }} name="filter" />
                <TextInput
                    style={{ width: "100%" }}
                    placeholder="Search songs..."
                    onEndEditing={() => { setIsFilterTyping(false); }}
                    onTouchStart={() => { setIsFilterTyping(true); }}
                    onChangeText={text => { setFilterInput(text); }}
                />
            </View>

            <FlatList
                data={visibleTracks}
                style={{ flex: 1, backgroundColor: "#141212" }}
                keyExtractor={(item, index) => `${item.artist}-${item.album_name}-${item.name}-${index}`}
                renderItem={({ item, index }) => (
                    <TrackItem
                        index={index}
                        setCurrentTrack={setCurrentTrack}
                        album_track={item}
                        num_of_tracks={allTracks.length}
                        album_tracks={allTracks}
                        setTrackForPlaylist={setTrackForPlaylist}
                        trackforplaylist={trackforplaylist}
                        handleModal={handleModal}
                        playlisttrackremoved={playlisttrackremoved}
                        setPlaylistTrackRemoved={setPlaylistTrackRemoved}
                    />
                )}
                onEndReached={loadMoreTracks}
                onEndReachedThreshold={0.4}
                ListFooterComponent={renderFooter}
                initialNumToRender={BATCH_SIZE}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                updateCellsBatchingPeriod={50}
            />

            <ShowCurrentTrack tracks={true} />
            <ShowQueue />
            <TrackProgress seek={seek} setSeek={setSeek} />
            <NavigationFooter currentpage={"home"} />
            <PlaylistModal isModalVisible={isModalVisible} setIsModalVisible={setIsModalVisible} trackforplaylist={trackforplaylist} />

        </View>
    );
}