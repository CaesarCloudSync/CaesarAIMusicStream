import { getstreaminglink } from "../Tracks/getstreamlinks"
import TrackPlayer  from "react-native-track-player"
import AsyncStorage from "@react-native-async-storage/async-storage"
import RNFS from "react-native-fs";
import { get_access_token } from "../access_token/getaccesstoken";
import { convertToValidFilename } from "../tool/tools";
import { sendmusicconnect } from "../mqttclient/mqttclient";
import { VolumeManager } from 'react-native-volume-manager';
import { MUSICSDCARDPATH } from "../constants/constants";
const get_thumbnail = async (album_id) =>{
    const access_token = await get_access_token();
    const headers = {Authorization: `Bearer ${access_token}`}
    const resp = await fetch(`https://api.spotify.com/v1/albums/${album_id}`, {headers: headers})
    const feedresult = await resp.json()
    let album_thumbnail_after = feedresult.images[0].url
    return album_thumbnail_after

}
export const skipToTrack = async (nextsong,player_ind)=>{
    let queue = await TrackPlayer.getQueue();
    let next_exists_queue = queue.filter((track) =>{return (track.id === nextsong.id)})
    if (next_exists_queue.length === 0){
        const track_downloaded = await AsyncStorage.getItem(`downloaded-track:${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)
        //console.log(`file://${MUSICSDCARDPATH}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`,`file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`,`file://${RNFS.ExternalStorageDirectoryPath}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`)
        let [streaming_link,title] = !track_downloaded  ? await getstreaminglink(nextsong) :  [`file://${MUSICSDCARDPATH}/${convertToValidFilename(`${nextsong.artist}-${nextsong.album_name}-${nextsong.name}`)}.mp3`,undefined]
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

        await skipToTrack(nextsongqueue,player_ind)

       
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
        let nextsong = track_after_queue  ? album_tracks[parseInt(track_after_queue)]:album_tracks[next_ind_in_album]
        if (nextsong === undefined){
            await AsyncStorage.removeItem("track_after_queue")
            
            await skipToTrack(album_tracks[next_ind_in_album],player_ind)
        }
        else{
            await skipToTrack(nextsong,player_ind)

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
    await skipToTrack(nextsong,player_ind)
   





}