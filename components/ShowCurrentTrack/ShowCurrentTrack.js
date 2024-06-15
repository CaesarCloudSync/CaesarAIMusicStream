import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity

} from 'react-native';
import {
  useProgress
} from 'react-native-track-player';
import TrackPlayer,{useTrackPlayerEvents,Event} from 'react-native-track-player';
import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { get_access_token } from '../access_token/getaccesstoken';
import { useNavigate } from 'react-router-native';
import { setupPlayer } from '../../trackPlayerServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { autoplaynextsong,autoplayprevioussong } from '../controls/controls';

export default function ShowCurrentTrack({searchscreen,tracks}) {

    //console.log("hi")
    const progress = useProgress();
    const navigate = useNavigate()
    const [currentTrack,setCurrentTrack] = useState(null)
    const getCurrentTrack = async () =>{
      let queue = await TrackPlayer.getQueue();

      let isSetup = await setupPlayer();
      const currentTrackIndex = await TrackPlayer.getCurrentTrack()
      const currentTrack = await TrackPlayer.getTrack(currentTrackIndex)
      console.log(currentTrack,"crrentTrack")

      setCurrentTrack(currentTrack)

    }

  const autonextsong = async () =>{
      if (progress.duration !== 0){
      //console.log(,index)
      if ((progress.duration - progress.position) < 1){
          await autoplaynextsong()

      }

      }
  }


    useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
      await getCurrentTrack();
      });

      useEffect(()=>{
        
        getCurrentTrack();
    

      },[])
      const getalbumtracks = async () =>{
        if ("playlist_name" in currentTrack){
          const access_token = await get_access_token()
          const headers = {Authorization: `Bearer ${access_token}`}
          const resp = await fetch(`https://api.spotify.com/v1/playlists/${currentTrack.playlist_id}`, {headers: headers})
          const feedresult = await resp.json()
          //console.log(feedresult.tracks.items[0])
          let album_tracks = feedresult.tracks.items.map((trackitem) =>{let track = trackitem.track;return({"playlist_thumbnail":currentTrack.playlist_thumbnail,"playlist_id":feedresult.id,"playlist_name":currentTrack.playlist_name,"album_id":track.album.id,"album_name":track.album.name,"name":track.name,"id":track.id,"artist":track.artists[0].name,"artist_id":track.artists[0].id,"thumbnail":track.album.images[0].url,"track_number":track.track_number,"duration_ms":track.duration_ms})})
          navigate("/tracks", { state: album_tracks });

        }
        else{
        const access_token = await get_access_token()
        const headers = {Authorization: `Bearer ${access_token}`}
        //console.log(currentTrack)
        const resp = await fetch(`https://api.spotify.com/v1/albums/${currentTrack.album_id}`, {headers: headers})
        const feedresult = await resp.json()
    
        let album_tracks = feedresult.tracks.items.map((track) =>{return({"album_id":feedresult.id,"album_name":currentTrack.album_name,"name":track.name,"id":track.id,"artist":track.artists[0].name,"artist_id":track.artists[0].id,"thumbnail":currentTrack.thumbnail,"track_number":track.track_number,"duration_ms":track.duration_ms})})
        navigate("/tracks", { state: album_tracks });
      }

      }

     
      if ( currentTrack !== null){
        return(
          <TouchableOpacity onPress={() =>{getalbumtracks()}} style={{flexDirection:"row",backgroundColor:"#141212",margin:!searchscreen ? 5: 0,marginLeft:30}} >
            {currentTrack.length !== 0 &&
            <View style={{flex:0.15}}>
            <Image style={{borderRadius:5,width: 40, height: 40}} source={{uri:typeof(currentTrack.artwork) === "string" ? currentTrack.artwork :currentTrack.artwork.uri}}></Image>
            
            </View>}
            <View style={{marginLeft:20}}>
            <Text >{currentTrack.title}</Text>
            <Text>{currentTrack.artist}</Text>
            </View>
          </TouchableOpacity>
        );
      }
  }

const styles = StyleSheet.create({
    trackProgress: {
        marginTop: 0,
        textAlign: 'center',
        fontSize:10,
        color: '#eee'
      }
})