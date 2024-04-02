import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import TrackPlayer from 'react-native-track-player';
import { setupPlayer, addTracks } from './trackPlayerServices';
import Header from './components/header';
import Playlist from './components/playlist';
import TrackProgress from './components/trackprogress';
import CaesarSongSearch from './components/caesarsongsearch';
import axios from 'axios';
import AskPermission from './components/askpermission';
import { Text } from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { NativeRouter, Route, Link ,Routes} from "react-router-native";
import Home from './components/HomeScreen/HomeScreen';
import Search from './components/SearchScreen/SearchScreen';
import LibraryScreen from './components/LibraryScreen/LibraryScreen';
function App() { 


  const [seek, setSeek] = useState(0);
  const [songchanged,setSongsChanged] = useState(false);
  const [nextqueue,setNextQueue] = useState([]);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

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
  
  return (
    <NativeRouter>

    <Routes>
    <Route exact path="/" element={<Home />}></Route>
    <Route path="/search" element={<Search/>}></Route>
    <Route path="/library" element={<LibraryScreen/>}></Route>
  
    </Routes>
    {/*The NativeRouter*/}
  </NativeRouter>
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

export default App;
/*
      <CaesarSongSearch/>

      
          
      <Header nextqueue={nextqueue} />
      <TrackProgress seek={seek} setSeek={setSeek}/>
      
      <Playlist nextqueue={nextqueue} setNextQueue={setNextQueue}  seek={seek} setSeek={setSeek}/>
       */