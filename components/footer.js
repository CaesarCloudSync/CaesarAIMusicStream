import { View,Text } from "react-native";
import { useEffect } from "react";
import * as MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomModal from "./bottomModal";
import React, { useState } from "react";
import TrackPlayer, {
  useTrackPlayerEvents,
  usePlaybackState,
  Event,
  State
} from 'react-native-track-player';
export default function Footer({ nextqueue,currentTrack,isPlayerReady }){
    const [isModalVisible, setModalVisible] = useState(false);
    const toggleModal = () => {
        setModalVisible(!isModalVisible);
      };

    return (
    <View style={{justifyContent:"flex-end",alignItems:"flex-end"}}>
  
        <MIcon.Button 
                style={{marginRight:0}}
                name={"menu-open"}
                size={25}
                backgroundColor="transparent"
                title="Show Bottom Sheet" 
                onPress={toggleModal}
            ></MIcon.Button>
            <BottomModal nextqueue={nextqueue} currentTrack={currentTrack} isPlayerReady={isPlayerReady}  isModalVisible={isModalVisible} toggleModal={toggleModal} setModalVisible={setModalVisible} ></BottomModal>
    </View>)
}