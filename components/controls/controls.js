import { getstreaminglink } from "../Tracks/getstreamlinks"
import TrackPlayer  from "react-native-track-player"
import AsyncStorage from "@react-native-async-storage/async-storage"
import RNFS from "react-native-fs";
import { get_access_token } from "../access_token/getaccesstoken";
import { convertToValidFilename } from "../tool/tools";
import { sendmusicconnect } from "../mqttclient/mqttclient";
import { VolumeManager } from 'react-native-volume-manager';
import { MUSICSDCARDPATH } from "../constants/constants";
import { abortManager } from "../abortmanager/abortmanager";
const get_thumbnail = async (album_id) =>{
    const access_token = await get_access_token();
    const headers = {Authorization: `Bearer ${access_token}`}
    const resp = await fetch(`https://api.spotify.com/v1/albums/${album_id}`, {headers: headers})
    const feedresult = await resp.json()
    let album_thumbnail_after = feedresult.images[0].url
    return album_thumbnail_after

}
export const preloadnext = async (nextsong,queue) => {
        const next_exists_queue = queue.filter((track) => track.id === nextsong.id);
        const next_track_downloaded = await AsyncStorage.getItem(`downloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`);
        const next_preloaded_song = await AsyncStorage.getItem(`preloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`);
        console.log("nextpreload", nextsong);
        console.log("nextcondition", next_exists_queue, next_track_downloaded, next_preloaded_song);
        if (next_exists_queue.length === 0 && !next_track_downloaded && !next_preloaded_song) {
        const [streaming_link, title] = await getstreaminglink(nextsong);
        await AsyncStorage.setItem(`preloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`, streaming_link);
        return { streaming_link, title };
        }
        return null;
    }
export const preloadprev = async (prevsong,queue) => {
        const prev_exists_queue = queue.filter((track) => track.id === prevsong.id);
        const prev_track_downloaded = await AsyncStorage.getItem(`downloaded-track:${prevsong.artist}-${prevsong.album_name}-${prevsong.name}`);
        const prev_preloaded_song = await AsyncStorage.getItem(`preloaded-track:${prevsong.artist}-${prevsong.album_name}-${prevsong.name}`);
        console.log("prevcondition", prev_exists_queue, prev_track_downloaded, prev_preloaded_song);
        if (prev_exists_queue.length === 0 && !prev_track_downloaded && !prev_preloaded_song) {
        const [streaming_link, title] = await getstreaminglink(prevsong);
        await AsyncStorage.setItem(`preloaded-track:${prevsong.artist}-${prevsong.album_name}-${prevsong.name}`, streaming_link);
        return { streaming_link, title };
        }
        return null;
    }
