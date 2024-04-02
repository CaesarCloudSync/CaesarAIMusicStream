import { View,Text, ScrollView, FlatList,Image,SafeAreaView} from "react-native";

import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { useEffect, useState } from "react";
export default function Home(){
    const [initialfeed,setInitialFeed] = useState([]);
    const [initialrnb,setInitialRNB] = useState([]);
    const [initialhiphop,setInitialHipHop] = useState([]);
    const favouriteplaylists = [{"playlist_thumbnail":"https://t2.genius.com/unsafe/340x340/https%3A%2F%2Fimages.genius.com%2F49278979817c9ea4b28d39251a032c03.1000x1000x1.jpg","playlist_name":"PlayBoy","playlist_link":"https://"},
    {"playlist_thumbnail":"https://t2.genius.com/unsafe/340x340/https%3A%2F%2Fimages.genius.com%2F49278979817c9ea4b28d39251a032c03.1000x1000x1.jpg","playlist_name":"PlayBoy","playlist_link":"https://"},
    {"playlist_thumbnail":"https://t2.genius.com/unsafe/340x340/https%3A%2F%2Fimages.genius.com%2F49278979817c9ea4b28d39251a032c03.1000x1000x1.jpg","playlist_name":"PlayBoy","playlist_link":"https://"},
    {"playlist_thumbnail":"https://t2.genius.com/unsafe/340x340/https%3A%2F%2Fimages.genius.com%2F49278979817c9ea4b28d39251a032c03.1000x1000x1.jpg","playlist_name":"PlayBoy","playlist_link":"https://"},
    {"playlist_thumbnail":"https://t2.genius.com/unsafe/340x340/https%3A%2F%2Fimages.genius.com%2F49278979817c9ea4b28d39251a032c03.1000x1000x1.jpg","playlist_name":"PlayBoy","playlist_link":"https://"},
    {"playlist_thumbnail":"https://t2.genius.com/unsafe/340x340/https%3A%2F%2Fimages.genius.com%2F49278979817c9ea4b28d39251a032c03.1000x1000x1.jpg","playlist_name":"PlayBoy","playlist_link":"https://"},
    {"playlist_thumbnail":"https://t2.genius.com/unsafe/340x340/https%3A%2F%2Fimages.genius.com%2F49278979817c9ea4b28d39251a032c03.1000x1000x1.jpg","playlist_name":"PlayBoy","playlist_link":"https://"},
    {"playlist_thumbnail":"https://t2.genius.com/unsafe/340x340/https%3A%2F%2Fimages.genius.com%2F49278979817c9ea4b28d39251a032c03.1000x1000x1.jpg","playlist_name":"PlayBoy","playlist_link":"https://"}]
    const get_access_token = async () =>{
        // https://api.spotify.com/v1/browse/new-releases
        const body = {
            "grant_type":"client_credentials",
            "client_id": "4eb4425aaa3f4b299e278b30fb9cf329",//"50c42d50290a46f7b9f118c1ca4f8f58",
            "client_secret":"88b3038a35424fb8831c8b77022aa748"//"f0319982991b4e2ea1677201caf8e4f9"
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
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=26', {headers: headers})
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
    console.log(chunks)
    setInitialHipHop(chunks)
    //console.log(feedresult)

}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


    function FavouritePlaylists({favouritecards,playlists}){
        return(
            <View style={{justifyContent: 'center',marginTop:10}}>
            <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
                
                    {playlists.map((album) =>{
                        return(
                            <View style={{backgroundColor:"#141212",width:100,height:favouritecards ? 50 : 300,borderRadius: 5,borderWidth: 3,flexBasis:"47%",margin:5,borderColor:"#141212"}}>
                            <View  key={album.name} style={{backgroundColor:"#141212",flexDirection:favouritecards === true ? "row":"column",justifyContent:favouritecards === true ? "center":"flex-start",alignItems:favouritecards === true ? "center": "stretch",flex:1}}>
                                <View style={{flex:favouritecards ? 0.5 : 1}}>
                                    <Image style={{width: '100%', height: '100%'}} source={{uri:album.images[0].url}}></Image>
                                </View>
                                <View style={{padding:10}}>
                                </View>
                                {favouritecards === false &&
                                    <Text>
                                    Artist: {album.artists[0].name}
                                    </Text>}

                    
                                <Text style={{color:"white",flex:favouritecards ? 1 : 0.2}}>
                                    {album.name} | {capitalizeFirstLetter(album.album_type)}
                                </Text>
                            


                            </View>
                            
                        </View>
                        
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
                renderItem={({item}) =>{console.log(item);return(    <View style={{backgroundColor:"white",width:300,height:favouritecards ? 50 : 300,borderRadius: 5,borderWidth: 3,flexBasis:"47%",margin:5,borderColor:"#141212"}}>

                
                </View>)}}
                />
                

            </View>
        </SafeAreaView>
        )
    }
    const getall = async () =>{
        await getintialfeed()
        await getinitialrnb()
        //await getinitialhiphop()
    }
    useEffect(() =>{
        getall()
       
    
    },[])
    return(
        <View style={{flex:1}}>
            {/*Header */}
            <View  style={{flex:0.15,backgroundColor:"green"}}>

            </View>
            {/*Main Scroll Body*/}
            <ScrollView style={{flex:1,backgroundColor:"#141212"}}>
                {/* Favourite Playlists */}
                {initialfeed.length > 0 && <FavouritePlaylists favouritecards={true} playlists={initialfeed.slice(0,8)}/>}
                
                <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest Playlists</Text>
                </View>
                {initialfeed.length > 0 && <FavouritePlaylists favouritecards={false} playlists={initialfeed.slice(8,)}/>}
                <View style={{flex:1}}>
                    <Text style={{margin:15,fontSize:23,color:"white",fontWeight: 'bold'}}>Latest RnB and HipHop</Text>
                </View>
                
                {initialrnb !== undefined && initialrnb.length > 0 && 
                initialrnb.map((rnbcarousel) =>{
                    return(
                        <FavouriteRecommendations favouritecards={false} playlists={rnbcarousel}/>
                    )
                })

                }



 

            </ScrollView>
            {/*Song Progress Tracker */}
            <View style={{flex:0.10,backgroundColor:"red"}}>

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