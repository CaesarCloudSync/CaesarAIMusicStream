import { View,Text } from "react-native"
export default function GenreItem({genre}){
    return(
        <View  style={{backgroundColor:"#141212",width:76,height:75,borderRadius: 5,borderWidth: 3,margin:5,borderColor:"red"}}>
        <Text>
        {genre}
        </Text>
        </View>
        )
}