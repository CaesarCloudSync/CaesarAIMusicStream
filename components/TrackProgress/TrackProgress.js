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
export default function TrackProgress({seek,setSeek}) {
  const [isSeeking, setIsSeeking] = useState(false);
  
    const { position, duration } = useProgress(200);
  
    function format(seconds) {
      let mins = (parseInt(seconds / 60)).toString().padStart(2, '0');
      let secs = (Math.trunc(seconds) % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    }
  
    return(
      <View style={{alignItems:"center",justifyContent:"center",flexDirection:"row"}}>

        <Slider
      style={{width: '80%', justifyContent: 'center'}}
      minimumValue={0}
      maximumValue={duration}
      minimumTrackTintColor="#FFFFFF"
      maximumTrackTintColor="#000000"
      value={isSeeking ? seek : position}
      onValueChange={(value) => {
        //TrackPlayer.pause();
        setIsSeeking(true);
        setSeek(value);
      }}
      onSlidingComplete={(value) => {
        TrackPlayer.seekTo(value);
        TrackPlayer.play();
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