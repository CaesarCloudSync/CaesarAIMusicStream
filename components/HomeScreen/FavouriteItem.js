import { View,Text,Image,TouchableOpacity } from "react-native"
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
export default function FavouriteItem({favouritecards,album}){
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    return(
        <View  key={album.name}style={{backgroundColor:"#141212",width:100,height:favouritecards ? 50 : 300,borderRadius: 5,borderWidth: 3,flexBasis:"47%",margin:5,borderColor:"#141212"}}>
        <View   style={{backgroundColor:"#141212",flexDirection:favouritecards === true ? "row":"column",justifyContent:favouritecards === true ? "center":"flex-start",alignItems:favouritecards === true ? "center": "stretch",flex:1}}>
            <View style={{flex:favouritecards ? 0.5 : 1}}>
                <Image style={{width: '100%', height: '100%'}} source={{uri:album.images[0].url}}></Image>
            </View>
            <View style={{padding:10}}>
            </View>
            <Text style={{color:"white",flex:favouritecards ? 1 : 0.15}}>
                {album.name} | {capitalizeFirstLetter(album.album_type)}
            </Text>
        
            {favouritecards === false &&
                <Text>
                Artist: {album.artists[0].name}
                </Text>}
                {favouritecards === false &&
            <View>
                            
                <Text>
                    Total Tracks: {album.total_tracks}
                </Text>
                <Text>
                    Release Date: {album.release_date}
                </Text>
                <TouchableOpacity>
                <MaterialIcons name="my-library-add" style={{fontSize:25,color:"white",alignSelf:"flex-end"}}/>
                </TouchableOpacity>
                </View>
            }

            





        </View>
        
    </View>
        
    )
}