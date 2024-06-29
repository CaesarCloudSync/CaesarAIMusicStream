import { View,Text, ScrollView, FlatList,Image, Button} from "react-native";

import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TrackProgress from "../TrackProgress/TrackProgress";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import { get_access_token } from "../access_token/getaccesstoken";

import { TouchableHighlight } from "react-native";
import PlaylistCard from "./PlaylistCard";
import { TextInput } from "react-native-gesture-handler";
import AntDesign from "react-native-vector-icons/AntDesign"
import ShowQueue from "../ShowQueue/showqueue";
export default function PlaylistScreen({seek, setSeek}){
    const [userInput,setUserInput] = useState("");
    const [playlistalbums,setPlaylistItems] = useState([]);
    const [playlistchanged,setPlaylistChanged] = useState(false)
    const [access_token,setAccessToken] = useState("");
    const getplaylist = async () =>{
        const access_token = await get_access_token()
        setAccessToken(access_token)
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("playlist:"))}))
        const playlistitems = items.map((item) =>{return(JSON.parse(item[1]))})
        setPlaylistItems(playlistitems)
    }

    useEffect(() =>{
        getplaylist()
    },[playlistchanged])
    const filterData = (item,index) =>{
        //console.log(item,"hi")
        // {"playlist_name": "Jam", "playlist_size": 1, "playlist_thumbnail": "https://i.scdn.co/image/ab67616d0000b2733b9f8b18cc685e1502128aa8"} 
        if (userInput === ""){
            return(<PlaylistCard key={index} playlist={item} index={index} playlistchanged={playlistchanged} setPlaylistChanged={setPlaylistChanged} />)
        }
       
        if (item.playlist_name.toLowerCase().includes(userInput.toLowerCase())){
            return(
                <PlaylistCard key={index} playlist={item} index={index} playlistchanged={playlistchanged} setPlaylistChanged={setPlaylistChanged} />
            )
        } 

    }
    const setplaylistnamesineachtrack = async () =>{
        let keys = await AsyncStorage.getAllKeys()
  
        let playlists = keys.filter((key) =>{return(key.includes(`playlist:`))}).map((val)=>{return(val.split(":").slice(-1)[0])})
        const promises = playlists.map(async (name)=>{
            const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`playlist-track:${name}`))}))
            const playlist_tracks = items.map((item) =>{return(JSON.parse(item[1]))})
            let new_playlist_tracks = playlist_tracks.map((item) =>{item["playlist_local"] ="true";return([ `playlist-track:${name}-${item.name}`,JSON.stringify(item)])})
            console.log(new_playlist_tracks[0])
            await AsyncStorage.multiSet(new_playlist_tracks)
        })
        await Promise.all(promises)
        console.log("done")
        //const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`playlist-track:${currentTrack.playlist_name}`))}))
        //const playlist_tracks = items.map((item) =>{return(JSON.parse(item[1]))})
    }
    const add_to_summer = async () =>{
        let playlist_nake = "New Amari Sleep"
        const val = await AsyncStorage.getItem(`playlist-track:${playlist_nake}-White Ferrari`)
        console.log(val)
        // {"album_id":"3mH6qwIy9crq0I9YQbOuDf","album_name":"Blonde","name":"White Ferrari","id":"2LMkwUfqC6S6s6qDVlEuzV","artist":"Frank Ocean","artist_id":"2h93pZq0e7k5yf4dywlkpM","thumbnail":"https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be9d5526","track_number":14,"duration_ms":248807,"playlist_name":"New Amari Sleep","playlist_local":"true"}
        const summer_songs_json = await AsyncStorage.getItem("summer_songs")
        const summer_songs_unf = JSON.parse(summer_songs_json)
        const summer_songs = summer_songs_unf.map((song) =>{return(song.name.replace(".mp3",""))})

        //console.log(summer_songs)
        let total = summer_songs.length
        const promises = summer_songs.map(async (song_name,index) =>{

            const headers = {Authorization: `Bearer ${access_token}`}
            //console.log(text)
            const resp = await fetch(`https://api.spotify.com/v1/search?q=${song_name}&limit=1&type=track`, {headers: headers})
            const feedresult = await resp.json()
            let song_data = feedresult.tracks.items[0]
            //console.log(song_data)
            let playlist_nake = "New Amari Summer"
            let song_json = {"album_id":song_data.album.id,"album_name":song_data.album.name,"name":song_data.name,"id":song_data.id,"artist":song_data.artists[0].name,"artist_id":song_data.artists[0].id,"thumbnail":song_data.album.images[0].url,"track_number":song_data.track_number,"duration_ms":song_data.duration_ms,"playlist_name":"New Amari Summer","playlist_local":"true"} 
            //{"album_id": song_data.album.id,"artist":song_data.artists[0].name,"artist_id":song_data.artists[0].id,"duration_ms":song_data.duration_ms,"id":song_data.id,"name":song_data.name,"playlist_local": "true","playlist_name": "${playlist_nake}","thumbnail":song_data.album.images[0].url,"track_number": song_data.track_number}
            
    
            await AsyncStorage.setItem(`playlist-track:${playlist_nake}-${song_data.name}`,JSON.stringify(song_json))
            await AsyncStorage.setItem(`playlist:${playlist_nake}`,JSON.stringify({"playlist_name":playlist_nake,"playlist_thumbnail":"file:///data/user/0/com.myorg.caesaraimusic/files/image_1719686373879.jpg","playlist_size":index+1}))
            await AsyncStorage.setItem(`playlist-track-order:${playlist_nake}-${song_data.name}`,JSON.stringify({"name":song_data.name,"order":index}))
            console.log(index,"/",total)
        })  
        await Promise.all(promises)
        //await AsyncStorage.removeItem("summer_songs")
        


    }
    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
            {/*Header */}
            <View  style={{flex:0.08,backgroundColor:"green",flexDirection:"row",backgroundColor:"#141212"}}>
                    <View style={{flex:1,margin:10}}>
                    <Text style={{fontSize:20}}>CaesarAIMusicStream</Text>
                    
                    </View>
                    <View style={{flex:0.13,margin:10}}>
                    <Image style={{borderRadius:5,width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                    </View>

            </View>
            <View style={{flexDirection:"row",margin:10}}>
            <AntDesign style={{position:"relative",top:18}} name="filter"/>
            <TextInput style={{width:"100%"}} placeholder="Enter Here" onChangeText={(text) =>{setUserInput(text)}}/>
            </View>
            {/*Main Scroll Body*/}
            {playlistalbums.length > 0 && access_token !== ""  && 
            

            <FlatList 

            data={playlistalbums}
            style={{flex:1,backgroundColor:"#141212"}}
            renderItem={({item,index}) =>filterData(item,index)}
            />
    }
      

            {playlistalbums.length > 0 && access_token !== ""  && <ShowCurrentTrack searchscreen={true}/>}
            {playlistalbums.length > 0 && access_token !== "" && <ShowQueue/>}
            {playlistalbums.length > 0 && access_token !== ""  &&  <TrackProgress seek={seek} setSeek={setSeek}/>}
            {/*Navigation Footer*/}
            {playlistalbums.length === 0 && <View style={{flex:1}}></View>} 
           <NavigationFooter currentpage={"playlists"}/>


 
        </View>
    )
}