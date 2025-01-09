import { View,Text, ScrollView, FlatList,Image,SafeAreaView} from "react-native";

import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
import GenreItem from "./GenreItem";
import TrackProgress from "../TrackProgress/TrackProgress";
import FavouriteItem from "./FavouriteItem";
import { get_access_token } from "../access_token/getaccesstoken";
import {FavouriteAlbums,FavouriteRecommendations, FavouriteRecommendationsHomeScreen} from "./FavouriteRenders";
import {useNetInfo} from "@react-native-community/netinfo";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { json } from "react-router-native";
import ShowQueue from "../ShowQueue/showqueue";
export default function Home({seek, setSeek}){
    const netInfo = useNetInfo();
    const [initialfeed,setInitialFeed] = useState([]);
    const [initialrnb,setInitialRNB] = useState([]);
    const [initialhiphop,setInitialHipHop] = useState([]);
    const [access_token,setAccessToken] = useState("");
    const [genres,setGenres] = useState([]);
    const [randomcolors,setRandomColors] = useState([]);


    const getintialfeed = async (access_token) =>{

        //console.log(result)
        // https://api.spotify.com/v1/browse/new-releases

        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=14', {headers: headers})
        const feedresult = await resp.json()
        //console.log(feedresult.albums.items)
        await AsyncStorage.setItem("initial_feed",JSON.stringify(feedresult.albums.items))
        setInitialFeed(feedresult.albums.items)

}
const chunkcards = (arr,chunksizeval=6) =>{
    const chunkSize = chunksizeval;
    const chunks = [];

    for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    chunks.push(chunk);
    }
    return chunks
}
const getinitialrnb = async (access_token) =>{

    const headers = {Authorization: `Bearer ${access_token}`}
    const resp = await fetch('https://api.spotify.com/v1/browse/new-releases?offset=15&limit=48', {headers: headers})
    const feedresult = await resp.json()
    const chunks = chunkcards(feedresult.albums.items)
    await AsyncStorage.setItem("initial_rnb",JSON.stringify(chunks))
    setInitialRNB(chunks)
    //console.log(feedresult)

}
const getinitialhiphop = async (access_token) =>{
    const headers = {Authorization: `Bearer ${access_token}`}
    const resp = await fetch('https://api.spotify.com/v1/browse/new-releases?offset=60&limit=48', {headers: headers})
    const feedresult = await resp.json()
    const chunks = chunkcards(feedresult.albums.items)
    await AsyncStorage.setItem("initial_hiphop",JSON.stringify(chunks))
   
    setInitialHipHop(chunks)
    //console.log(feedresult)

}
const generaterandomcolors = (array) =>{
    const colors = [];

    for (let i = 0; i < array.length; i++) {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    colors.push(randomColor);
    }

    return colors
}
const getgenrefeed = async (access_token) =>{
    const headers = {Authorization: `Bearer ${access_token}`}
    const resp = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {headers: headers})
    const feedresult = await resp.json()
    const chunks = chunkcards(feedresult.genres,chunksizeval=20);

    await AsyncStorage.setItem("genres",JSON.stringify(chunks))

    setGenres(chunks)
   

}