export const loadcurrent = async (nextsong,queue,player_ind) => {
        const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)
        const preloaded_song =  await AsyncStorage.getItem(`preloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)
        const fetch_song_task =  await AsyncStorage.getItem(`fetch-track-task:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)
        console.log("Abort Fetch",fetch_song_task)
        if (fetch_song_task){
            console.log("Aborted Request",fetch_song_task)
            abortManager.abortRequest(fetch_song_task)
        }
        let [streaming_link,title] = !track_downloaded  ? preloaded_song ? [preloaded_song,nextsong.name] :await getstreaminglink(nextsong)  :  [`file://${MUSICSDCARDPATH}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`,undefined]
        let thumbnail = !track_downloaded  ? nextsong.ytcustom ? nextsong.thumbnail :await get_thumbnail(nextsong.album_id) :  `file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.jpg`
                
        const streaming_type = streaming_link.includes(".m3u8") ? "hls" : "default"
        if ("playlist_thumbnail" in nextsong && !("playlist_local" in nextsong)){
            await TrackPlayer.add([{playlist_thumbnail:nextsong.playlist_thumbnail,playlist_id:nextsong.playlist_id,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
            await TrackPlayer.add([{playlist_thumbnail:nextsong.playlist_thumbnail,playlist_id:nextsong.playlist_id,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id + "dummy",url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
            await TrackPlayer.skip(queue.length)
            let music_connected =  await AsyncStorage.getItem("music_connected")
            if (!music_connected){
            await TrackPlayer.setVolume(1)
            //TrackPlayer.setRate(1)
            await TrackPlayer.play()
            }
        }
        else if ("playlist_local" in nextsong){
            await TrackPlayer.add([{playlist_local:nextsong.playlist_local,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
            await TrackPlayer.add([{playlist_local:nextsong.playlist_local,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id + "dummy",url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
            await TrackPlayer.skip(queue.length)
            let music_connected =  await AsyncStorage.getItem("music_connected")
            if (!music_connected){
            await TrackPlayer.setVolume(1)
            //TrackPlayer.setRate(1)mp3
            await TrackPlayer.play()
            }

        }
        else{
            console.log("nextsong",nextsong)
        
        await TrackPlayer.add([{index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
        await TrackPlayer.add([{index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id + "dummy",url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online",type:streaming_type}]);
        await TrackPlayer.skip(queue.length)
        let music_connected =  await AsyncStorage.getItem("music_connected")
        if (!music_connected){
        await TrackPlayer.setVolume(1)
        //TrackPlayer.setRate(1)
        await TrackPlayer.play()
        }
    }
    // Thumbnail Doesn't take into accoun ytcustom
    let music_connected =  await AsyncStorage.getItem("music_connected")
    if (music_connected){

    if (streaming_link.includes("file://")){
        let [music_connected_link ,title]= await getstreaminglink(nextsong)
        nextsong.url = music_connected_link
    }
    else{
        nextsong.url = streaming_link
    }

    if (thumbnail.includes("file://")){
        if (!nextsong.ytcustom){
            let music_connected_thumbnail = await get_thumbnail(nextsong.album_id);
            nextsong.thumbnail = music_connected_thumbnail
        }
        else{
            nextsong.thumbnail = ""
        }
    }
    else{
        nextsong.thumbnail = thumbnail   
    }
    nextsong.volume = (await VolumeManager.getVolume()).volume
    await AsyncStorage.setItem("music_connect_next_track",JSON.stringify(nextsong))
    await sendmusicconnect()
    
    }
    
    const queue_current_track = await AsyncStorage.getItem(`queue-current-track-${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`);
    if (queue_current_track){
        await AsyncStorage.setItem("current-track",JSON.stringify(nextsong));
        await AsyncStorage.setItem("current-tracks",queue_current_track);
    }

    }
export const getstreaminglinktracks = async (currentsong,track_index_in_album,album_tracks,queue,player_ind) => {
    let album_length = album_tracks.length
    let previous_track_index = track_index_in_album - 1
    let next_track_index = track_index_in_album + 1

    let prevsong = previous_track_index < 0 ? album_tracks[0] : album_tracks[previous_track_index]
    let nextsong = next_track_index >= album_length ? album_tracks[0] : album_tracks[next_track_index]


    
    const [currentResult,nextResult, prevResult] = await Promise.all([
    // Next song processing
    loadcurrent(currentsong,queue,player_ind),
    preloadnext(nextsong,queue),
    // Previous song processing
    preloadprev(prevsong,queue)
    ]);
     
    
}
export const skipToTrack = async (album_tracks,nextsong,player_ind)=>{
    
    
    let queue = await TrackPlayer.getQueue();
    let next_exists_queue = queue.filter((track) =>{return (track.id === nextsong.id)})
    if (next_exists_queue.length === 0){
        const track_index_in_album = album_tracks.findIndex(track =>track.artist === nextsong.artist &&track.album_name === nextsong.album_name && track.name === nextsong.name)
        console.log("track_index",track_index_in_album)
        await getstreaminglinktracks(nextsong,track_index_in_album,album_tracks,queue,player_ind)
     
        
        //console.log(`file://${MUSICSDCARDPATH}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`,`file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`,`file://${RNFS.ExternalStorageDirectoryPath}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`)




    }
    else{
        var elementPos = queue.findIndex(track => track.id == nextsong.id && track.url !== "dummy")
        
        await TrackPlayer.skip(elementPos)
        
        let music_connected =  await AsyncStorage.getItem("music_connected")
        if (music_connected){
        let streaming_link = queue[elementPos].url
        let thumbnail = queue[elementPos].thumbnail

        if (streaming_link.includes("file://")){
            let [music_connected_link ,title]= await getstreaminglink(nextsong)
            nextsong.url = music_connected_link
        }
        else{
            nextsong.url = streaming_link
        }

        if (thumbnail.includes("file://")){
            let music_connected_thumbnail = await get_thumbnail(nextsong.album_id);
            nextsong.thumbnail = music_connected_thumbnail
        }
        else{
            nextsong.thumbnail = thumbnail   
        }
        nextsong.volume = (await VolumeManager.getVolume()).volume
        await AsyncStorage.setItem("music_connect_next_track",JSON.stringify(nextsong))
        await sendmusicconnect()
        }
        else{
            await TrackPlayer.setVolume(1)
            //TrackPlayer.setRate(1)
            await TrackPlayer.play()
        }
        const queue_current_track = await AsyncStorage.getItem(`queue-current-track-${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`);
        if (queue_current_track){
            await AsyncStorage.setItem("current-track",JSON.stringify(nextsong));
            await AsyncStorage.setItem("current-tracks",queue_current_track);
        }
     

    }
}
export const preloadsong = async (album_tracks,nextsong,player_ind) => {
    
}


export const autoplaynextsong = async () =>{
    // TODO Clean up functions - Chase Shakurs new song caused youtubesearch to go zero which caused album_tracks[index].link = undefined
    //await AsyncStorage.removeItem("current-tracks")
    // await AsyncStorage.removeItem("current-track")
    //await AsyncStorage.removeItem("track_after_queue")
    //await AsyncStorage.removeItem("queue")

    const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
    const album_tracks = JSON.parse(stored_album_tracks)
    //console.log(album_tracks[0])
    let num_of_tracks = album_tracks.length -1
    //console.log(num_of_tracks)
    let currentTrackInd = await  TrackPlayer.getActiveTrackIndex()
    //console.log("current",currentTrackInd)
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
    //console.log(currentTrack.index,currentTrack)
    let player_ind = (currentTrack.index+ 1) >= num_of_tracks ? 0 : currentTrack.index+ 1 // This adds songs to player regardless of order in album. It just makes sure not to exceed the num of songs in album. The index of song would then be found in player then added to end or skipped to.
    //console.log("next",player_ind,num_of_tracks,album_tracks)
    const currentTrackIndexInaAlbum = album_tracks.findIndex(track => track.id == currentTrack.id)
    let next_ind_in_album = (currentTrackIndexInaAlbum +1) >= num_of_tracks ? 0 : currentTrackIndexInaAlbum +1 
   
    // next_ind null 23 22
    const newqueue = await AsyncStorage.getItem("queue")
    if (newqueue){
        let queue_json = JSON.parse(newqueue)
        let nextsongqueue = queue_json[0]
        //console.log("ho")
        //console.log(queue_json)

        await skipToTrack(album_tracks,nextsongqueue,player_ind)

       
        queue_json.shift()
        if (queue_json.length !== 0){
        await AsyncStorage.setItem("queue",JSON.stringify(queue_json))
        }
        else{
            await AsyncStorage.removeItem("queue")
        }

    }
    else{
       
        //await AsyncStorage.removeItem("track_after_queue")
        const track_after_queue = await AsyncStorage.getItem("track_after_queue");

        console.log("next_ind",track_after_queue,next_ind_in_album,num_of_tracks,currentTrackIndexInaAlbum)
        let nextsong_index = track_after_queue  ? parseInt(track_after_queue) :next_ind_in_album
        
        let nextsong = album_tracks[nextsong_index]
        
        if (nextsong === undefined){
            await AsyncStorage.removeItem("track_after_queue")
            
            await skipToTrack(album_tracks,album_tracks[next_ind_in_album],player_ind)
        }
        else{
            await skipToTrack(album_tracks,nextsong,player_ind)

            if (track_after_queue){
                await AsyncStorage.removeItem("track_after_queue")
            }
        }


    }
    console.log(newqueue)
    //await TrackPlayer.setRepeatMode(RepeatMode.Off);

    //await TrackPlayer.reset();






}
export const autoplayprevioussong = async () =>{
    const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
    const album_tracks = JSON.parse(stored_album_tracks)
    let num_of_tracks = album_tracks.length
    let currentTrackInd = await  TrackPlayer.getActiveTrackIndex()
    //console.log("current",currentTrackInd)
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
    //console.log(currentTrack.index,currentTrack.title,currentTrackInd)

    let player_ind = (currentTrack.index+ 1) >= num_of_tracks ? 0 : currentTrack.index+ 1 // This adds songs to player regardless of order in album. It just makes sure not to exceed the num of songs in album. The index of song would then be found in player then added to end or skipped to.
    const currentTrackIndexInaAlbum = album_tracks.findIndex(track => track.id == currentTrack.id)
    let next_ind_in_album = (currentTrackIndexInaAlbum -1) <= 0 ? 0 : currentTrackIndexInaAlbum -1 
    let nextsong = album_tracks[next_ind_in_album]
    //console.log("next",currentTrackIndexInaAlbum)
    await skipToTrack(album_tracks,nextsong,player_ind)
   





}