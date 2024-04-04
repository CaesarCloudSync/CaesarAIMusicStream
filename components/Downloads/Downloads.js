import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import TrackPlayer from 'react-native-track-player';
import { setupPlayer,addTracks } from '../../trackPlayerServices';
import Header from './header';
import Playlist from './playlist';
import TrackProgress from '../TrackProgress/TrackProgress';
import CaesarSongSearch from './caesarsongsearch';
import axios from 'axios';
import AskPermission from './askpermission';
import NavigationFooter from '../NavigationFooter/NavigationFooter';
import Controls from "./Controls"
import Footer from './footer';
import ShowCurrentTrack from '../ShowCurrentTrack/ShowCurrentTrack';
import { useNetInfo } from '@react-native-community/netinfo';
export default function Downloads() { 
  const netInfo = useNetInfo();


  const [seek, setSeek] = useState(0);
  const [songchanged,setSongsChanged] = useState(false);
  const [nextqueue,setNextQueue] = useState([]);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  
  const [currentTrack, setCurrentTrack] = useState(0);

  useEffect(() => {
    async function setup() {
      let isSetup = await setupPlayer();
      
      const queue = await TrackPlayer.getQueue();
      if(isSetup && queue.length <= 0) {
        await addTracks(); 
        //const name = await extractTracks();
      }

      setIsPlayerReady(isSetup);
    }
  
    setup();
    //setTrackInfo()
    
  }, []);

  if(!isPlayerReady) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#bbb"/>
      </SafeAreaView>
    );
  }
  /*async function handleShuffle() {
    let queue = await TrackPlayer.getQueue();
    await TrackPlayer.reset();
    queue.sort(() => Math.random() - 0.5);
    await TrackPlayer.add(queue);

    loadPlaylist()
  }*/
  
  
  return (
    <SafeAreaView style={{flex:1,backgroundColor:"#141212"}}>
      {/*<AskPermission/>*/}
      <CaesarSongSearch/>

      
          
      <Header nextqueue={nextqueue} />

      <Playlist currentTrack={currentTrack} setCurrentTrack={setCurrentTrack} nextqueue={nextqueue} setNextQueue={setNextQueue}  seek={seek} setSeek={setSeek}/>
      {/*<Controls nextqueue={nextqueue} setSeek={setSeek} onShuffle={handleShuffle}/> */}
      {netInfo.isInternetReachable === true && <ShowCurrentTrack />}
      <TrackProgress style={{flex:0.1}} seek={seek} setSeek={setSeek}/>
     
      <Footer styles={{flex:0.1}} nextqueue={nextqueue} currentTrack={currentTrack} isPlayerReady={isPlayerReady} ></Footer>

      <NavigationFooter currentpage={"downloads"}/>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: '#112'
    },
  });