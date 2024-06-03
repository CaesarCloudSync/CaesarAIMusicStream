import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  Event,
} from 'react-native-track-player';
//import { Dirs, FileSystem } from 'react-native-file-access';
import { getstreaminglink } from './components/Tracks/getstreamlinks';
import { autoplaynextsong,autoplayprevioussong } from './components/controls/controls';
// ...
import * as ScopedStorage from 'react-native-scoped-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

//import { Buffer } from "buffer";
//import RNFS from 'react-native-fs';


export async function setupPlayer() {
  let isSetup = false;
  try {
    await TrackPlayer.getCurrentTrack();
    isSetup = true;
  }
  catch {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.ContinuePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      
      progressUpdateEventInterval: 1,
    });
    
    isSetup = true;
  }
  finally {
    return isSetup;
  }
};

async function requestPermission(directoryId) {
  let dir = await ScopedStorage.openDocumentTree(true);
  if (!dir) return null; // User cancelled
  await AsyncStorage.setItem(directoryId, JSON.stringify(dir));
  return dir;
}

export async function getAndroidDir(directoryId) {
  try {
    let dir = await AsyncStorage.getItem(directoryId); // Check if dir exists already
    if (!dir) dir = await requestPermission(directoryId);
    // request new permissions & save the dir;
    else dir = JSON.parse(dir);

    const persistedUris = await ScopedStorage.getPersistedUriPermissions(); // list all persisted uris
    if (persistedUris.indexOf(dir.uri) !== -1) return dir; // Verify we still have permission
    return await requestPermission(directoryId); // request new permissions & save the dir;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function addTracks() { 

    const dir = await getAndroidDir('userDataDirectory')
    //console.log(dir)
    //console.log(dir.uri)
    let files = await ScopedStorage.listFiles(dir.uri)
    //console.log(files)
    files = files.filter((file) =>{return(file.mime === "audio/mpeg" && !file.name.includes(".trashed"))})
    const CaesarAIMusicLogo = require('./assets/CaesarAILogo.png')
    const alltracks = files.map(function(file,idx) {
      var o = Object.assign({}, file);
      o.isActive = true;
      o.id = idx; 
      o.url = file.uri;
      o.title = file.name;
      o.artist = "CaesarAIMusic"
      o.artwork = CaesarAIMusicLogo
      return o;
    })
    //console.log(alltracks)


  await TrackPlayer.add(alltracks);
  await TrackPlayer.setRepeatMode(RepeatMode.Queue);
};


export async function playbackService() {
  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async (progress) => {
    console.log('Event.PlaybackProgressUpdated');
    
    let currentTrackInd = await TrackPlayer.getCurrentTrack();
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd);
    if (currentTrack.mediastatus !== "online"){

    }
    else{
      console.log(progress)
      if (progress.duration !== 0){
        console.log(progress,"hi")
        if ((progress.duration - progress.position) < 2){
          autoplaynextsong()
          //await TrackPlayer.setRepeatMode(RepeatMode.Off);

      
        }
      
        }
    }



   
  });
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    console.log('Event.RemotePause');
    TrackPlayer.pause();
  });
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    console.log('Event.PlaybackQueueEnded');
  ;
  });

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    console.log('Event.RemotePlay');
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    console.log('Event.RemoteNext');
      
    TrackPlayer.getCurrentTrack().then((currentTrackInd) =>{
      TrackPlayer.getTrack(currentTrackInd).then((currentTrack) =>{
        if (currentTrack.mediastatus !== "online"){
          TrackPlayer.skipToNext();
        }
        else{
          autoplaynextsong()
        }
      })
    })
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    console.log('Event.RemotePrevious');
  
    TrackPlayer.getCurrentTrack().then((currentTrackInd) =>{
      TrackPlayer.getTrack(currentTrackInd).then((currentTrack) =>{
        if (currentTrack.mediastatus !== "online"){
          TrackPlayer.skipToPrevious();
        }
        else{
          autoplayprevioussong()
        }
      })
    })

    //
  });
  TrackPlayer.addEventListener(Event.PlaybackTrackChanged,() => {
  })
}
