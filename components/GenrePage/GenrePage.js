import { useEffect, useState } from "react";
import { View ,Text, ScrollView, TouchableOpacity} from "react-native";
import { useLocation, useNavigate } from "react-router-native";
import AntDesign from "react-native-vector-icons/AntDesign"
import { FavouriteGenreRecommendations } from "../HomeScreen/FavouriteRenders";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import { get_access_token } from "../access_token/getaccesstoken";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import ShowQueue from "../ShowQueue/showqueue";
import TrackProgress from "../TrackProgress/TrackProgress";
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
export default function GenrePage({seek,setSeek}){
    const location = useLocation();
    const navigate = useNavigate();
    const [genre,setGenre] = useState(location.state?.genre);
    const [playlists,setPlaylists] = useState([]);
    const [songs,setSongs] = useState([]);
    const [tracks,setTracks] = useState([]);
    const [artists,setArtists] = useState([]);
    const [access_token,setAccessToken] = useState("");
    const searchsongs = async () =>{
        const access_token = await get_access_token();
        const headers = {Authorization: `Bearer ${access_token}`}
        //console.log(text)
        
        const resp = await fetch(`https://api.spotify.com/v1/search?q=${genre}&limit=50&type=artist,playlist`, {headers: headers})
        const feedresult = await resp.json()

        const artists = feedresult.artists.items.map((artist) =>{console.log(artist.images);return({"artist_id":artist.id,"images":artist.images,"name":artist.name})})
        console.log(feedresult.playlists.items)
        const playlists = feedresult.playlists.items.map((playlist) =>{let image = playlist.images[0] !== undefined ? playlist.images[0].url : "none";return({"id":playlist.id,"name":playlist.name,"images":[{"url":image}],"total_tracks":playlist.tracks.total,"album_type":playlist.type})})
        console.log("endo")
        setPlaylists(playlists)
        //console.log(artists)
        setArtists(artists)
        setAccessToken(access_token)
        //toggleModal()
    }
    useEffect(() =>{
        searchsongs()
    },[])
    return(
        <View style={{flex:1,backgroundColor:"#141212"}}>

            {access_token !== "" && <View style={{flex:0.2,justifyContent:"center",alignItems:"center"}}>
                <Text style={{fontSize:30}}>{capitalizeFirstLetter(genre)}</Text>
            </View>
            }
            {access_token !== "" &&  
            <View style={{flex:1}}>
                <FavouriteGenreRecommendations  access_token={access_token} favouritecards={true} albums={songs} playlists={playlists} artists={artists} />
                
            </View> }
                   
            {access_token !== "" && <ShowCurrentTrack/>}
            {access_token !== "" && <ShowQueue/>}
            {access_token !== "" &&
            <View style={{flex:0.018,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                <TrackProgress seek={seek} setSeek={setSeek}/>
            </View>
            }
            {access_token !== "" && <NavigationFooter currentpage={"search"}/>}
        </View>
    )
}