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
        try {
            const access_token = await get_access_token();
            const headers = {Authorization: `Bearer ${access_token}`}
            
            const getCleanSearchTerm = (g) => {
                const mapping = {
                    "rnb": 'r&b OR rnb OR "R&B mix" OR "R&B hits"',
                    "r-n-b": 'r&b OR rnb OR "R&B mix" OR "R&B hits"',
                    "hiphop": 'hiphop OR rap OR "hip hop mix" OR "hip hop hits"',
                    "hip-hop": 'hiphop OR rap OR "hip hop mix" OR "hip hop hits"',
                    "dancehall": 'dancehall OR "dancehall mix" OR "dancehall hits"',
                    "afrobeats": 'afrobeat OR afrobeats OR "afrobeats mix" OR "afrobeats hits"',
                    "afrobeat": 'afrobeat OR afrobeats OR "afrobeats mix" OR "afrobeats hits"',
                    "soca": 'soca OR "soca mix" OR "soca carnival"',
                    "pop": 'pop OR "pop hits" OR "pop mix"',
                    "reggae": 'reggae OR "reggae mix" OR "reggae classics"',
                    "jazz": 'jazz OR "jazz classics" OR "jazz mix"',
                    "soul": 'soul OR "soul classics" OR "soul mix"',
                    "rap": 'rap OR "rap hits" OR "hip hop"',
                    "rock": 'rock OR "rock hits" OR "rock classics"',
                    "electronic": 'electronic OR edm OR "house music" OR techno'
                };
                const key = g.toLowerCase().replace(/[^a-z]/g, "");
                return mapping[key] || `${g} mix`;
            };

            const query = getCleanSearchTerm(genre);
            const randomOffset = Math.floor(Math.random() * 20); // rotate query results offset
            
            const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&limit=50&offset=${randomOffset}&type=artist,playlist`, {headers: headers})
            const feedresult = await resp.json()

            let artists = (feedresult.artists?.items || [])
                .filter(Boolean)
                .map((artist) => ({
                    "artist_id": artist.id,
                    "images": artist.images || [],
                    "name": artist.name
                }));
           
            let playlists = (feedresult.playlists?.items || [])
                .filter((playlist) => playlist !== null && playlist.images && playlist.images.length > 0)
                .map((playlist) => {
                    let image = playlist.images[0].url;
                    return {
                        "id": playlist.id,
                        "name": playlist.name,
                        "images": [{"url": image}],
                        "total_tracks": playlist.tracks?.total || 0,
                        "album_type": playlist.type
                    };
                });

            // Rotate / Shuffle the playlists & artists for maximum variation
            playlists = playlists.sort(() => Math.random() - 0.5);
            artists = artists.sort(() => Math.random() - 0.5);

            setPlaylists(playlists)
            setArtists(artists)
            setAccessToken(access_token)
        } catch (e) {
            console.log("Error in GenrePage searchsongs:", e);
        }
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