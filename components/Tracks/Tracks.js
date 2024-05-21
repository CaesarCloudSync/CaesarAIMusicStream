import { useEffect, useState,useCallback,useRef } from "react"
import { View,Text, FlatList,Image, TouchableOpacity,AppState} from "react-native"
import { useLocation,useNavigate } from "react-router-native"
import TrackItem from "./TrackItem";
import AntDesign from "react-native-vector-icons/AntDesign"
import { getaudio } from "./getstreamlinks";
import TrackPlayer,{ useTrackPlayerEvents ,Event,State,useProgress,RepeatMode} from "react-native-track-player";
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import TrackProgress from "../TrackProgress/TrackProgress";
import { usePlaybackState } from 'react-native-track-player';
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import { getstreaminglink } from "./getstreamlinks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
export default function Tracks({currentTrack,setCurrentTrack,seek, setSeek}){
    const location = useLocation();
    const navigate = useNavigate();
    const { position, duration } = useProgress(200);
    const playerState = usePlaybackState();
    const isPlaying = playerState === State.Playing;
    const [album_tracks,setAlbumTracks] = useState(location.state);
    const [loadingaudio,setLoadingAudio] = useState(false)
    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appState.current);
    const [final_tracks,setFinalTracks] =useState([])
    const [hasNavigated,setHasNavigated] = useState([]);
    const [preload,setPreload] = useState(false);
    const [totalpromises,setTotalPromises] = useState(0);
    const [completedpromises,setCompletedPromises] = useState(0);


    const loadsongs = async() =>{
        setLoadingAudio(true)
        await TrackPlayer.setRepeatMode(RepeatMode.Queue);
        let doneCount = 0;
        const promises = album_tracks.map(async(album_track) =>{
            try{
                let streaming_link = await getstreaminglink(album_track)
                //console.log(streaming_link)
                doneCount++; 
                //console.log(doneCount)
                setCompletedPromises(doneCount)
                return({album_id:album_track.album_id,album_name:album_track.album_name,thumbnail:album_track.thumbnail,isActive:true,id:album_track.id,url:streaming_link,title:album_track.name,artist_id:album_track.artist_id,artist:album_track.artist,artwork:album_track.thumbnail})
            }
            catch{
                return({album_id:album_track.album_id,album_name:album_track.album_name,thumbnail:album_track.thumbnail,isActive:true,id:album_track.id,url:"error",title:album_track.name,artist_id:album_track.artist_id,artist:album_track.artist,artwork:album_track.thumbnail})
            }

        })
        setTotalPromises(promises.length)
          
        const final_tracks_prom = await Promise.all(promises)
        console.log("done")
        //console.log(album_tracks)
        
        let album_order = album_tracks.map((value,index) =>{return({"order":index,"id":value.id})})
        function customSort(a, b) {
            //console.log(album_order)
            const orderA = album_order.find(item => item.id === a.id).order;
    
            const orderB = album_order.find(item => item.id === b.id).order;
        
            return orderA - orderB;
        }

       
        let final_track_fin = final_tracks_prom.sort(customSort);
        
        await AsyncStorage.setItem(final_track_fin[0].album_name,JSON.stringify(final_track_fin))
        setLoadingAudio(false)
        return final_track_fin
    }


    const preloadallsongs = async () =>{
        let queue  = await TrackPlayer.getQueue();
        let cached_tracks = await AsyncStorage.getItem(album_tracks[0].album_name)
        console.log(album_tracks)
        if (cached_tracks){

 
            


        }
        else{
            if (queue.length !== 0) {
                //console.log(queue[0].album_id !== album_tracks[0].album_id)
            if (queue[0].album_id !== album_tracks[0].album_id ){
                console.log("hi")
                let final = await loadsongs()

                await TrackPlayer.reset();
                await TrackPlayer.add(final);
                await TrackPlayer.play();
                
            }
            //await TrackPlayer.seekTo(0)
    
        }
        else if (queue.length === 0){
            let final = await loadsongs()
            await TrackPlayer.reset();
            await TrackPlayer.add(final)
            await TrackPlayer.play();
        }
        }
        
   

    }
    const startpreload = async () =>{
        //  favouritecards={favouritecards} spotifyid={album.id}thumbnail={album.images[0].url} album_name={album.name} artist_name={album.artists[0].name} total_tracks={album.total_tracks} release_date={album.release_date} album_type={album.album_type}
        let album_card = {"name":album_tracks[0].album_name,"id":album_tracks[0].album_id,"images":[{"url":album_tracks[0].thumbnail}],"artists":[{"name":album_tracks[0].artist}],"album_type":"ALBUM"}
        await AsyncStorage.setItem(`album-recent-load:${album_tracks[0].artist}_${album_tracks[0].album_name}`,JSON.stringify(album_card)) 
        await AsyncStorage.removeItem(album_tracks[0].album_name)
        let final = await loadsongs()

        await TrackPlayer.reset();
        await TrackPlayer.add(final);
        await TrackPlayer.play();
    }
    useEffect(()=>{
        preloadallsongs()
    },[])
    const navartistprofile = async () =>{
        //await AsyncStorage.setItem(`artist:${album_tracks[0].artist_name}`,JSON.stringify({"artist_id":album_tracks[0].artist_id}))
        navigate("/artistprofile",{state:album_tracks})
    }

    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
            <View style={{flexDirection:"row"}}>
            <TouchableOpacity style={{flex:1}} onPress={() =>{navigate(-1)}}>
            <AntDesign name="arrowleft" style={{fontSize:30}}/>
            </TouchableOpacity>
            {loadingaudio === true &&
            <View >

            
            <View style={{width:50,height:3,backgroundColor:"white"}}>
            <View style={{width:`${(completedpromises/totalpromises)*100}%`,height:3,backgroundColor:"blue"}}></View>
            </View>
            <Text style={{fontSize:10,justifyContent:"flex-end"}}>{completedpromises}/{totalpromises}</Text>
            </View>
                      }
            </View>

            
 
            <TouchableOpacity onPress={() =>{navartistprofile()}} onLongPress={() =>{startpreload()}} style={{justifyContent:"center",alignItems:"center",flex:0.4}}>
                <Image style={{width: 175, height: 175}} source={{uri:album_tracks[0].thumbnail}}></Image>

            </TouchableOpacity>

            <View style={{flex:0.1,justifyContent:"center",alignItems:"center"}}>
                    <Text style={{color:"white",fontSize:20}}>{album_tracks[0].album_name}</Text>
            </View>
            <FlatList 
            data={album_tracks}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item,index}) =><TrackItem index={index} setCurrentTrack={setCurrentTrack} album_track={item}/>}
            />
            <ShowCurrentTrack/>
            <TrackProgress  seek={seek} setSeek={setSeek}/>
  
            <NavigationFooter currentpage={"home"}/>
        </View>
    )

}