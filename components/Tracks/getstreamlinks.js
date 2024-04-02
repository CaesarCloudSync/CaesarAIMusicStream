import axios from "axios";
import TrackPlayer, {
    AppKilledPlaybackBehavior,
    Capability,
    RepeatMode,
    Event,
  } from 'react-native-track-player';
import { Alert } from "react-native";
export const addTrack = async (streaming_link,album_track) =>{
    //files = files.filter((file) =>{return(file.mime === "audio/mpeg" && !file.name.includes(".trashed"))})
    //const CaesarAIMusicLogo = require('../../assets/CaesarAILogo.png')
    const track = [{isActive:true,id:album_track.name,url:streaming_link,title:album_track.name,artist:album_track.artist,artwork:album_track.thumbnail}]
    //console.log(alltracks)

    await TrackPlayer.reset()
    await TrackPlayer.add(track);
    await TrackPlayer.setRepeatMode(RepeatMode.Queue);
    await TrackPlayer.play()
}
export  const getstreaminglink =async (album_track) =>{
    let searchquery = `${album_track.name} by ${album_track.artist}`//hoodie szn a boogie wit da hoodie album 20 tracks
    const response = await axios.get(`https://caesaraiyoutube-qqbn26mgpa-uc.a.run.app/searchfeed?query=${searchquery}&amount=50`)
    let videos = response.data.result
    let video_link = videos[1].link
    const responseaudio = await axios.get(`https://caesaraiyoutube-qqbn26mgpa-uc.a.run.app/getaudiowatch?url=${video_link}`)
    console.log(responseaudio.data)
    if (responseaudio.data.title === "Video Not Available.mp3"){
        Alert.alert("Backend Error")
    }
    else{
        let streaming_link = responseaudio.data.media
        return streaming_link
}}
export  const getaudio = async (album_track,setCurrentTrack) =>{
        let streaming_link = await getstreaminglink(album_track)
        console.log(streaming_link)
       
                        
        await addTrack(streaming_link,album_track)
        setCurrentTrack(album_track.name)


}