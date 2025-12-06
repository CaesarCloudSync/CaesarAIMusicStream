import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  Event,
} from 'react-native-track-player';
//import { Dirs, FileSystem } from 'react-native-file-access';
import { getstreaminglink } from './components/Tracks/getstreamlinks';
import { autoplaynextsong,autoplayprevioussong, changerecommendyt, get_next_song_in_recommend_queue, get_recommend_mode, get_recommended_songs, store_current_recommended_yt_to_spotify } from './components/controls/controls';
// ...
import notifee, { EventType } from '@notifee/react-native';


import * as ScopedStorage from 'react-native-scoped-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

//import { Buffer } from "buffer";
import RNFS from 'react-native-fs';
import { VolumeManager } from 'react-native-volume-manager';
import { sendmusicconnect } from './components/mqttclient/mqttclient';
import { get_next_ind_in_album,get_next_song,get_track_after_queue,get_new_queue,play_next_queued_song,prefetchsong } from './components/controls/controls';
import { getrecommendations, searchsongsrecommend } from './components/Tracks/getrecommendations';
export async function setupPlayer() {
  let isSetup = false;
  try {
    await TrackPlayer.getActiveTrackIndex();
    isSetup = true;
  }
  catch {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.ContinuePlayback,
      },
     // icon: require('./assets/CaesarAILogoNotification.png'),
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
    //await AsyncStorage.setItem("summer_songs",JSON.stringify(alltracks))
    //console.log(alltracks)


  await TrackPlayer.add(alltracks);
  await TrackPlayer.setRepeatMode(RepeatMode.Queue);
};

export const getsongrecommendation = async () =>{
    const recommended_songs = await get_recommended_songs()
  const nextsongrecommendyt = await get_next_song_in_recommend_queue(recommended_songs)
  
  console.log("nextsongrecommendyt",nextsongrecommendyt)
  const  [nextsongsrecommend,album_tracks_recommend] = await searchsongsrecommend(nextsongrecommendyt.title,nextsongrecommendyt.artists[0].name)
  
  await store_current_recommended_yt_to_spotify(album_tracks_recommend)
  return nextsongsrecommend
}

export const repopulaterecommendations = async () =>{
    const stored_recommendations = await AsyncStorage.getItem("current-recommendations")
    console.log("stored_recommendations_hi",stored_recommendations)
    if (stored_recommendations){

      let recommendations = JSON.parse(stored_recommendations)
      console.log("recommendations_hi",recommendations.length)
      if (recommendations.length < 10){
          console.log("getting more recommendations")
         // get songs
          const current_track = await TrackPlayer.getActiveTrack();
          let needed_recommendations = 10 - recommendations.length
          console.log("needed_recommendations",needed_recommendations)
          await AsyncStorage.setItem("current-autorecommend","true")
          const single_recommendation = await getrecommendations(current_track,max_songs=needed_recommendations)
          console.log("single_recommendation",single_recommendation[0])
          const new_recommendations = recommendations.concat(single_recommendation) 
          await AsyncStorage.setItem("current-recommendations",JSON.stringify(new_recommendations))
          await AsyncStorage.removeItem("current-autorecommend")
        }
      }
  }
