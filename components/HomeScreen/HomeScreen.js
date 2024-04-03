import { View,Text, ScrollView, FlatList,Image,SafeAreaView} from "react-native";

import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";

import TrackProgress from "../TrackProgress/TrackProgress";
import FavouriteItem from "./FavouriteItem";
import { get_access_token } from "../access_token/getaccesstoken";
import {FavouritePlaylists,FavouriteRecommendations} from "./FavouriteRenders";
export default function Home({seek, setSeek}){
    const [initialfeed,setInitialFeed] = useState([]);
    const [initialrnb,setInitialRNB] = useState([]);
    const [initialhiphop,setInitialHipHop] = useState([]);
    const [access_token,setAccessToken] = useState("")


    const getintialfeed = async () =>{

        //console.log(result)
        // https://api.spotify.com/v1/browse/new-releases
        const access_token = await get_access_token();
        setAccessToken(access_token)
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=14', {headers: headers})
        const feedresult = await resp.json()
        //console.log(feedresult.albums.items)
        setInitialFeed(feedresult.albums.items)

}
const chunkcards = (arr) =>{
    const chunkSize = 6;
    const chunks = [];

    for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    chunks.push(chunk);
    }
    return chunks
}
const getinitialrnb = async () =>{
    const access_token = await get_access_token();
    const headers = {Authorization: `Bearer ${access_token}`}
    const resp = await fetch('https://api.spotify.com/v1/recommendations?limit=50&seed_genres=r-n-b&seed_artists=2h93pZq0e7k5yf4dywlkpM,31W5EY0aAly4Qieq6OFu6I,2jku7tDXc6XoB6MO2hFuqg', {headers: headers})
    const feedresult = await resp.json()
   // console.log(feedresult)
    const chunks = chunkcards(feedresult.tracks)
   //console.log(chunks)
    setInitialRNB(chunks)
    //console.log(feedresult)

}
const getinitialhiphop = async () =>{
    const access_token = await get_access_token();
    const headers = {Authorization: `Bearer ${access_token}`}
    const resp = await fetch('https://api.spotify.com/v1/recommendations?limit=50&seed_genres=hip-hop&seed_artists=2P5sC9cVZDToPxyomzF1UH,5K4W6rqBFWDnAN6FQUkS6x,6U3ybJ9UHNKEdsH7ktGBZ7', {headers: headers})
    const feedresult = await resp.json()
   // console.log(feedresult)
    const chunks = chunkcards(feedresult.tracks)
    
    setInitialHipHop(chunks)
    //console.log(feedresult)

}



    const getall = async () =>{
        await getintialfeed()
        await getinitialrnb()
        await getinitialhiphop()
    }
    useEffect(() =>{
        getall()
       
    
    },[])
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
            {/*Main Scroll Body*/}
            <ScrollView style={{flex:1,backgroundColor:"#141212"}}>
                {/* Favourite Playlists */}
                {initialfeed.length > 0 && access_token !== ""  && <FavouritePlaylists access_token={access_token} favouritecards={true} playlists={initialfeed.slice(0,8)}/>}
                {initialfeed.length > 0 && access_token !== ""  &&
                <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest Playlists</Text>
                </View>
                }
                {initialfeed.length > 0 && access_token !== ""  && <FavouritePlaylists access_token={access_token} favouritecards={false} playlists={initialfeed.slice(8,)}/>}

                {initialfeed.length > 0 && access_token !== ""  && 
                <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest RnB and HipHop</Text>
                </View>
                }
                
                {initialrnb.length > 0 && access_token !== ""  && 
                initialrnb.map((rnbcarousel) =>{
                    return(
                        <FavouriteRecommendations access_token={access_token}  playlists={rnbcarousel}/>
                    )
                })

                }
                {initialhiphop.length > 0 && access_token !== "" && <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest HipHop</Text>
                </View>}
                {initialhiphop.length > 0 && access_token !== ""   && 
                initialhiphop.map((hiphopcarousel) =>{
                    return(
                        <FavouriteRecommendations access_token={access_token}  playlists={hiphopcarousel}/>
                    )
                })

                }



 

            </ScrollView>
            {/*Song Progress Tracker */}
            <View style={{flex:0.08,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                <TrackProgress seek={seek} setSeek={setSeek}/>

            </View>

            {/*Navigation Footer*/}
            <NavigationFooter currentpage={"home"}/>


 
        </View>
    )
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