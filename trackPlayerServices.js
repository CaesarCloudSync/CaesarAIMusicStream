import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  Event,
} from 'react-native-track-player';
//import { Dirs, FileSystem } from 'react-native-file-access';
import { getstreaminglink } from './components/Tracks/getstreamlinks';
import { autoplaynextsong,autoplayprevioussong, changerecommendyt, find_recommended_song, get_next_song_in_recommend_queue, get_recommend_mode, get_recommended_songs, store_current_recommended_yt_to_spotify } from './components/controls/controls';
// ...
import notifee, { EventType } from '@notifee/react-native';


import * as ScopedStorage from 'react-native-scoped-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import RNBackgroundDownloader from '@kesha-antonov/react-native-background-downloader'

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
export const remove_recommend_next_played = async (recommended_songs) =>{
    const recommended_songs_json = JSON.parse(recommended_songs)
    recommended_songs_json.shift()
    if (recommended_songs_json.length !== 0){
    await AsyncStorage.setItem("current-recommendations",JSON.stringify(recommended_songs_json))
    }
    else{
        await AsyncStorage.removeItem("current-recommendations")
    }
}
export const getsongrecommendation = async (prefetching=false) =>{
  const recommended_songs = await get_recommended_songs()
  const nextsongrecommendyt = await get_next_song_in_recommend_queue(recommended_songs)
  
  console.log("nextsongrecommendyt",nextsongrecommendyt)
  const  [nextsongsrecommend,album_tracks_recommend] = await searchsongsrecommend(nextsongrecommendyt.title,nextsongrecommendyt.artists[0].name)

  await store_current_recommended_yt_to_spotify(album_tracks_recommend)
  
  return nextsongsrecommend
}
export const getspecificsongrecommendation = async (song_name,artist) =>{
  const recommended_songs = await get_recommended_songs()
  const nextsongrecommendyt = await find_recommended_song(song_name,artist,recommended_songs)
  
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
                      await prefetchsong(nextsong,1)
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
  async function updateStreamUrl(index, newUrl) {
  const oldTrack = await TrackPlayer.getTrack(index);

  await TrackPlayer.remove([index]);

  await TrackPlayer.add(
    {
      ...oldTrack,
      url: newUrl,
    },
    index
  );
  console.log(    {
      ...oldTrack,
      url: newUrl,
    },"UpdateStreamUrl")
  await TrackPlayer.skip(index);
}
  TrackPlayer.addEventListener(Event.PlaybackError,async (event) => {
        console.log('Playback error:', event);
        let message = event.message;
         if (message === "Source error"){
          const current_autonext = await AsyncStorage.getItem("current_autonext_error")
          if (!current_autonext){
            await AsyncStorage.setItem("current_autonext_error","true")
           const current_track = await TrackPlayer.getActiveTrack();
           if (current_track.url.includes("https://")){
            console.log(current_track,"Errror")
            const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
            const album_tracks = JSON.parse(stored_album_tracks)
            let num_of_tracks = album_tracks.length
            let currentTrackInd = await  TrackPlayer.getActiveTrackIndex()
            //console.log("current",currentTrackInd)
            let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
    
            const currentTrackIndexInaAlbum = album_tracks.findIndex(track => track.id == currentTrack.id)
            let nextsong = album_tracks[currentTrackIndexInaAlbum]
            const [streaming_link,title] = await getstreaminglink(nextsong)
            await updateStreamUrl(currentTrackInd,streaming_link)
            //console.log("next",currentTrackIndexInaAlbum)

           }
          
         }
        }
        else{
          await AsyncStorage.removeItem("current_autonext_error")
        }
      })

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
  const stopBackgroundDownload = async (jobId) => {
  const lostTasks = await RNBackgroundDownloader.checkForExistingDownloads();
    const tasksToStop = lostTasks.filter(t => t.id === jobId);

    for (const task of tasksToStop) {
      console.log(`Stopping: ${task.id}`);
      task.stop();
    }

    if (tasksToStop.length === 0) {
      console.log(`No tasks matched jobId: ${jobId}`);
}
  }
  notifee.onForegroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction.id) {
      console.log('User pressed an action with the id: ',detail.pressAction.id);
      const jobIdjson = JSON.parse(await AsyncStorage.getItem(`current_downloading:${detail.notification.id}`));
      console.log("notif_id",detail.notification.id)
      console.log(jobIdjson)
      stopBackgroundDownload( jobIdjson["jobId"])
      await notifee.cancelNotification(detail.notification.id);
      await AsyncStorage.removeItem(`current_downloading:${detail.notification.id}`);
      //const keys = await AsyncStorage.getAllKeys();
      //AsyncStorage.multiRemove(keys.filter(key => key.includes('current_downloading:notif_r')))
      
    }
  });
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction.id) {
      console.log('User pressed an action with the id: ',detail.pressAction.id);
      const jobIdjson = JSON.parse(await AsyncStorage.getItem(`current_downloading:${detail.notification.id}`));
      console.log("notif_id",detail.notification.id)
      console.log(jobIdjson)
      stopBackgroundDownload( jobIdjson["jobId"])
      await notifee.cancelNotification(detail.notification.id);
      await AsyncStorage.removeItem(`current_downloading:${detail.notification.id}`);
      
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