export async function playbackService() {
  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async (progress) => {
    console.log('Event.PlaybackProgressUpdated');
    
    let currentTrackInd = await TrackPlayer.getActiveTrackIndex();
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd);
    if (currentTrack.mediastatus !== "online"){

    }
    else{
      console.log(progress)
      if (progress.duration !== 0){
        console.log(progress,"hi")
        //await AsyncStorage.removeItem("current_autonext")
        const current_autonext = await AsyncStorage.getItem("current_autonext")
        let duration_remaining = progress.duration - progress.position
        if (duration_remaining < 20 && duration_remaining > 5){
          //andleautoplaynextsong()
          
          if (!current_autonext){
                const newqueue = await get_new_queue()
                const recommend_mode = await get_recommend_mode()
                
                  if (newqueue){
                    console.log("ajobca")
                    const [next_ind_in_album,num_of_tracks,currentTrackIndexInaAlbum,player_ind,album_tracks] = await get_next_ind_in_album()
                    const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${newqueue.artist}-${newqueue.album_name}-${newqueue.name}`)
                    if (!track_downloaded){
                      if (!current_autonext){
                        await AsyncStorage.setItem("current_autonext","true")
                        const nextsong_new_queue = JSON.parse(newqueue)
                        console.log("queued,",nextsong_new_queue[0])
                        await prefetchsong(nextsong_new_queue[0])
                      }
                    }

                  }
                  else if (recommend_mode){
                    
                    const nextsongsrecommend = await getsongrecommendation()
                    const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${nextsongsrecommend.artist}-${nextsongsrecommend.album_name}-${nextsongsrecommend.name}`)  
                      //await AsyncStorage.setItem("current-recommend",JSON.stringify(nextsongsrecommend))
                      if (!track_downloaded){
                        if (!current_autonext){
                        await AsyncStorage.setItem("current_autonext","true")
                        console.log("prefetching",nextsongsrecommend)
                        await prefetchsong(nextsongsrecommend)
                      }
                      }
                      // await repopulaterecommendations()
        
                    
 
                  }
                  else{
                    console.log("hello")
                    const [next_ind_in_album,num_of_tracks,currentTrackIndexInaAlbum,player_ind,album_tracks] = await get_next_ind_in_album()
                    console.log("hamamsn")
                    const track_after_queue = await get_track_after_queue()
                    console.log("shasu")
                    const nextsong = await get_next_song(track_after_queue,album_tracks,next_ind_in_album)
                    console.log("jdacinau")
                    const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)
                    console.log("hdabi")
                    if (!track_downloaded){
                      await AsyncStorage.setItem("current_autonext","true")
                      await prefetchsong(nextsong)
                    }
            
                    

                  }
                  


          }
          //await TrackPlayer.setRepeatMode(RepeatMode.Off);

      
        }
        else if (duration_remaining < 2){ 
          await AsyncStorage.setItem("current_autonext","true")
          if (!current_autonext){
            await autoplaynextsong()
            await repopulaterecommendations();
          }


        }
        else{
          await AsyncStorage.removeItem("current_autonext")
        }
      
        }
    }



   
  });

  const handleautoplaynextsong = throttle( async () =>{
      await autoplaynextsong()

  },2000)

  function throttle(callback, delay = 1000) {
    let shouldWait = false;
  
    return (...args) => {
      if (shouldWait) return;
  
      callback(...args);
      shouldWait = true;
      setTimeout(() => {
        shouldWait = false;
      }, delay);
    };
  }
  const handlevolumeconnect= throttle(async (volume) => {
    console.log("hello",volume)
    await AsyncStorage.setItem("current_payloadkey","music_connect_volume")
    await AsyncStorage.setItem("current_topic","caesaraimusicstreamconnect/volume")
    await AsyncStorage.setItem("music_connect_volume",volume.toString());
    await AsyncStorage.setItem("current_subscribe_topic","caesaraimusicstreamconnect/sub-volume")
    await sendmusicconnect()
    await AsyncStorage.removeItem("current_payloadkey")
    await AsyncStorage.removeItem("current_topic")
    await AsyncStorage.removeItem("music_connect_volume");
    await AsyncStorage.removeItem("current_subscribe_topic")
  }, 1000);
  const volumeListener = VolumeManager.addVolumeListener(async (result) => {
    let volume = result.volume
    let music_connected =  await AsyncStorage.getItem("music_connected")
    if (music_connected){
      handlevolumeconnect(volume)
    }
    
    //console.log(result.volume.toString(),typeof result.volume.toString());
    // TODO This code works it just needs to be throttle to reduce the load sent on the mqtt
    /* 

    */
  
    // On Android, additional volume types are available:
    // music, system, ring, alarm, notification
  });
  
  notifee.onForegroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction.id) {
      console.log('User pressed an action with the id: ',detail.pressAction.id);
      const jobIdjson = JSON.parse(await AsyncStorage.getItem(`current_downloading:${detail.notification.id}`));
      console.log("notif_id",detail.notification.id)
      console.log(jobIdjson)
      await RNFS.stopDownload(jobIdjson["jobId"])
      await notifee.cancelNotification(detail.notification.id);
      
    }
  });
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction.id) {
      console.log('User pressed an action with the id: ',detail.pressAction.id);
      const jobIdjson = JSON.parse(await AsyncStorage.getItem(`current_downloading:${detail.notification.id}`));
      console.log("notif_id",detail.notification.id)
      console.log(jobIdjson)
      await RNFS.stopDownload(jobIdjson["jobId"])
      await notifee.cancelNotification(detail.notification.id);
      
    }
  });
  TrackPlayer.addEventListener(Event.RemotePause,async  () => {
    console.log('Event.RemotePause');
    TrackPlayer.pause();
    let music_connected =  await AsyncStorage.getItem("music_connected")
    if (music_connected){
      console.log("pause","music_connect")
      await AsyncStorage.setItem("current_payloadkey","music_connect_pause")
      await AsyncStorage.setItem("current_topic","caesaraimusicstreamconnect/pause")
      await AsyncStorage.setItem("music_connect_pause","pause");
      await AsyncStorage.setItem("current_subscribe_topic","caesaraimusicstreamconnect/sub-pause")
      await sendmusicconnect()
      await AsyncStorage.removeItem("current_payloadkey")
      await AsyncStorage.removeItem("current_topic")
      await AsyncStorage.removeItem("music_connect_pause");
      await AsyncStorage.removeItem("current_subscribe_topic")
      
      await TrackPlayer.setVolume(0)
      //await TrackPlayer.setRate(0.00000000001)
      await TrackPlayer.pause();
      
   
      
    }
    else{
      TrackPlayer.pause();
    }
  });
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    console.log('Event.PlaybackQueueEnded');
  ;
  });


  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    console.log('Event.RemotePlay');
    let music_connected =  await AsyncStorage.getItem("music_connected")
    if (music_connected){
      console.log("play","music_connect")
      await AsyncStorage.setItem("current_payloadkey","music_connect_play")
      await AsyncStorage.setItem("current_topic","caesaraimusicstreamconnect/play")
      await AsyncStorage.setItem("music_connect_play","play");
      await AsyncStorage.setItem("current_subscribe_topic","caesaraimusicstreamconnect/sub-play")
      await sendmusicconnect()
      await AsyncStorage.removeItem("current_payloadkey")
      await AsyncStorage.removeItem("current_topic")
      await AsyncStorage.removeItem("music_connect_play");
      await AsyncStorage.removeItem("current_subscribe_topic")

      await TrackPlayer.setVolume(0)
      //await TrackPlayer.setRate(0.00000000001)
      await TrackPlayer.play();
      
    
      
    }
    else{
      TrackPlayer.play();
    }
   
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    console.log('Event.RemoteNext');
      
   const currentTrackInd = await  TrackPlayer.getActiveTrackIndex()
    const currentTrack = await TrackPlayer.getTrack(currentTrackInd)
    if (currentTrack.mediastatus !== "online"){
         await  TrackPlayer.skipToNext();
        }
        else{
          const recommend_mode = await get_recommend_mode()
          console.log("recommend_mode",recommend_mode)
          if (recommend_mode){
            const nextsongsrecommend = await getsongrecommendation()
            await prefetchsong(nextsongsrecommend)
          }
          await autoplaynextsong()
          await repopulaterecommendations();
        }
  
  });

    TrackPlayer.addEventListener('remote-seek', ({position}) => {
    console.log('Event.Seek');
    TrackPlayer.seekTo(position);
      

  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    console.log('Event.RemotePrevious');
  
    TrackPlayer.getActiveTrackIndex().then((currentTrackInd) =>{
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
