import { TouchableOpacity, Text, View } from "react-native"
import { useNavigate } from "react-router-native";

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const getGenreColor = (genre) => {
    const colors = {
        rnb: "#8C1D40",
        hiphop: "#BA5C00",
        dancehall: "#007D5A",
        afrobeats: "#B29000",
        soca: "#C6007E",
        pop: "#0064C6",
        reggae: "#006E1E",
        jazz: "#3C3C3C",
        soul: "#2C007D",
        rap: "#A30000",
        caribbean: "#008B9B",
        latin: "#D91C5C",
        rock: "#1C1C1C",
        electronic: "#551A8B"
    };
    const key = genre.toLowerCase().replace(/[^a-z]/g, "");
    if (colors[key]) return colors[key];
    
    // Hash function to get a stable, vibrant, and rich HSL color
    let hash = 0;
    for (let i = 0; i < genre.length; i++) {
        hash = genre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 32%)`; // High saturation, rich dark-medium lightness for premium readability
};

export default function GenreItem({genre}){
    const navigate = useNavigate();
    const navigategenrepage = async () =>{
        navigate("/genrepage", { state: {"genre": genre}});
    }
    
    const tileColor = getGenreColor(genre);
    
    return(
        <TouchableOpacity 
            onPress={() => navigategenrepage()}  
            style={{
                backgroundColor: tileColor,
                justifyContent: "flex-start",
                alignItems: "flex-start",
                width: "46%", // 2 columns layout with margins
                height: 90, 
                borderRadius: 14,
                margin: 7,
                padding: 14,
                overflow: "hidden", // Clip translucent background decor circles
                borderTopWidth: 1.5,
                borderTopColor: "rgba(255, 255, 255, 0.2)",
                borderLeftWidth: 0.5,
                borderLeftColor: "rgba(255, 255, 255, 0.1)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 5, // Android shadows
                position: "relative"
            }}
        >
            {/* Decors: Translucent glassmorphic circle background accents */}
            <View 
                style={{
                    position: "absolute",
                    bottom: -20,
                    right: -20,
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: "rgba(255, 255, 255, 0.12)"
                }}
            />
            <View 
                style={{
                    position: "absolute",
                    bottom: 10,
                    right: 25,
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: "rgba(255, 255, 255, 0.08)"
                }}
            />

            <Text 
                style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "900",
                    letterSpacing: 0.3,
                    textShadowColor: "rgba(0,0,0,0.2)",
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2
                }}
            >
                {capitalizeFirstLetter(genre)}
            </Text>
        </TouchableOpacity>
    );
}