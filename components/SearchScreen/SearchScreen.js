import { View,Text, ScrollView, FlatList,Image,TextInput, StatusBar,Pressable} from "react-native";
import { useState,useEffect} from "react";
import TrackProgress from "../TrackProgress/TrackProgress";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { get_access_token } from "../access_token/getaccesstoken";
import { FavouritePlaylists } from "../HomeScreen/FavouriteRenders";
import AntDesign from "react-native-vector-icons/AntDesign"
import axios from "axios";
import * as MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNetInfo} from "@react-native-community/netinfo";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { FavouriteSearchPlaylists } from "../HomeScreen/FavouriteRenders";
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Directions } from 'react-native-gesture-handler';
import ArtistCarouselItem from "../HomeScreen/ArtistCarouselItem";

export default function Search({seek, setSeek}){
    const netInfo = useNetInfo()
    const [text, onChangeText] = useState("")
    const [access_token,setAccessToken] = useState("");
    const [initialfeed,setInitialFeed] = useState([]);
    const [songs,setSongs] = useState([]);
    const [artists,setArtists] = useState([]);
    const [recent_artists,setRecentArtists] = useState([]);
    const [recent_removed,setRecentRemoved] = useState(false)
    const [recentalbums,setRecentAlbums] = useState([])

    const fling = Gesture.Fling().direction(Directions.DOWN)
    .onStart((e) => {
      setSongs([])
    });
    const createxpiration = async () =>{
        const storageExpirationTimeInMinutes = 60; // in this case, we only want to keep the data for 30min
        //console.log(storageExpirationTimeInMinutes)
        
        let dt= new Date()
        dt = new Date(dt.getTime() + storageExpirationTimeInMinutes * 60 * 1000)
    
      
    
        // store the data with expiration time in there
        await AsyncStorage.setItem(
          "storageWithExpiry",
          dt.toISOString()
        );
    }
    

    const getinitialrnb = async (access_token) =>{
       
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch('https://api.spotify.com/v1/recommendations?limit=50&seed_genres=r-n-b&seed_artists=2h93pZq0e7k5yf4dywlkpM,31W5EY0aAly4Qieq6OFu6I,2jku7tDXc6XoB6MO2hFuqg', {headers: headers})
        const feedresult = await resp.json()

        const result = feedresult.tracks.map((album) =>{return({"id":album.album.id,"name":album.album.name,"images":[{"url":album.album.images[0].url}],"artists":[{"name":album.album.artists[0].name}],"total_tracks":album.album.total_tracks,"release_date":album.album.release_date,"album_type":album.album.album_type})})

        setInitialFeed(result)
        await AsyncStorage.setItem("initial_search_rnb",JSON.stringify(result))
        
        //console.log(feedresult)

    }
    const searchsongs = async () =>{
        const headers = {Authorization: `Bearer ${access_token}`}
        //console.log(text)
        const resp = await fetch(`https://api.spotify.com/v1/search?q=${text}&limit=50&type=artist,album,track`, {headers: headers})
        const feedresult = await resp.json()
        const artists = feedresult.artists.items.map((artist) =>{console.log(artist.images);return({"artist_id":artist.id,"images":artist.images,"name":artist.name})})
        const result = feedresult.albums.items.map((album) =>{return({"id":album.id,"name":album.name,"images":[{"url":album.images[0].url}],"artists":[{"name":album.artists[0].name}],"total_tracks":album.total_tracks,"release_date":album.release_date,"album_type":album.album_type})})
        setSongs(result)
        //console.log(artists)

        setArtists(artists)
        //toggleModal()
    }
    function parseISOString(s) {
        var b = s.split(/\D+/);
        return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
      }
    
    const getinitialrnbfeed = async () =>{

        let savedData = await AsyncStorage.getItem(
            "storageWithExpiry"
          );
         
        //console.log(savedData)
        
        const currentTimestamp = new Date().toISOString()
        //console.log(parseISOString(currentTimestamp),parseISOString(savedData))
        //console.log(parseISOString(currentTimestamp) >= parseISOString(savedData))
        if (savedData != null){
            if (parseISOString(currentTimestamp) >= parseISOString(savedData)) {
                await AsyncStorage.removeItem("storageWithExpiry");
                await AsyncStorage.removeItem("initial_search_rnb")
                
      
         
              }
        }
        else{
            await AsyncStorage.removeItem("storageWithExpiry");
            await AsyncStorage.removeItem("initial_search_rnb")
        }

        
        const access_token = await get_access_token();
          
        setAccessToken(access_token)
        
        let cache_initial = await AsyncStorage.getItem("initial_search_rnb")
        if (!cache_initial){
            await getinitialrnb(access_token)
            await createxpiration()
        }
        else{
            //console.log(cache_initial)

            setInitialFeed(JSON.parse(cache_initial))
        }
    }
    const get_recent_artists = async () =>{
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("artist:"))}))
        //console.log(items)
        setRecentArtists(items)
    }
    const get_recent_albums = async () =>{
        let keys = await AsyncStorage.getAllKeys()
        const items = await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("album-recent-load:"))}))
 
        const albumsitems = items.map((item) =>{return(JSON.parse(item[1]))}).filter((item) =>{return(item !== null)})

        setRecentAlbums(albumsitems)
    }
    useEffect(() =>{
        if (netInfo.isInternetReachable === true){
            
            getinitialrnbfeed()
            get_recent_albums()
            get_recent_artists()
        }


    },[netInfo])
    useEffect(()=>{
        get_recent_artists()
        
    },[recent_removed])
    useEffect(()=>{
        get_recent_albums()
    },[recentalbums])


    if (netInfo.isInternetReachable){
        //console.log(recentalbums)
    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>
            {/*Header */}
            <View  style={{flex:0.18,backgroundColor:"green",flexDirection:"row",backgroundColor:"#141212"}}>
                <View style={{flex:1, margin: 12,padding: 10,flexDirection:"row"}}>
                <View style={{backgroundColor:"white",justifyContent:"center",alignItems:"center",height:40,borderBottomLeftRadius:10,borderTopLeftRadius:10}}>
                    <AntDesign name="search1" style={{color:"black",padding:10}}/>
                </View>
                <TextInput
                onSubmitEditing={() =>{searchsongs()}}
                placeholder="What song would you like to listen to?"
                placeholderTextColor={'black'}
         
                style={ {
                    height: 40,
                    flex:1,
                    borderBottomRightRadius:10,borderTopRightRadius:10,
   
                    backgroundColor:"white",
                    color:"black"
                  }}
                onChangeText={onChangeText}
                value={text}
            />
                
                </View>
                <View style={{flex:0.13,margin:1,marginTop:22,marginRight:10}}>
                <Image style={{width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                </View>

            </View>
            {/*Main Scroll Body*/}
            <ScrollView style={{flex:1,backgroundColor:"#141212"}}>
            {recentalbums.length > 0 && access_token !== ""  && 
            <View>
            <Text  style={{marginLeft:10}}>Recent Albums</Text>
            <FavouritePlaylists access_token={access_token} favouritecards={true} playlists={recentalbums} recentalbums={recentalbums} setRecentAlbums={setRecentAlbums}/>
            </View>}

            {recent_artists.length > 0 && access_token !== ""  && <View style={{width:"100%"}}>
                <Text style={{marginLeft:10}}>Recent Artists</Text>
                <View style={{alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
                {recent_artists.map((artisttuple,index) =>{
                            let artistitems = JSON.parse(artisttuple[1])
                                return(
                            
                                    <ArtistCarouselItem key={index} favouritecards={true} artist_id={artistitems.artist_id}thumbnail={artistitems.thumbnail} artist_name={artistitems.artist_name} recent_removed={recent_removed} setRecentRemoved={setRecentRemoved} />
                                
                                )
                            


                        })}
                </View>

            </View>}
                
            {initialfeed.length > 0 && access_token !== ""  && 
            <View>
            <Text  style={{marginLeft:10}}>Latest Albums</Text>
            <FavouritePlaylists access_token={access_token} favouritecards={true} playlists={initialfeed}/>
            </View>}

            </ScrollView>
            <ShowCurrentTrack searchscreen={true}/>
            {/*Song Progress Tracker */}
            <View style={{flex:0.08,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                <TrackProgress seek={seek} setSeek={setSeek}/>

            </View>
                  
            {/*Navigation Footer*/}
            <NavigationFooter currentpage={"search"}/>
            {songs.length !== 0 && artists.length !== 0 &&
            <View style={{position:"absolute",height:550,width:"100%",backgroundColor:"#161616",bottom:0,borderTopLeftRadius:10,borderTopRightRadius:10}}>
                <GestureDetector gesture={fling}>
                <View style={{width:"100%",justifyContent:"center",alignItems:"center"}}>
                <View style={{height:10,width:75,backgroundColor:"#d3d3d3",marginTop:20,borderRadius:10}}></View>
                <Text style={{fontSize:25}}>CaesarAIMusic Search</Text>
                </View>
                
                
                </GestureDetector>
   
            <FavouriteSearchPlaylists artists={artists} access_token={access_token} favouritecards={true} playlists={songs}/> 



            </View>}
            
          


 
        </View>
    )}
    else{
        return(
            <View style={{flex:1}}>
                {/*Header */}
                <View  style={{flex:0.08,backgroundColor:"green",flexDirection:"row",backgroundColor:"#141212"}}>
                    <View style={{flex:1,margin:10}}>
                    <Text style={{fontSize:20}}>CaesarAIMusicStream</Text>
                    
                    </View>
                    <View style={{flex:0.13,margin:10}}>
                    <Image style={{width:44,height:39}} source={require('../../assets/CaesarAILogo.png')} />
                    </View>

                </View>
                {/* No Internet Main Body */}
                <View style={{flex:1,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                    <Text style={{fontSize:30}}>No Internet Connection</Text>
                    <Text>
                    Play your Downloads
                    </Text>
                </View>

                {/*Song Progress Tracker */}
                
                <View style={{flex:0.08,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                    <TrackProgress seek={seek} setSeek={setSeek}/>

                </View>

                {/*Navigation Footer*/}
                <NavigationFooter currentpage={"search"}/>

            </View>
        )
        
    }
}