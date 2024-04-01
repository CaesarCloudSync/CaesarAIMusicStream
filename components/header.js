import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image

} from 'react-native';
import TrackPlayer, {
  useTrackPlayerEvents,
  Event,
  State
} from 'react-native-track-player';
export default function Header(props) {
  const [info, setInfo] = useState({});
  async function setTrackInfo(){
    const track = await TrackPlayer.getCurrentTrack();
    const info = await TrackPlayer.getTrack(track);
    //console.log(info)
    setInfo(info);
  }
    useEffect(() => {
      setTrackInfo()
    },[])
  
    useTrackPlayerEvents([Event.PlaybackTrackChanged], (event) => {
      if(event.state == State.nextTrack) {
        setTrackInfo();
      }
    });
  

    const imagedim = 110
    //console.log(info)
    return(
      <View style={{justifyContent:"center",alignItems:"center"}}>
          <Image style={{position:"relative",top:30,width: 120,height:imagedim}} source={require("../assets/CaesarAILogo.png")}></Image>
          {info !== null &&
          <View>
          <Text style={styles.songTitle}>{info.title}</Text>
          <Text style={styles.artistName}>{info.artist}</Text>
          </View>
          }
      </View>
    );
  }
  
const styles = StyleSheet.create({
    artistName: {
        fontSize: 24,
        color: '#888'
      },
      songTitle: {
        fontSize: 20,
        marginTop: 50,
        color: '#ccc'
      }
})