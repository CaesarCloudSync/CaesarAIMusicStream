import { TouchableHighlight,Text,View,Image,TouchableOpacity } from "react-native"
import { useNavigate } from "react-router-native";
import Entypo from "react-native-vector-icons/Entypo"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture,GestureDetector,Swipeable } from "react-native-gesture-handler";

export default function LibraryCard({album,index,setLibraryChanged,librarychanged}){
    //console.log(album)
    const singleTap = Gesture.Tap().onEnd((_event,success) =>{
        if (success){
            getalbumtracks(`/tracks`)
        }
    })
    const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd((_event,success) =>{
        if (success){
            getalbumtracks("/artistprofile")
        }
    })
    const longPress = Gesture.LongPress().onStart(async (_event,success) =>{
        await removefromlibrary()
    })


    const navigate = useNavigate();
    const getalbumtracks = async (route) =>{
        navigate(route, { state: album});

    }
    const removefromlibrary = async () =>{
        //console.log( await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes("library:"))})))
        await AsyncStorage.removeItem(`library:${album[0].album_name}|${album[0].artist}`)
        if (librarychanged === false){
            setLibraryChanged(true)
        }
        else{
            setLibraryChanged(false)
        }

    }
    return(
        <View key={index}style={{backgroundColor:"#141212",height:50,borderRadius: 5,borderWidth: 3,flexBasis:"47%",margin:5,borderColor:"#141212",flexDirection:"row",}}>
            
        <View   style={{backgroundColor:"#141212",flexDirection:"row",justifyContent:"center",alignItems:"center",flex:1}}>
            <GestureDetector  gesture={Gesture.Exclusive(longPress,doubleTap,singleTap)}>
            <View style={{flexDirection:"row",flex:1}}>
            <Image style={{borderRadius:5,width: 50, height: 50}} source={{uri:album[0].thumbnail}}></Image>
            <Text style={{color:"white",width:500,position:"relative",top:15,left:10}}>
                    {album[0].album_name} | {album[0].artist}
            </Text>
  
            

            </View>
            </GestureDetector>




        </View>



            


       
    </View>
    )
}

/*

                <GestureDetector gesture={Gesture.Exclusive(doubleTap,longPress,singleTap)}>
                    <View  key={album_name} style={{backgroundColor:"#141212",flexDirection:favouritecards === true ? "row":"column",justifyContent:favouritecards === true ? "flex-start":"flex-start",alignItems:favouritecards === true ? "stretch": "stretch",flex:1}}>
                        <View style={{flex:favouritecards === true ? 0.5 : (favouritecards === false ? 1 : 1)}}>
                            <Image style={{borderRadius:5,width: '100%', height: '100%'}} source={{uri:thumbnail}}></Image>
                        </View>
                        <View style={{padding:10}}>
                        </View>
                        <Text style={{color:"white"}}>
                            {album[0].album_name} | {album[0].artist}
                        </Text>
                        <Text>
                            Artist: {artist_name}
                        </Text>
                        {favouritecards !== true&&
                        <View>
        
                        <Text>
                            Total Tracks: {total_tracks}
                        </Text>
                        <Text>
                            Release Date: {release_date}
                        </Text>
    
                            </View>}
        
        
                    
        
        
                    </View>
                
                        
        
            </GestureDetector>*/