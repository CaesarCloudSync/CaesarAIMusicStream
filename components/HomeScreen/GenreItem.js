import { View,Text } from "react-native"
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
export default function GenreItem({genre,randomcolor}){
    return(
        <View  style={{backgroundColor:"#141212",justifyContent:"center",alignItems:"center",width:76,height:75,borderRadius: 10,borderWidth: 3,margin:5,backgroundColor:randomcolor}}>
        <Text>
        {capitalizeFirstLetter(genre)}
        </Text>
        </View>
        )
}