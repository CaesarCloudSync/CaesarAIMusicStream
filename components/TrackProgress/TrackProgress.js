import React from 'react';
import {
  StyleSheet,
  Text,
  View,

} from 'react-native';
import {
  useProgress
} from 'react-native-track-player';
import TrackPlayer from 'react-native-track-player';
import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { sendmusicconnect } from '../mqttclient/mqttclient';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function TrackProgress({seek,setSeek,style}) {
  const [isSeeking, setIsSeeking] = useState(false);
  
    const { position, duration } = useProgress(200);
  
    function format(seconds) {
      let mins = (parseInt(seconds / 60)).toString().padStart(2, '0');
      let secs = (Math.trunc(seconds) % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    }
    const seekToPosition = async (value) =>{
      //console.log("seek_value",value.toString())
      let music_connected =  await AsyncStorage.getItem("music_connected")
      if (music_connected){
        await AsyncStorage.setItem("current_payloadkey","music_connect_seek")
        await AsyncStorage.setItem("current_topic","caesaraimusicstreamconnect/seek")
        await AsyncStorage.setItem("music_connect_seek",value.toString());
        await AsyncStorage.setItem("current_subscribe_topic","caesaraimusicstreamconnect/sub-seek")
        await sendmusicconnect()
        await AsyncStorage.removeItem("current_payloadkey")
        await AsyncStorage.removeItem("current_topic")
        await AsyncStorage.removeItem("music_connect_seek");
        await AsyncStorage.removeItem("current_subscribe_topic")
      }

      await TrackPlayer.seekTo(value);
      await TrackPlayer.play();

    }
  
    return(
      <View style={[{alignItems:"center",justifyContent:"center",flexDirection:"row",backgroundColor:"#141212"},style]}>

        <Slider
      style={{width: '80%', justifyContent: 'center'}}
      minimumValue={0}
      maximumValue={duration}
      minimumTrackTintColor="#FFFFFF"
      maximumTrackTintColor="#FFFFFF"
      value={isSeeking ? seek : position}
      onValueChange={(value) => {
        //TrackPlayer.pause();
        setIsSeeking(true);
        setSeek(value);
      }}
      onSlidingComplete={(value) => {
        seekToPosition(value)
      }}
    />
        <Text style={styles.trackProgress}>
          { format(position) } / { format(duration) }
        </Text>
      </View>
    );
  }

const styles = StyleSheet.create({
    trackProgress: {
        marginTop: 0,
        textAlign: 'center',
        fontSize:10,
        color: '#eee'
      }
})