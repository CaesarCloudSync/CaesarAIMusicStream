import { TouchableOpacity,Text } from "react-native"
import { useNavigate } from "react-router-native";
import { FavouriteSearchAlbums } from "./FavouriteRenders";
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
export default function GenreItem({genre,randomcolor}){
    const navigate = useNavigate();
    const navigategenrepage = async () =>{
        navigate("/genrepage", { state: {"genre":genre}});
    }
    return(
        <TouchableOpacity onPress={() =>{navigategenrepage()}}  style={{backgroundColor:"#141212",justifyContent:"center",alignItems:"center",width:76,height:75,borderRadius: 10,borderWidth: 3,margin:5,backgroundColor:randomcolor}}>
        <Text>
        {capitalizeFirstLetter(genre)}
        </Text>
        </TouchableOpacity>
        )
}