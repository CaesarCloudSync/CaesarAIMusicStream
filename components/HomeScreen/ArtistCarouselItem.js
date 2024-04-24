import { View,Text,Image, TouchableOpacity,Vibration } from "react-native"
import { useRef } from "react";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from "axios";
import { useNavigate} from "react-router-native";
import { TouchableHighlight} from "react-native";
import { Gesture,GestureDetector,Swipeable } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function ArtistCarouselItem({artist_id,artist_name,thumbnail,favouritecards,setRecentRemoved,recent_removed}){
    const singleTap = Gesture.Tap().onEnd((_event,success) =>{
        if (success){
            navartistprofile()
        }
    })
    const longPress = Gesture.LongPress().onStart((_event,success) =>{
        setTimeout(async () =>{
            if (setRecentRemoved !== undefined){
            await AsyncStorage.removeItem(`artist:${artist_name}`);
            if (recent_removed === true){
                setRecentRemoved(false)
            }
            else{
                setRecentRemoved(true)
            }
            }
        },300)
    })


    const navigate = useNavigate();
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    const navartistprofile = async () =>{
        
        
        navigate("/artistprofile",{state:[{"artist_id":artist_id}]})
    }
    console.log(artist_id)
      
            return(
        
                <View  style={{backgroundColor:"#141212",width:favouritecards === true ? 205 : (favouritecards === false ? 200 : 300),height:favouritecards === true ? 50 : (favouritecards === false ? 300 : 300),borderRadius: 5,borderWidth: 3,margin:5,borderColor:"#141212"}}>
                <GestureDetector gesture={Gesture.Exclusive(longPress,singleTap)}>
                    <View  key={artist_name} style={{backgroundColor:"#141212",flexDirection:favouritecards === true ? "row":"column",justifyContent:favouritecards === true ? "flex-start":"flex-start",alignItems:favouritecards === true ? "stretch": "stretch",flex:1}}>
                        <View style={{flex:favouritecards === true ? 0.5 : (favouritecards === false ? 1 : 1)}}>
                            <Image style={{width: '100%', height: '100%'}} source={{uri:thumbnail}}></Image>
                        </View>
                        <View style={{padding:10}}>
                        </View>
                        <Text style={{color:"white"}}>
                            {artist_name}
                        </Text>

        
                    
        
        
                    </View>
                
                        
        
            </GestureDetector>
            </View >
    )
        

    


    
}