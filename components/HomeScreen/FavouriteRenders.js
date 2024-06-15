import CarouselItem from "./CarouselItem";
import { View,Text,SafeAreaView,FlatList,ScrollView } from "react-native";
import ArtistCarouselItem from "./ArtistCarouselItem";
export function FavouritePlaylists({favouritecards,playlists,access_token,recentalbums,setRecentAlbums}){
    return(
        <View key={playlists[0].name} style={{justifyContent: 'center',marginTop:10}}>
        <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
            
                {playlists.map((album,index) =>{
                    //console.log(album)
                    return(

                        <CarouselItem key={index} access_token={access_token} favouritecards={favouritecards} spotifyid={album.id}thumbnail={album.images[0].url} album_name={album.name} artist_name={album.artists[0].name} total_tracks={album.total_tracks} release_date={album.release_date} album_type={album.album_type} recentalbums={recentalbums} setRecentAlbums={setRecentAlbums}/>
                    
                    )
                })}
            

        </View>
    </View>
    )
}

export function FavouriteTopTracksPlaylists({favouritecards,playlists,access_token}){
    return(
        <View key={playlists[0].name} style={{justifyContent: 'center',marginTop:10}}>
        <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
            
                {playlists.map((track,index) =>{
                    
                    let album = track.album
                
                    return(

                        <CarouselItem key={index} toptrack={track.name} access_token={access_token} favouritecards={favouritecards} spotifyid={album.id}thumbnail={album.images[0].url} album_name={album.name} artist_name={album.artists[0].name} total_tracks={album.total_tracks} release_date={album.release_date} album_type={album.album_type}/>
                    
                    )
                })}
            

        </View>
    </View>
    )
}


export function FavouriteSearchPlaylists({favouritecards,playlists,access_token,artists}){
    return(
        <ScrollView removeClippedSubviews={true} key={playlists[0].name} style={{marginTop:10}}>
            <Text style={{marginLeft:10,fontSize:16}}>Artists</Text>
             <View style={{alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
             {artists.slice(0,13).map((artist,index) =>{
                        if (artist.images.length !== 0){
                            return(
                        
                                <ArtistCarouselItem key={index} favouritecards={favouritecards} artist_id={artist.artist_id}thumbnail={artist.images[0].url} artist_name={artist.name} />
                            
                            )
                        }


                    })}
             </View>
        <Text style={{marginLeft:10,fontSize:16}}>Albums</Text>
        <View style={{alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
            

            
                {playlists.map((album,index) =>{
                    //console.log(album)
                    return(

                        <CarouselItem search={true} key={index} access_token={access_token} favouritecards={favouritecards} spotifyid={album.id}thumbnail={album.images[0].url} album_name={album.name} artist_name={album.artists[0].name} total_tracks={album.total_tracks} release_date={album.release_date} album_type={album.album_type}/>
                    
                    )
                })}
            

        </View>
    </ScrollView>
    )
}

export function FavouriteRecommendations({favouritecards,playlists,access_token}){
    return(
        <SafeAreaView style={{flex: 1,marginTop:10}}>
        <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
            
            <FlatList
            data={playlists}
            horizontal={true}
            renderItem={({item,index}) =><CarouselItem key={index} access_token={access_token} favouritecards={favouritecards} spotifyid={item.album.id}thumbnail={item.album.images[0].url} album_name={item.album.name} artist_name={item.album.artists[0].name} total_tracks={item.album.total_tracks} release_date={item.album.release_date} album_type={item.album.album_type}/>}
            />
            

        </View>
    </SafeAreaView>
    )
}