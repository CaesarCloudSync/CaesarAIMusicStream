import { getstreaminglink } from "../Tracks/getstreamlinks"
import TrackPlayer  from "react-native-track-player"
import AsyncStorage from "@react-native-async-storage/async-storage"
import RNFS from "react-native-fs";
import { get_access_token } from "../access_token/getaccesstoken";
import { convertToValidFilename } from "../tool/tools";
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
        let [streaming_link,title] = !track_downloaded  ? await getstreaminglink(nextsong) :  [`file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(nextsong.name)}.mp3`,undefined]
        let thumbnail = !track_downloaded  ? await get_thumbnail(nextsong.album_id) :  `file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(nextsong.name)}.jpg`
        
        
        if ("playlist_thumbnail" in nextsong && !("playlist_local" in nextsong)){
            await TrackPlayer.add([{playlist_thumbnail:nextsong.playlist_thumbnail,playlist_id:nextsong.playlist_id,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
            await TrackPlayer.add([{playlist_thumbnail:nextsong.playlist_thumbnail,playlist_id:nextsong.playlist_id,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id + "dummy",url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
            await TrackPlayer.skip(queue.length)
            await TrackPlayer.play()
        }
        else if ("playlist_local" in nextsong){
            await TrackPlayer.add([{playlist_local:nextsong.playlist_local,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
            await TrackPlayer.add([{playlist_local:nextsong.playlist_local,playlist_name:nextsong.playlist_name,index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id + "dummy",url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
            await TrackPlayer.skip(queue.length)
            await TrackPlayer.play()

        }
        else{
            console.log("nextsong",nextsong)
        
        await TrackPlayer.add([{index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
        await TrackPlayer.add([{index:player_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:thumbnail,isActive:true,id:nextsong.id + "dummy",url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
        await TrackPlayer.skip(queue.length)
        await TrackPlayer.play()
    }

    }
    else{
        var elementPos = queue.findIndex(track => track.id == nextsong.id && track.url !== "dummy")
        await TrackPlayer.skip(elementPos)
        await TrackPlayer.play()
     

    }
}
export const autoplaynextsong = async () =>{

    const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
    const album_tracks = JSON.parse(stored_album_tracks)
    //console.log(album_tracks[0])
    let num_of_tracks = album_tracks.length -1
    //console.log(num_of_tracks)
    let currentTrackInd = await  TrackPlayer.getCurrentTrack()
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
    let currentTrackInd = await  TrackPlayer.getCurrentTrack()
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