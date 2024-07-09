import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  View
} from 'react-native';
import TrackPlayer from 'react-native-track-player';
import { setupPlayer, addTracks } from './trackPlayerServices';

import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { NativeRouter, Route, Link ,Routes} from "react-router-native";
import Home from './components/HomeScreen/HomeScreen';
import Search from './components/SearchScreen/SearchScreen';
import LibraryScreen from './components/LibraryScreen/LibraryScreen';
import Tracks from './components/Tracks/Tracks';
import { useCallback } from 'react';
import { connectToDatabase,createTables } from "../SQLDB/SQLDB";
import ArtistProfile from './components/ArtistProfile/ArtistProfile';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PlaylistScreen from './components/PlaylistsScreen/PlaylistScreen';
import PlaylistTracks from './components/PlaylistsScreen/PlaylistTracks';
import DownloadedPlaylistTracks from './components/Downloads/DownloadePlaylistTracks';
function App() { 

 
  const [currentTrack,setCurrentTrack] = useState("")
  
  const [seek, setSeek] = useState(0);
  const [songchanged,setSongsChanged] = useState(false); 
  const [isPlayerReady,setIsPlayerReady] = useState(false);

// Database
  /*const loadData = useCallback(async () => {
    try {
      const db = await connectToDatabase()
      await createTables(db)
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
*/

useEffect(() => {
  async function setup() {
    let isSetup = await setupPlayer();

    setIsPlayerReady(isSetup);
  }
  
  setup();
  //setTrackInfo()
  
}, []);
/*
  if(!isPlayerReady) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#bbb"/>
      </SafeAreaView>
    );
  }*/
  
  return (
    <GestureHandlerRootView>
    <NativeRouter>
      

    <Routes>
    <Route exact path="/" element={<Home seek={seek} setSeek={setSeek}/>}></Route>
    <Route path="/search" element={<Search seek={seek} setSeek={setSeek}/>}></Route>
    <Route path="/library" element={<LibraryScreen/>}></Route>
    <Route path="/tracks" element={<Tracks seek={seek} setSeek={setSeek} currentTrack={currentTrack} setCurrentTrack={setCurrentTrack}/>}></Route>
    <Route  path="/playlists" element={<PlaylistScreen seek={seek} setSeek={setSeek} />}></Route>
    <Route path="/playlist-tracks" element={<PlaylistTracks seek={seek} setSeek={setSeek} currentTrack={currentTrack} setCurrentTrack={setCurrentTrack}/>}></Route>
    <Route path="/downloaded-playlist-tracks" element={<DownloadedPlaylistTracks seek={seek} setSeek={setSeek} currentTrack={currentTrack} setCurrentTrack={setCurrentTrack}/>}></Route>
    <Route  path="/artistprofile" element={<ArtistProfile seek={seek} setSeek={setSeek} />}></Route>
  
    </Routes>
    {/*The NativeRouter*/}
  </NativeRouter>
  </GestureHandlerRootView>
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