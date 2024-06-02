import { getstreaminglink } from "../Tracks/getstreamlinks"
import TrackPlayer from "react-native-track-player"
import AsyncStorage from "@react-native-async-storage/async-storage"
export const autoplaynextsong = async () =>{

    const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
    const album_tracks = JSON.parse(stored_album_tracks)
    console.log(album_tracks[0])
    let num_of_tracks = album_tracks.length
    //console.log(num_of_tracks)
    let currentTrackInd = await  TrackPlayer.getCurrentTrack()
    console.log("current",currentTrackInd)
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
    console.log(currentTrack.index)
    let next_track_ind = (currentTrack.index+ 1) > num_of_tracks ? 0 : currentTrack.index+ 1
    console.log("next",next_track_ind)

    let nextsong = album_tracks[next_track_ind]
   
    //await TrackPlayer.setRepeatMode(RepeatMode.Off);
    let streaming_link = await getstreaminglink(nextsong)
    await TrackPlayer.reset();
    await TrackPlayer.add([{index:next_track_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
    await TrackPlayer.add([{index:next_track_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id,url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
    await TrackPlayer.play();




}
export const autoplayprevioussong = async () =>{
    const stored_album_tracks = await AsyncStorage.getItem("current-tracks")
    const album_tracks = JSON.parse(stored_album_tracks)
    let currentTrackInd = await  TrackPlayer.getCurrentTrack()
    console.log("current",currentTrackInd)
    let currentTrack = await TrackPlayer.getTrack(currentTrackInd)
    console.log(currentTrack.index)
    let next_track_ind = (currentTrack.index- 1) <  0 ? 0 : currentTrack.index-  1
    console.log("next",next_track_ind)

    let nextsong = album_tracks[next_track_ind]
   
    //await TrackPlayer.setRepeatMode(RepeatMode.Off);
    let streaming_link = await getstreaminglink(nextsong)
    await TrackPlayer.reset();
    await TrackPlayer.add([{index:next_track_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id,url:streaming_link,title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
    await TrackPlayer.add([{index:next_track_ind,album_id:nextsong.album_id,album:nextsong.album_name,album_name:nextsong.album_name,thumbnail:nextsong.thumbnail,isActive:true,id:nextsong.id,url:"dummy",title:nextsong.name,artist_id:nextsong.artist_id,artist:nextsong.artist,artwork:nextsong.thumbnail,duration:nextsong.duration_ms / 1000,mediastatus:"online"}]);
    await TrackPlayer.play();




}