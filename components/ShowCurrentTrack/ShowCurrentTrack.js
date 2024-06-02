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
import { getstreaminglink } from '../Tracks/getstreamlinks';
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
      //console.log(currentTrack)
      setCurrentTrack(currentTrack)

    }
    const autoplaynextsong = async () =>{
      const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
      const album_tracks = JSON.parse(stored_album_tracks)
      console.log(album_tracks[0])
      let num_of_tracks = album_tracks.length
      //console.log(num_of_tracks)
      let currentTrackInd = await  TrackPlayer.getCurrentTrack()
      console.log("current",currentTrackInd)
      let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
      console.log(currentTrack.index)
      let next_track_ind = (currentTrack.index+ 1) > num_of_tracks ? 0 : currentTrack.index+ 1
      console.log("next",next_track_ind)

      let nextsong = album_tracks[next_track_ind]
     
      //await TrackPlayer.setRepeatMode(RepeatMode.Off);
      let streaming_link = await getstreaminglink(nextsong)
      await TrackPlayer.reset();
      await TrackPlayer.add([{index:next_track_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000}]);
      await TrackPlayer.add([{index:next_track_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id,url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000}]);
      await TrackPlayer.play();
  



  }
  const autoplayprevioussong = async () =>{
      const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
      const album_tracks = JSON.parse(stored_album_tracks)
      let currentTrackInd = await  TrackPlayer.getCurrentTrack()
      console.log("current",currentTrackInd)
      let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
      console.log(currentTrack.index)
      let next_track_ind = (currentTrack.index- 1) <  0 ? 0 : currentTrack.index-  1
      console.log("next",next_track_ind)

      let nextsong = album_tracks[next_track_ind]
     
      //await TrackPlayer.setRepeatMode(RepeatMode.Off);
      let streaming_link = await getstreaminglink(nextsong)
      await TrackPlayer.reset();
      await TrackPlayer.add([{index:next_track_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
      await TrackPlayer.add([{index:next_track_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id,url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
      await TrackPlayer.play();
  



  }
  const autonextsong = async () =>{
      if (progress.duration !== 0){
      //console.log(,index)
      if ((progress.duration - progress.position) < 1){
          await autoplaynextsong()

      }

      }
  }

  useTrackPlayerEvents([Event.RemoteNext],(event) => {
    console.log(tracks)
      if (!tracks){
        autoplaynextsong()
      }
    });
    useTrackPlayerEvents([Event.RemotePrevious],(event) => {
      console.log(!tracks)
      if (!tracks){
        autoplayprevioussong()
      }
    });
  
  useEffect(() =>{
      if (!tracks){
        autonextsong()
      }

  },[progress])
    useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
      await getCurrentTrack();
      });

      useEffect(()=>{
        
        getCurrentTrack();
    

      },[])
      const getalbumtracks = async () =>{
        const access_token = await get_access_token()
        const headers = {Authorization: `Bearer ${access_token}`}
        //console.log(currentTrack)
        const resp = await fetch(`https://api.spotify.com/v1/albums/${currentTrack.album_id}`, {headers: headers})
        const feedresult = await resp.json()
    
        let album_tracks = feedresult.tracks.items.map((track) =>{return({"album_id":feedresult.id,"album_name":currentTrack.album_name,"name":track.name,"id":track.id,"artist":track.artists[0].name,"artist_id":track.artists[0].id,"thumbnail":currentTrack.thumbnail,"track_number":track.track_number,"duration_ms":track.duration_ms})})
        navigate("/tracks", { state: album_tracks });

      }

     
      if ( currentTrack !== null){
        return(
          <TouchableOpacity onPress={() =>{getalbumtracks()}} style={{flexDirection:"row",backgroundColor:"#141212",margin:!searchscreen ? 5: 0,marginLeft:30}} >
            {currentTrack.length !== 0 &&
            <View style={{flex:0.15}}>
            <Image style={{width: 40, height: 40}} source={{uri:typeof(currentTrack.artwork) === "string" ? currentTrack.artwork :currentTrack.artwork.uri}}></Image>
            
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