const createxpiration = async () =>{
    const storageExpirationTimeInMinutes = 120; // in this case, we only want to keep the data for 30min
    console.log(storageExpirationTimeInMinutes)
    
    let dt= new Date()
    dt = new Date(dt.getTime() + storageExpirationTimeInMinutes * 60 * 1000)

  

    // store the data with expiration time in there
    await AsyncStorage.setItem(
      "storageWithExpiry",
      dt.toISOString()
    );
}
function parseISOString(s) {
    var b = s.split(/\D+/);
    return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
  }


    const getall = async () =>{
        


        let savedData = await AsyncStorage.getItem(
            "storageWithExpiry"
          );
         
        console.log(savedData)
        
        const currentTimestamp = new Date().toISOString()

        // Remove the saved data if it expires.
        // Check if expiryTime exists with the optional chaining operator `?`
        // then, we check if the current ‘now’ time is still behind expiryTime
        // if not, it means the storage data has expired and needs to be removed

        if (savedData !== null){
            //console.log(parseISOString(currentTimestamp),parseISOString(savedData))
            //console.log(parseISOString(currentTimestamp) >= parseISOString(savedData))
        if (parseISOString(currentTimestamp) >= parseISOString(savedData)) {
          await AsyncStorage.removeItem("storageWithExpiry");
          await AsyncStorage.removeItem("initial_feed")
          await AsyncStorage.removeItem("initial_rnb")
          await AsyncStorage.removeItem("initial_hiphop")
          let keys = await AsyncStorage.getAllKeys()
          await AsyncStorage.multiRemove(keys.filter((key) =>{return(key.includes("album:"))}))
        
   
        }
        }
        else{
            await AsyncStorage.removeItem("storageWithExpiry");
            await AsyncStorage.removeItem("initial_feed")
            await AsyncStorage.removeItem("initial_rnb")
            await AsyncStorage.removeItem("initial_hiphop")
            let keys = await AsyncStorage.getAllKeys()
            await AsyncStorage.multiRemove(keys.filter((key) =>{return(key.includes("album:"))}))
        }
        

        const access_token = await get_access_token();
        setAccessToken(access_token)
        
        let cache_initial = await AsyncStorage.getItem("initial_feed")
        if (!cache_initial){
            console.log("hellom")
            await getintialfeed(access_token)
            await createxpiration()
        
        }
        else{
            //console.log(cache_initial)
            setInitialFeed(JSON.parse(cache_initial))
        }
        //await AsyncStorage.removeItem("initial_rnb")
        let cache_rnb = await AsyncStorage.getItem("initial_rnb")
        console.log(JSON.parse(cache_rnb)[0][0].id)
        if (!cache_rnb){
            await getinitialrnb(access_token)
        }
        else{
            setInitialRNB(JSON.parse(cache_rnb))
        }
        //await AsyncStorage.removeItem("initial_hiphop")
        let cache_hiphop = await AsyncStorage.getItem("initial_hiphop")
        if (!cache_hiphop){
            await getinitialhiphop(access_token)
        }
        else{
            setInitialHipHop(JSON.parse(cache_hiphop))
        }
        await AsyncStorage.removeItem("genres")
        let cache_genre = await AsyncStorage.getItem("genres")
        const randomcolors = [
            "#3F00BA", "#3200C6", "#2500D2", "#D90025", "#CC0031",
            "#7F007C", "#720088", "#A50056", "#990063", "#8C006F",
            "#3F00BA", "#3200C6", "#650094", "#5900A1", "#4C00AD",
            "#008000", "#006600", "#004C00", "#003300", "#001900"
        ]
        setRandomColors(randomcolors)
        
        if (!cache_genre){
            await getgenrefeed(access_token)
        }
        else{
            setGenres(JSON.parse(cache_genre))
        }
        

        
       
    }
    useEffect(() =>{
        //console.log(netInfo)
        if (netInfo.isInternetReachable === true){
            getall()
        }
       
    
    },[netInfo])
    if (netInfo.isInternetReachable === true){
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
            {/*Main Scroll Body*/}
            <ScrollView removeClippedSubviews={true} style={{flex:1,backgroundColor:"#141212"}}>
                {/* Favourite Playlists */}
                {initialfeed.length > 0 && access_token !== ""  && <FavouriteAlbums access_token={access_token} favouritecards={true} playlists={initialfeed.slice(0,8)}/>}
                {initialfeed.length > 0 && access_token !== ""  &&
                <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest Playlists</Text>
                </View>
                }
                {initialfeed.length > 0 && access_token !== ""  && <FavouriteAlbums access_token={access_token} favouritecards={false} playlists={initialfeed.slice(8,)}/>}

                {initialfeed.length > 0 && access_token !== ""  && 
                <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest RnB and HipHop</Text>
                </View>
                }
                
                {initialrnb.length > 0 && access_token !== ""  && 
                initialrnb.map((rnbcarousel) =>{
                    return(
                        <FavouriteRecommendationsHomeScreen access_token={access_token}  playlists={rnbcarousel}/>
                    )
                })

                }
                {initialhiphop.length > 0 && access_token !== "" && <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest HipHop</Text>
                </View>}
                {initialhiphop.length > 0 && access_token !== ""   && 
                initialhiphop.map((hiphopcarousel) =>{
                    return(
                        <FavouriteRecommendationsHomeScreen access_token={access_token}  playlists={hiphopcarousel}/>
                    )
                })

                }
                {genres.length > 0 && access_token !== "" &&
                genres.map((genrelist,indexlist) =>{
                    return(
                        <SafeAreaView style={{flex: 1,marginTop:10}}>
                     
                        <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
                            
                            <FlatList
                            data={genrelist}
                            horizontal={true}
                            renderItem={({item,index}) =><GenreItem genre={item} randomcolor={randomcolors[index]}/>}
                            />
                            
        
                        </View>
                    </SafeAreaView>
                    )

                })

                }


 

            </ScrollView>
                        {/*Song Progress Tracker */}
       
                <ShowCurrentTrack/>
                <ShowQueue/>

            
            {/*Song Progress Tracker */}
            <View style={{flex:0.018,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                <TrackProgress seek={seek} setSeek={setSeek}/>

            </View>

            {/*Navigation Footer*/}
            <NavigationFooter currentpage={"home"}/>


 
        </View>
    )
    }
    else{
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
                {/* No Internet Main Body */}
                <View style={{flex:1,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                    <Text style={{fontSize:30}}>No Internet Connection</Text>
                    <Text>
                    Play your Downloads
                    </Text>
                </View>
                {/*Song Progress Tracker */}
                <ShowCurrentTrack />
                <ShowQueue/>
                <TrackProgress seek={seek} setSeek={setSeek}/>

                {/*Navigation Footer*/}
                <NavigationFooter currentpage={"home"}/>

            </View>
        )
        
    }
}

/*
                <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest HipHop</Text>
                </View>
                {initialhiphop !== undefined && initialhiphop.length > 0 && 
                initialhiphop.map((hiphopcarousel) =>{
                    return(
                        <FavouriteRecommendations favouritecards={false} playlists={hiphopcarousel}/>
                    )
                })

                } */