import React, { useState, useEffect } from "react";
import { ActivityIndicator, Button, FlatList, StatusBar, StyleSheet, Text, View, Modal as RNModal } from "react-native";
import Modal from "react-native-modal";
import TrackPlayer, {
  useTrackPlayerEvents,
  usePlaybackState,
  Event,
  State
} from 'react-native-track-player';
import { TouchableOpacity, Image } from "react-native";
import { autoplaynextsong, get_recommended_songs, getLoadingTrackId, subscribeToLoadingTrack, is_track_restricted } from "../controls/controls";
import { getstreaminglink } from "../Tracks/getstreamlinks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { skipToTrack } from "../controls/controls";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getrecommendations } from "../Tracks/getrecommendations";
import Entypo from 'react-native-vector-icons/Entypo';
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import { SectionList } from "react-native";
import { get_access_token } from "../access_token/getaccesstoken";
import { prefetchsong } from "../controls/controls";
import { searchsongsrecommend } from "../Tracks/getrecommendations";
import { getsongrecommendation, getspecificsongrecommendation, repopulaterecommendations } from "../../trackPlayerServices";
import PlaylistModal from "../PlaylistModal/playlistmodal";

function RecommendTrackItem({
  item,
  index,
  loadingItemId,
  globalLoadingTrackId,
  playnextrecommend,
  removefromrecommend,
  resolveRecommendTrack,
  multiRecommendSelect,
  setMultiRecommendSelect,
  trackforplaylist,
  setTrackForPlaylist,
  setPlaylistModalVisible,
  recommendpositionsrc,
  handlerecommendchange
}) {

  const resolveAndSinglePress = async () => {
    const track = await resolveRecommendTrack(item);
    if (!multiRecommendSelect) {
      setTrackForPlaylist([track]);
      setPlaylistModalVisible(true);
    } else {
      const isIn = trackforplaylist.some(t => t.name?.toLowerCase() === track.name?.toLowerCase());
      if (isIn) {
        setTrackForPlaylist(prev => prev.filter(t => t.name?.toLowerCase() !== track.name?.toLowerCase()));
      } else {
        setTrackForPlaylist(prev => [...prev, track]);
      }
    }
  };

  const resolveAndToggleMultiSelect = async () => {
    const track = await resolveRecommendTrack(item);
    if (!multiRecommendSelect) {
      setMultiRecommendSelect(true);
      setTrackForPlaylist([track]);
    } else {
      setMultiRecommendSelect(false);
      setTrackForPlaylist([]);
    }
  };

  const togglemultiplaylistselectlongPress = Gesture.LongPress().onStart(async () => {
    await resolveAndToggleMultiSelect();
  });

  const showplaylistoptionsdoubleTap = Gesture.Tap().numberOfTaps(2).onEnd(() => {
    setPlaylistModalVisible(true);
  });

  const toggleaddplaylistselectsinglePress = Gesture.Tap().onEnd(async () => {
    await resolveAndSinglePress();
  });

  const isLoading = loadingItemId === item.title;

  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 8, width: "100%" }}>
      <TouchableOpacity 
        style={{ flexDirection: "row", flex: 1, marginRight: 10 }} 
        onLongPress={() => { removefromrecommend(item) }} 
        onPress={() => { playnextrecommend(item) }} 
      >
        <View style={{ position: "relative", width: 60, height: 60 }}>
          <Image style={{ borderRadius: 5, width: 60, height: 60, opacity: isLoading ? 0.6 : 1 }} source={{ uri: item.thumbnail[0].url }} />
          {isLoading && (
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 5 }}>
              <ActivityIndicator size="small" color="white" />
            </View>
          )}
        </View>

        <View style={{ marginLeft: 10, justifyContent: "center", flex: 1 }}>
          <Text numberOfLines={1} style={{ color: "white", fontSize: 14, fontWeight: "500" }}>{item.title}</Text>
          <Text numberOfLines={1} style={{ color: "grey", fontSize: 12, marginTop: 2 }}>{item.artists[0].name}</Text>
        </View>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
        <GestureDetector gesture={Gesture.Exclusive(showplaylistoptionsdoubleTap, togglemultiplaylistselectlongPress, toggleaddplaylistselectsinglePress)}>
          <View style={{ padding: 10 }}>
            <MaterialIcons
              name="playlist-add"
              size={24}
              color={multiRecommendSelect && trackforplaylist.some(t => t.name?.toLowerCase() === item.title?.toLowerCase()) ? "#7097d6" : "white"}
            />
          </View>
        </GestureDetector>

        {recommendpositionsrc === "" || recommendpositionsrc === index ? (
          <TouchableOpacity onPress={() => { handlerecommendchange(index) }} style={{ paddingHorizontal: 10, paddingVertical: 10 }}>
            <Entypo size={19} name="dots-three-vertical" color={recommendpositionsrc === index ? "green" : "white"} />
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: "column", alignItems: "center", width: 49 }}>
            <TouchableOpacity 
              onPress={() => handlerecommendchange(index, 'above')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                borderWidth: 1,
                borderColor: "white",
                borderRadius: 12,
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 4
              }}
            >
              <MaterialIcons name="arrow-upward" size={14} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handlerecommendchange(index, 'below')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                borderWidth: 1,
                borderColor: "white",
                borderRadius: 12,
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <MaterialIcons name="arrow-downward" size={14} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function QueueModal({ queue, toggleModal, isModalVisible, setModalVisible, setQueue }) {//console.log("queue in QueueModal",queue)

  const [queuepositionsrc, setQueuePositionSrc] = useState("");
  const [recommendpositionsrc, setRecommendPositionSrc] = useState("");
  const [current_recommendations, setCurrentRecommendations] = useState([]);
  const [recommendationmode, setRecommendationMode] = useState(false);
  const [shufflefetching, setShuffleFetching] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);
  const showAlert = (title, message, buttons = [{ text: "OK" }]) => {
    setCustomAlert({ title, message, buttons });
  };
  // Local loading ID: set when the user taps a row in this modal.
  // null = nothing loading locally.
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [globalLoadingTrackId, setGlobalLoadingTrackId] = useState(null);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [trackforplaylist, setTrackForPlaylist] = useState([]);
  const [multiRecommendSelect, setMultiRecommendSelect] = useState(false);

  // Convert a YouTube recommendation object into a track shape for PlaylistModal
  const resolveRecommendTrack = async (item) => {
    const stored = await AsyncStorage.getItem("current-tracks");
    const currentTracks = stored ? JSON.parse(stored) : [];
    const matched = currentTracks.find(t => t.name?.toLowerCase() === item.title?.toLowerCase());
    return matched ?? {
      name: item.title,
      artist: item.artists[0].name,
      thumbnail: item.thumbnail[0].url,
      id: item.videoId ?? item.title,
      album_name: item.album?.name ?? item.title,
      album_id: "",
      artist_id: "",
      track_number: 0,
      duration_ms: 0,
    };
  };

  useEffect(() => {
    const unsubscribe = subscribeToLoadingTrack((trackId) => {
      setGlobalLoadingTrackId(trackId);
    });
    return unsubscribe;
  }, []); // subscribe once on mount, clean up on unmount

  const [sections, setSections] = useState([
    { title: "Queue", data: queue },
    { title: "Shuffling From:", data: current_recommendations }
  ]);

  const playnextqueue = async (nextsong) => {
    if (getLoadingTrackId() !== null || loadingItemId !== null) {
      console.log("Queue play ignored: a song is already loading.");
      return;
    }
    setLoadingItemId(nextsong.name);
    try {
      const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
      console.log("current_traCKSSS", stored_album_tracks)
      const album_tracks = JSON.parse(stored_album_tracks)
      let num_of_tracks = album_tracks.length
      let currentTrackInd = await TrackPlayer.getActiveTrackIndex()
      let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
      let player_ind = (currentTrack.index + 1) >= num_of_tracks ? 0 : currentTrack.index + 1

      await skipToTrack(nextsong, player_ind)

      let frontend_queue = queue.filter(obj => nextsong.name !== obj.name);
      if (frontend_queue.length !== 0) {
        await AsyncStorage.setItem("queue", JSON.stringify(frontend_queue))
        setQueue(frontend_queue)
      }
      else {
        await AsyncStorage.removeItem("queue")
        setQueue([])
      }
    } finally {
      setLoadingItemId(null);
    }
  }

  const playnextrecommend = async (nextsongyt) => {
    if (getLoadingTrackId() !== null || loadingItemId !== null) {
      console.log("Recommend play ignored: a song is already loading.");
      return;
    }
    setLoadingItemId(nextsongyt.title);
    try {
      const song_name = nextsongyt.title
      const artist_name = nextsongyt.artists[0].name

      const nextsong_recommend = await getspecificsongrecommendation(song_name, artist_name)
      console.log("nextsong_recommend", nextsong_recommend)
      const is_restricted = await is_track_restricted(nextsong_recommend);
      if (is_restricted) {
        console.log("Recommended song is restricted, skipping without accessing:", nextsong_recommend.name);
        await removefromrecommend(nextsongyt);
        return;
      }
      const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${nextsong_recommend.artist}-${nextsong_recommend.album_name}-${nextsong_recommend.name}`)
      if (!track_downloaded) {
        await prefetchsong(nextsong_recommend)
      }
      await TrackPlayer.reset();
      let next_track_ind = 0
      let nextsong = nextsong_recommend

      await skipToTrack(nextsong, next_track_ind)

      await removefromrecommend(nextsongyt)
      await repopulaterecommendations()
    } finally {
      setLoadingItemId(null);
    }
  }

  const removefromqueue = async (song) => {
    let frontend_queue = queue.filter(obj => song.name !== obj.name);
    if (frontend_queue.length !== 0) {
      await AsyncStorage.setItem("queue", JSON.stringify(frontend_queue))
      setQueue(frontend_queue)
    }
    else {
      await AsyncStorage.removeItem("queue")
      setQueue([])
    }
  }

  const moveElement = (arr, fromIndex, toIndex, position) => {
    const newArr = [...arr];
    const [itemToMove] = newArr.splice(fromIndex, 1);
    
    let destIndex = toIndex;
    if (fromIndex < toIndex) {
      destIndex = position === 'below' ? toIndex : toIndex - 1;
    } else {
      destIndex = position === 'below' ? toIndex + 1 : toIndex;
    }
    
    newArr.splice(destIndex, 0, itemToMove);
    return newArr;
  };

  const handlequeuechange = async (index, position) => {
    if (queuepositionsrc === "") {
      setQueuePositionSrc(index);
    }
    else if (queuepositionsrc === index) {
      setQueuePositionSrc("");
    }
    else {
      console.log("src", queuepositionsrc, "dest:", index, "pos:", position)
      const reordered_queue = moveElement(queue, queuepositionsrc, index, position);
      await AsyncStorage.setItem("queue", JSON.stringify(reordered_queue))
      setQueue(reordered_queue);
      setQueuePositionSrc("");
    }
  }

  const handlerecommendchange = async (index, position) => {
    const recommend_songs = await get_recommended_songs();
    if (recommend_songs) {
      if (recommendpositionsrc === "") {
        setRecommendPositionSrc(index);
      }
      else if (recommendpositionsrc === index) {
        setRecommendPositionSrc("");
      }
      else {
        console.log("src", recommendpositionsrc, "dest:", index, "pos:", position)
        const reordered_recommend = moveElement(JSON.parse(recommend_songs), recommendpositionsrc, index, position);
        await AsyncStorage.setItem("current-recommendations", JSON.stringify(reordered_recommend))
        setCurrentRecommendations(reordered_recommend);
        setRecommendPositionSrc("");
      }
    }
  }

  const recommendshufflemode = async () => {
    setShuffleFetching(true)
    const current_track = await TrackPlayer.getActiveTrack();
    const recommendations = await getrecommendations(current_track)
    if (recommendations) {
      await AsyncStorage.setItem("current-recommendations", JSON.stringify(recommendations))
      console.log("recommendationsheher", recommendations)
      setCurrentRecommendations(recommendations)
      setSections(prev =>
        prev.map(section =>
          section.title === "Shuffling From:"
            ? { ...section, data: recommendations } // update only this section
            : section
        )
      );
      setRecommendationMode(true)
      await AsyncStorage.setItem("recommendation-mode", "true")
      setShuffleFetching(false)
    }
  }

  const removefromrecommend = async (song) => {
    let frontend_recommendations = current_recommendations.filter(obj => song.title !== obj.title);
    if (frontend_recommendations.length !== 0) {
      await AsyncStorage.setItem("current-recommendations", JSON.stringify(frontend_recommendations))
      setCurrentRecommendations(frontend_recommendations)
    }
    else {
      await AsyncStorage.removeItem("current-recommendations")
      setCurrentRecommendations([])
    }
  }

  const getcurrentrecommendations = async () => {
    const recommendationmode_storage = await AsyncStorage.getItem("recommendation-mode")
    if (recommendationmode_storage === "true") {
      setRecommendationMode(true)
      const stored_recommendations = await AsyncStorage.getItem("current-recommendations")
      if (stored_recommendations) {
        const recommendations = JSON.parse(stored_recommendations)

        setCurrentRecommendations(recommendations)
        setSections(prev =>
          prev.map(section =>
            section.title === "Shuffling From:"
              ? { ...section, data: recommendations } // update only this section
              : section
          )
        );
      }
    }
  }

  const getrecommendationmode = async () => {
    const recommendationmode_storage = await AsyncStorage.getItem("recommendation-mode")
    if (recommendationmode_storage === "true") {
      setRecommendationMode(true)
    }
    else {
      setRecommendationMode(false)
    }
  }

  const stoprecommendshufflemode = async () => {
    setRecommendationMode(false)
    setShuffleFetching(false)
    await AsyncStorage.removeItem("recommendation-mode")
    await AsyncStorage.removeItem("current-recommendations")
    setCurrentRecommendations([])
    setSections(prev =>
      prev.map(section =>
        section.title === "Shuffling From:"
          ? { ...section, data: [] } // update only this section
          : section
      )
    );
  }

  useEffect(() => {
    setSections(prev =>
      prev.map(section =>
        section.title === "Queue"
          ? { ...section, data: queue } // update only this section
          : section
      )
    );
    getcurrentrecommendations()
    getrecommendationmode()
  }, [queue, current_recommendations, recommendationmode])

  return (
    <View style={styles.flexView}>
      <StatusBar />

      <Modal
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}
        isVisible={isModalVisible}
        swipeDirection="down"
        onSwipeComplete={toggleModal}
        animationIn="bounceInUp"
        animationOut="bounceOutDown"
        animationInTiming={900}
        animationOutTiming={500}
        backdropTransitionInTiming={1000}
        backdropTransitionOutTiming={500}
        style={styles.modal}
          coverScreen={true}
      >
        <GestureHandlerRootView style={{ flex: 1, justifyContent: "flex-end" }}>
          <View style={styles.modalContent}>
            <View style={styles.center}>
              <View style={[styles.barIcon, { alignSelf: "center" }]} />
              <View style={{ marginTop: 10, alignSelf: "flex-end" }}>
                <TouchableOpacity onLongPress={() => { stoprecommendshufflemode() }} onPress={() => { if (shufflefetching === false) { recommendshufflemode() } }} >
                  <MaterialIcons name="shuffle-on" size={25} color={recommendationmode === true ? shufflefetching ? "blue" : "green" : shufflefetching ? "blue" : "white"} />
                </TouchableOpacity>
              </View>

              <SectionList
                sections={sections}
                keyExtractor={(item, index) => item + index}
                renderItem={({ item, index, section: { title } }) => {
                  if (title === "Queue") {
                    const isLoading = loadingItemId === item.name || globalLoadingTrackId === item.id;
                    return (
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 8, width: "100%" }}>
                        <TouchableOpacity style={{ flexDirection: "row", flex: 1, marginRight: 10 }} onLongPress={() => { removefromqueue(item) }} onPress={() => { playnextqueue(item) }} >
                          <View style={{ position: "relative", width: 60, height: 60 }}>
                            <Image style={{ borderRadius: 5, width: 60, height: 60, opacity: isLoading ? 0.6 : 1 }} source={{ uri: item.thumbnail }}></Image>
                            {isLoading && (
                              <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 5 }}>
                                <ActivityIndicator size="small" color="white" />
                              </View>
                            )}
                          </View>

                          <View style={{ marginLeft: 10, justifyContent: "center", flex: 1 }}>
                            <Text numberOfLines={1} style={{ color: "white", fontSize: 14, fontWeight: "500" }}>{item.name}</Text>
                            <Text numberOfLines={1} style={{ color: "grey", fontSize: 12, marginTop: 2 }}>{item.artist}</Text>
                          </View>
                        </TouchableOpacity>

                        {queuepositionsrc === "" || queuepositionsrc === index ? (
                          <TouchableOpacity onPress={() => { handlequeuechange(index) }} style={{ paddingHorizontal: 10, paddingVertical: 10 }}>
                            <Entypo size={19} name="dots-three-vertical" color={queuepositionsrc === index ? "green" : "white"}></Entypo>
                          </TouchableOpacity>
                        ) : (
                          <View style={{ flexDirection: "column", alignItems: "center", width: 49 }}>
                            <TouchableOpacity 
                              onPress={() => handlequeuechange(index, 'above')}
                              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                              style={{
                                borderWidth: 1,
                                borderColor: "white",
                                borderRadius: 12,
                                width: 24,
                                height: 24,
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: 4
                              }}
                            >
                              <MaterialIcons name="arrow-upward" size={14} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handlequeuechange(index, 'below')}
                              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                              style={{
                                borderWidth: 1,
                                borderColor: "white",
                                borderRadius: 12,
                                width: 24,
                                height: 24,
                                justifyContent: "center",
                                alignItems: "center"
                              }}
                            >
                              <MaterialIcons name="arrow-downward" size={14} color="white" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )
                  }
                  else if (title === "Shuffling From:") {
                    return (
                      <RecommendTrackItem
                        item={item}
                        index={index}
                        loadingItemId={loadingItemId}
                        globalLoadingTrackId={globalLoadingTrackId}
                        playnextrecommend={playnextrecommend}
                        removefromrecommend={removefromrecommend}
                        resolveRecommendTrack={resolveRecommendTrack}
                        multiRecommendSelect={multiRecommendSelect}
                        setMultiRecommendSelect={setMultiRecommendSelect}
                        trackforplaylist={trackforplaylist}
                        setTrackForPlaylist={setTrackForPlaylist}
                        setPlaylistModalVisible={setPlaylistModalVisible}
                        recommendpositionsrc={recommendpositionsrc}
                        handlerecommendchange={handlerecommendchange}
                      />
                    )
                  }
                }}
                renderSectionHeader={({ section: { title } }) => {
                  if (title === "Shuffling From:") {
                    return (
                      <View style={{ marginTop: 20, width: 200, flexDirection: "column" }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Entypo name="shuffle" size={15} color="white" />
                          <Text style={{ marginLeft: 5, fontSize: 14, color: "white" }}>
                            Shuffling from:
                          </Text>
                        </View>
                        {shufflefetching && (
                          <View style={{ marginTop: 15, alignItems: "center", width: 355 }}>
                            <ActivityIndicator size="small" color="#1db954" />
                            <Text style={{ color: "grey", fontSize: 11, marginTop: 5 }}>Loading recommendations...</Text>
                          </View>
                        )}
                      </View>
                    )
                  }
                }}
              />
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>

      <PlaylistModal
        isModalVisible={playlistModalVisible}
        setIsModalVisible={setPlaylistModalVisible}
        trackforplaylist={trackforplaylist}
      />

      {customAlert && (
        <RNModal
          transparent={true}
          visible={true}
          animationType="fade"
          onRequestClose={() => setCustomAlert(null)}
        >
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <View style={{
              width: "85%",
              backgroundColor: "#1a1818",
              borderRadius: 15,
              borderWidth: 1,
              borderColor: "#333",
              padding: 20,
              alignItems: "center"
            }}>
              <Text style={{
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 12
              }}>{customAlert.title}</Text>
              
              <Text style={{
                color: "grey",
                fontSize: 14,
                textAlign: "center",
                marginBottom: 20,
                lineHeight: 20
              }}>{customAlert.message}</Text>
              
              <View style={{ width: "100%" }}>
                {customAlert.buttons.map((btn, idx) => {
                  const isCancel = btn.style === "cancel" || btn.text.toLowerCase() === "cancel";
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setCustomAlert(null);
                        if (btn.onPress) btn.onPress();
                      }}
                      style={{
                        backgroundColor: isCancel ? "transparent" : "#1db954",
                        borderWidth: isCancel ? 1 : 0,
                        borderColor: isCancel ? "#555" : "transparent",
                        borderRadius: 25,
                        paddingVertical: 12,
                        width: "100%",
                        alignItems: "center",
                        marginVertical: 6
                      }}
                    >
                      <Text style={{
                        color: "white",
                        fontSize: 15,
                        fontWeight: "600"
                      }}>{btn.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </RNModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flexView: {
    flex: 1,
    backgroundColor: "white",
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#161616",
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    minHeight: 400,
    paddingBottom: 20,
  },
  center: {
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
    width: "100%",
  },
  barIcon: {
    width: 60,
    height: 5,
    backgroundColor: "#bbb",
    borderRadius: 3,
  },
  text: {
    color: "#bbb",
    fontSize: 22,
    marginTop: 20,
  },
  btnContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 500,
  },
});
