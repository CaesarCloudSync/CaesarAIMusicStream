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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import init from 'react_native_mqtt';
export default function ShowCurrentTrack({searchscreen,tracks}) {
  const [connectStatus,setConnectStatus] = useState(false);
      init({
        size: 10000,
        storageBackend: AsyncStorage,
        defaultExpires: 1000 * 3600 * 24,
        enableCache: true,
        sync : {}
      });
      const options = {
        host: 'broker.emqx.io',
        port: 8083,
        path: '/testTopic',
        id: 'emqx_react_' + Math.random().toString(16).substring(2, 8)
      };
      function onConnect() {
        console.log("onConnect");
        client.subscribe("testtopic",{ qos: 0 })
        setConnectStatus(true)
      }
      function onFailure() {
        console.log("onFailure");
        setConnectStatus(false)
      }

      function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
          console.log("onConnectionLost:"+responseObject.errorMessage);
        }
      }

      function onMessageArrived(message) {
        console.log("onMessageArrived:"+message.payloadString);
      }


    let client = new Paho.MQTT.Client(options.host, options.port, options.id);
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
 


    //console.log("hi")
    const progress = useProgress();
    const navigate = useNavigate()
    const [currentTrack,setCurrentTrack] = useState(null)
    const getCurrentTrack = async () =>{
      let queue = await TrackPlayer.getQueue();

      let isSetup = await setupPlayer();
      const currentTrackIndex = await TrackPlayer.getCurrentTrack()
      const currentTrack = await TrackPlayer.getTrack(currentTrackIndex)
      //console.log(currentTrack,"crrentTrack")

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
        console.log("currwent",currentTrack)
        if ("playlist_name" in currentTrack && "playlist_local" in currentTrack){

          let keys = await AsyncStorage.getAllKeys()
          const playlist_details = JSON.parse(await AsyncStorage.getItem(`playlist:${currentTrack.playlist_name}`))
          const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`playlist-track:${currentTrack.playlist_name}`))}))
          const playlist_tracks = items.map((item) =>{return(JSON.parse(item[1]))})
          console.log("current",playlist_tracks,playlist_details)
          navigate("/playlist-tracks", { state: {playlist_details:playlist_details,playlist_tracks:playlist_tracks}});
        }
        else if (!("playlist_name" in currentTrack)){
          const stored_album_tracks = JSON.parse(await AsyncStorage.getItem("current-tracks"))
          let album_tracks = stored_album_tracks.map((track) =>{return({"album_id":stored_album_tracks[0].album_id,"album_name":currentTrack.album_name,"name":track.name,"id":track.id,"artist":track.artist,"artist_id":track.artist_id,"thumbnail":currentTrack.thumbnail,"track_number":track.track_number,"duration_ms":track.duration_ms})})
          navigate("/tracks", { state: {"album_tracks":album_tracks} });

        }
        else{
          const access_token = await get_access_token()
          const headers = {Authorization: `Bearer ${access_token}`}
          const resp = await fetch(`https://api.spotify.com/v1/playlists/${currentTrack.playlist_id}`, {headers: headers})
          const feedresult = await resp.json()
          //console.log(feedresult.tracks.items[0])
          let album_tracks = feedresult.tracks.items.map((trackitem) =>{let track = trackitem.track;return({"playlist_thumbnail":currentTrack.playlist_thumbnail,"playlist_id":feedresult.id,"playlist_name":currentTrack.playlist_name,"album_id":track.album.id,"album_name":track.album.name,"name":track.name,"id":track.id,"artist":track.artists[0].name,"artist_id":track.artists[0].id,"thumbnail":track.album.images[0].url,"track_number":track.track_number,"duration_ms":track.duration_ms})})
          navigate("/tracks", { state: {"album_tracks":album_tracks}});

        }

      }

     const mqttConnect = () =>{

      client.connect({ onSuccess:onConnect, useSSL:false, onFailure: onFailure});
      //client.subscribe("testtopic",{ qos: 0 })
     }
     const mqttDisconnect  = () =>{
      if (client.isConnected()) {
        try {
          client.disconnect()
          client.unsubscribe("testtopic")
        } catch (error) {
          console.log('disconnect error:', error)
        }
      }
    
      


      setConnectStatus(false)
     }
      if ( currentTrack !== null){
        return(
          <TouchableOpacity onPress={() =>{getalbumtracks()}} style={{flexDirection:"row",backgroundColor:"#141212",margin:!searchscreen ? 5: 0,marginLeft:30}} >
            {currentTrack.length !== 0 &&
            <View style={{flex:0.15}}>
            <Image style={{borderRadius:5,width: 40, height: 40}} source={{uri:typeof(currentTrack.artwork) === "string" ? currentTrack.artwork :currentTrack.artwork.uri}}></Image>
            
            </View>}
            <View style={{flex:1}}>
            <Text >{currentTrack.title}</Text>
            <Text>{currentTrack.artist}</Text>
            </View>
            <TouchableOpacity onPress={() =>{ if (connectStatus === false){mqttConnect()}else{mqttDisconnect()}  }} style={{justifyContent:"center",alignItems:"flex-start"}}>
            <MaterialIcons size={20} color={connectStatus === false ? "white" : "green"} name='devices'></MaterialIcons>
            </TouchableOpacity>
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