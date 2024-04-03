import { View,Text, ScrollView, FlatList,Image,SafeAreaView} from "react-native";

import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
import CarouselItem from "./CarouselItem";
import TrackProgress from "../TrackProgress/TrackProgress";
import FavouriteItem from "./FavouriteItem";

export default function Home({seek, setSeek}){
    const [initialfeed,setInitialFeed] = useState([]);
    const [initialrnb,setInitialRNB] = useState([]);
    const [initialhiphop,setInitialHipHop] = useState([]);
    const [access_token,setAccessToken] = useState("")

    const get_access_token = async () =>{
        // https://api.spotify.com/v1/browse/new-releases
        const body = {
            "grant_type":"client_credentials",
            "client_id": "c688512a4a604b0e8c1ffa9d6e70cfd0",
            "client_secret":"91d8ca810ef048cfb69462bd8d2cd31a"
        }
        const formBody = Object.keys(body).map(key =>      encodeURIComponent(key) + '=' + encodeURIComponent(body[key])).join('&');
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },    
            body: formBody
        });
        const result = await response.json()
        return result.access_token
    }
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



    function FavouritePlaylists({favouritecards,playlists}){
        return(
            <View key={playlists[0].name} style={{justifyContent: 'center',marginTop:10}}>
            <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
                
                    {playlists.map((album) =>{
                        //console.log(album)
                        return(

                            <CarouselItem access_token={access_token} favouritecards={favouritecards} spotifyid={album.id}thumbnail={album.images[0].url} album_name={album.name} artist_name={album.artists[0].name} total_tracks={album.total_tracks} release_date={album.release_date} album_type={album.album_type}/>
                        
                        )
                    })}
                

            </View>
        </View>
        )
    }

    function FavouriteRecommendations({favouritecards,playlists}){
        return(
            <SafeAreaView style={{flex: 1,marginTop:10}}>
            <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
                
                <FlatList
                data={playlists}
                horizontal={true}
                renderItem={({item}) =><CarouselItem access_token={access_token} favouritecards={favouritecards} spotifyid={item.album.id}thumbnail={item.album.images[0].url} album_name={item.album.name} artist_name={item.album.artists[0].name} total_tracks={item.album.total_tracks} release_date={item.album.release_date} album_type={item.album.album_type}/>}
                />
                

            </View>
        </SafeAreaView>
        )
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
                {initialfeed.length > 0 && access_token !== ""  && <FavouritePlaylists favouritecards={true} playlists={initialfeed.slice(0,8)}/>}
                {initialfeed.length > 0 && access_token !== ""  &&
                <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest Playlists</Text>
                </View>
                }
                {initialfeed.length > 0 && access_token !== ""  && <FavouritePlaylists favouritecards={false} playlists={initialfeed.slice(8,)}/>}

                {initialfeed.length > 0 && access_token !== ""  && 
                <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest RnB and HipHop</Text>
                </View>
                }
                
                {initialrnb.length > 0 && access_token !== ""  && 
                initialrnb.map((rnbcarousel) =>{
                    return(
                        <FavouriteRecommendations  playlists={rnbcarousel}/>
                    )
                })

                }
                {initialhiphop.length > 0 && access_token !== "" && <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest HipHop</Text>
                </View>}
                {initialhiphop.length > 0 && access_token !== ""   && 
                initialhiphop.map((hiphopcarousel) =>{
                    return(
                        <FavouriteRecommendations  playlists={hiphopcarousel}/>
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