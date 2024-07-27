import CarouselItem from "./CarouselItem";
import { View,Text,SafeAreaView,FlatList,ScrollView } from "react-native";
import ArtistCarouselItem from "./ArtistCarouselItem";
import PlaylistCarouselItem from "./PlaylistCarouselItem";
export function FavouriteAlbums({favouritecards,playlists,access_token,recentalbums,setRecentAlbums}){
    return(
        <View key={playlists[0].name} style={{justifyContent: 'center',marginTop:10}}>
        <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
            
                {playlists.map((album,index) =>{
                    //console.log(album)
                    return(

                        <CarouselItem key={index}  toptrack={album.name} access_token={access_token} favouritecards={favouritecards} spotifyid={album.id}thumbnail={album.images[0].url} album_name={album.name} artist_name={album.artists[0].name} total_tracks={album.total_tracks} release_date={album.release_date} album_type={album.album_type} recentalbums={recentalbums} setRecentAlbums={setRecentAlbums}/>
                    
                    )
                })}
            

        </View>
    </View>
    )
}

export function FavouriteTopTracksAlbums({favouritecards,playlists,access_token}){
    return(
        <View key={playlists[0].name} style={{justifyContent: 'center',marginTop:10}}>
        <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
            
                {playlists.map((track,index) =>{
                    
                    let album = track.album
                
                    return(

                        <CarouselItem key={index} toptrack={track.name} access_token={access_token} favouritecards={favouritecards} spotifyid={album.id}thumbnail={album.images[0].url} album_name={album.name} artist_name={album.artists[0].name} total_tracks={album.total_tracks} release_date={album.release_date} album_type={album.album_type} single={true}/>
                    
                    )
                })}
            

        </View>
    </View>
    )
}

/*
{"album_type": "playlist", "id": "7MoYg6GauQWVAMDNBU2wen", "images": [{"url": "https://mosaic.scdn.co/640/ab67616d0000b2731072a34d8c8d75e9b2545d8aab67616d0000b273a5c7151899ae5da4f4382d54ab67616d0000b273cf33b6ed36ef4f8138a1b43eab67616d0000b273e962b95035f6a3718741e699"}], "name": "a boogie set list 24’", "total_tracks": 30} */

export function FavouriteSearchPlaylists({favouritecards,playlists,access_token}){
    return(
        <View key={playlists[0].name} style={{justifyContent: 'center',marginTop:10}}>
        <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
            
                {playlists.map((playlist,index) =>{
                    console.log(playlist)
                
                    return(

                        <PlaylistCarouselItem key={index}  access_token={access_token} favouritecards={favouritecards} playlistid={playlist.id}thumbnail={playlist.images[0].url} playlist_name={playlist.name}  total_tracks={playlist.total_tracks} album_type={playlist.album_type}/>
                    
                    )
                })}
            

        </View>
    </View>
    )
}


export function FavouriteSearchAlbums({favouritecards,albums,access_token,artists,playlists,tracks}){
    return(
        <ScrollView removeClippedSubviews={true} key={albums[0].name} style={{marginTop:10}}>
            <Text style={{marginLeft:10,fontSize:16}}>Tracks</Text>
             <View style={{alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
             {tracks.slice(0,13).map((track,index) =>{
                    
                    let album = track.album
                
                    return(

                        <CarouselItem key={index} toptrack={track.name} access_token={access_token} favouritecards={favouritecards} spotifyid={album.id}thumbnail={album.images[0].url} album_name={album.name} artist_name={album.artists[0].name} total_tracks={album.total_tracks} release_date={album.release_date} album_type={album.album_type} single={true}/>
                    
                    )
                })}
            
             </View>
             <Text style={{marginLeft:10,fontSize:16}}>Albums</Text>
            <View style={{alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
                

                
                    {albums.slice(0,17).map((album,index) =>{
                        //console.log(album)
                        return(

                            <CarouselItem search={true} key={index} toptrack={album.name}  access_token={access_token} favouritecards={favouritecards} spotifyid={album.id}thumbnail={album.images[0].url} album_name={album.name} artist_name={album.artists[0].name} total_tracks={album.total_tracks} release_date={album.release_date} album_type={album.album_type}/>
                        
                        )
                    })}
                

            </View>
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

        <Text style={{marginLeft:10,fontSize:16}}>Playlists</Text>
        <View style={{alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap',gap:20}}>
            

            
                {playlists.map((playlist,index) =>{
                    //console.log(album)
                    return(

                        <PlaylistCarouselItem key={index}  access_token={access_token} favouritecards={favouritecards} playlistid={playlist.id}thumbnail={playlist.images[0].url} playlist_name={playlist.name}  total_tracks={playlist.total_tracks} album_type={playlist.album_type}/>
                    
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