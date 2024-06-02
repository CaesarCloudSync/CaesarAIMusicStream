import axios from "axios";
import TrackPlayer, {
    AppKilledPlaybackBehavior,
    Capability,
    RepeatMode,
    Event,
  } from 'react-native-track-player';
import { Alert } from "react-native";
import ytdl from "react-native-ytdl";
export const addTrack = async (streaming_link,album_track) =>{
    //files = files.filter((file) =>{return(file.mime === "audio/mpeg" && !file.name.includes(".trashed"))})
    //const CaesarAIMusicLogo = require('../../assets/CaesarAILogo.png')
    const track = [{album_id:album_track.album_id,album_name:album_track.album_name,thumbnail:album_track.thumbnail,isActive:true,id:album_track.id,url:streaming_link,title:album_track.name,artist:album_track.artist,artwork:album_track.thumbnail}]
    //console.log(alltracks)
    
    await TrackPlayer.reset()
    await TrackPlayer.seekTo(0)
    await TrackPlayer.add(track);
    //await TrackPlayer.setRepeatMode(RepeatMode.Queue);
    await TrackPlayer.play()
}
export const getyoutubelink  = async (album_track,download=false) =>{
    let searchquery = `${album_track.name.replace("&","and")} by ${album_track.artist}`//hoodie szn a boogie wit da hoodie album 20 tracks
    const response = await axios.get(`https://caesaraiyoutube-qqbn26mgpa-uc.a.run.app/searchfeed?query=${searchquery}&amount=50`)
    let videos = response.data.result
    let video_link = download === true ? videos[0].link :videos[0].link //videos[1].link
    return video_link
}
export const getstreaminglink =async (album_track) =>{
    const video_link = await getyoutubelink(album_track,download=false);
    const id = ytdl.getVideoID(video_link);
    //console.log(id)
    const info = await ytdl.getInfo(id);
    //console.log(info)
    let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    const format = ytdl.chooseFormat(audioFormats, {quality: 'highest'});
    let songurl = format.url
    return songurl
}
export  const getaudio = async (album_track,setCurrentTrack) =>{
        let streaming_link = await getstreaminglink(album_track)
        //console.log(streaming_link)
       
                        
        await addTrack(streaming_link,album_track)
        setCurrentTrack(album_track.name)


}
