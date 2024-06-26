import { View ,Alert,Text} from "react-native";
import { SearchBar } from 'react-native-elements';
import {Picker} from "@react-native-picker/picker";
import { useState } from "react";
import Icon from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import { ActivityIndicator } from "react-native";
import * as ScopedStorage from 'react-native-scoped-storage';
import ytdl from "react-native-ytdl"
//import util from 'util'
import * as downloadDirs from './downloadDirs';
import RNFS from 'react-native-fs';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import RNFetchBlob from 'rn-fetch-blob'
import { requestStoragePermission } from "./askpermission";
import ytpl from "react-native-ytpl"
import { Linking } from 'react-native'
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { Pressable } from "react-native";
import { Image } from "react-native";
import axios from "axios";
import { get_access_token } from "../access_token/getaccesstoken";
export default function CaesarSongSearch(){
    const [youtubeurl,setYouTubeURL] = useState("")
    const [selectedLanguage, setSelectedLanguage] = useState("album");
    const [album,setALbum] = useState("")
    const searchbarstyles = {width:300,height:70}
    const [showSearch,setShowSearch] = useState(false);
    const [loading,setLoading] = useState(false)
    const [progressmeessage,setProgressMessage] = useState("");
    const [redirlink,setRedirLink] = useState('https://youtube.com')
    const [downloading,setDownloading] = useState(false)
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
  }
    const MyActivityIndicator = () => {
      return (
            <View style={{ flex: 1, justifyContent: "center",alignItems:"center"}}>
          <ActivityIndicator style={{position:"relative",top:40,right:7}} size="large" color="blue" />
            </View>
        );
    }
    async function openLink() {
      try {
        const isAvailable = await InAppBrowser.isAvailable()
        const url = redirlink
        if (isAvailable) {
          InAppBrowser.open(url, {
            // iOS Properties
            dismissButtonStyle: 'cancel',
            preferredBarTintColor: 'gray',
            preferredControlTintColor: 'white',
            // Android Properties
            showTitle: true,
            toolbarColor: '#6200EE',
            secondaryToolbarColor: 'black',
            enableUrlBarHiding: true,
            enableDefaultShare: true,
            forceCloseOnRedirection: true,
          }).then((result) => {
            //Alert.alert(JSON.stringify(result))
          })
        } else Linking.openURL(url)
      } catch (error) {
        Alert.alert(error.message)
      }
    }

    async function addSong(url) {
      setDownloading(true);
      //const getInfo = util.promisify(ytdl.getInfo);

      //let youtubeurlt = "https://www.youtube.com/watch?v=CPpyc-mrb5k"
      try {
        const id = ytdl.getVideoID(url);
        //console.log(id)
        const info = await ytdl.getInfo(id);
        //console.log(info)
        let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

        const format = ytdl.chooseFormat(audioFormats, {quality: 'highest'});
        let songurl = format.url
        let name = info.videoDetails.title
        let filename = `${name.replaceAll(/[/\\?%*:|"<>]/g, '_')}.mp3`
        //console.log(songurl)
        console.log(filename)
     
        //downloadFile("https://file-examples.com/wp-content/storage/2017/11/file_example_MP3_700KB.mp3",filename)
        await requestStoragePermission()
        const { config, fs } = RNFetchBlob;
        let PictureDir = fs.dirs.MovieDir
        let options = {
          fileCache: true,
          addAndroidDownloads: {
            // Related to the Android only
            useDownloadManager: true,
            notification: true,
            path:
              PictureDir + "/" + filename,
            description: 'Downloading:'+ name + "...",
          },
        };
        config(options)
          .fetch('GET', songurl)
          .then(res => {
            // Showing alert after successful downloading
            console.log('res -> ', JSON.stringify(res));
            Alert.alert(`Success downloading ${name}`)
            setDownloading(false);
            //alert('Image Downloaded Successfully.');
          }).catch(
            (err) =>{
              Alert.alert("Error:" + err)
            }
          )
          ;
      
        
    } catch (err) {
      console.log(err)
      Alert.alert(`Error downloading from ${url}`)
    }
  
  }
  async function addSongs() {
    let youtubeurlnotm = youtubeurl.replace("m.","")
    if (youtubeurlnotm !== "" && youtubeurlnotm.includes("https")){
        if (youtubeurlnotm.includes("list=")){
        //const id = ytdl.ge
        //https://www.youtube.com/watch?v=UU_aEa8K-EOJ3D6gOs7HcyNg
        //const plid = ytpl.getPlaylistID(youtubeurlnotm)
        //const playlist = await ytpl(plid["_j"]);
        youtubeurlnotm = youtubeurlnotm.includes("playlist") ? youtubeurlnotm: "https://www.youtube.com/playlist" + "?" + youtubeurlnotm.split("?")[1].split("&")[1]// https://www.youtube.com/playlist?list=

        const response = await axios.get(`https://caesariytplaylistms-qqbn26mgpa-uc.a.run.app/v1/getplaylisturls?url=${youtubeurlnotm}`)
        let result = response.data
        //console.log(result)
        let video_urls = result.video_urls
        video_urls.map(async (url) => {

          //console.log(url)
          await addSong(url)
        })
      }
      else if (youtubeurlnotm.includes("https://open.spotify.com/playlist")){
        const access_token = await get_access_token();
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch(`https://api.spotify.com/v1/playlists/${youtubeurlnotm.split("/").slice(-1)[0]}`, {headers: headers})
        const feedresult = await resp.json();
        let playlist_name = feedresult["name"]

        let tracks = feedresult.tracks.items.map((items) =>{return({"ytquery":`${items['track']['name'].replace("&","and")} ${items['track']['album']['name'].replace("&","and")} by ${items['track']['artists'][0]['name']}`,"track_name":items['track']['name'],"artist_name":items['track']['artists'][0]['name'],"album_name":items['track']['album']['name']})})
        //console.log(tracks)
        const promises = tracks.map( async (items) =>{
          let query = items.ytquery
          const response = await axios.get(`https://caesaraiyoutube-qqbn26mgpa-uc.a.run.app/searchfeed?query=${query}&amount=50`)
          let videos = response.data.result
          let video_link = videos[0].link
          await addSong(video_link)

        })
        await Promise.all(promises)

        
      }
      else if (youtubeurlnotm.includes("https://open.spotify.com/album")){
        const access_token = await get_access_token();
        const headers = {Authorization: `Bearer ${access_token}`}
        const resp = await fetch(`https://api.spotify.com/v1/albums/${youtubeurlnotm.split("/").slice(-1)[0]}`, {headers: headers})
        const feedresult = await resp.json();
        let album_name = feedresult["name"]
        let tracks = feedresult.tracks.items.map((items) =>{
          
          return({"ytquery":`${items['name'].replace("&","and")} ${album_name} by ${items['artists'][0]['name']}`,"track_name":items['name'],"artist_name":items['artists'][0]['name'],"album_name":album_name})})

        const promises = tracks.map( async (items) =>{
          let query = items.ytquery
          const response = await axios.get(`https://caesaraiyoutube-qqbn26mgpa-uc.a.run.app/searchfeed?query=${query}&amount=50`)
          let videos = response.data.result
          
          let video_link = videos[0].link
          await addSong(video_link)

        })
        await Promise.all(promises)
      }
      else{

      
        await addSong(youtubeurlnotm)
        setDownloading(false)
    
    
      }
  }


  }

    return(
        <View style={{display:"flex",justifyContent:"flex-end",alignItems:"flex-end"}}>
        <View style={{display:"flex",flexDirection:"row"}}>
        
        <Icon name={showSearch === false ? "search":"close"} size={30} style={{position:"relative",right:10,top:10,marginBottom:10}} onPress={() => {if(showSearch === false){setShowSearch(true)}else{setShowSearch(false)}}}/>
        </View>
        {loading === true && <MyActivityIndicator ></MyActivityIndicator>}
        <Text style={{position:"relative",top:5}}>
        {progressmeessage}
        </Text>
        
        {showSearch === true &&
        <View>
        <SearchBar
        containerStyle={searchbarstyles}
        placeholder={redirlink.includes("youtube") ? "Enter Youtube URL:":"Enter Spotify URL:"}
        onChangeText={setYouTubeURL}
        value={youtubeurl}/>
          
         
 


            {downloading === false ?
            <View style={{display:"flex",flexDirection:"row"}}>
             <Pressable style={{flex:1,display:"flex",justifyContent:"center",alignItems:"center",backgroundColor:redirlink.includes("youtube") ? "red":"black",height:40,borderBottomLeftRadius:5}} onPress={addSongs}>
              <Text style={{color:"white"}}>Download</Text>
              </Pressable>
              <View  >
            {redirlink.includes("youtube") ? 
                        <Pressable onLongPress={() =>{setRedirLink("https://open.spotify.com")}} onPress={() =>{openLink()}} style={{backgroundColor:"red",width:40,justifyContent:"center",alignItems:"center"}}>
                        <Image  style={{position:"relative",top:0.3,height:40}} source={require("../../assets/Youtube_logo.png")}></Image>
                      </Pressable>:
            <Pressable onLongPress={() =>{setRedirLink("https://youtube.com")}} onPress={() =>{openLink()}} style={{backgroundColor:"black",width:40,justifyContent:"center",alignItems:"center"}}>
            <Image  style={{position:"relative",top:0.3,height:40,width:40}} source={require("../../assets/SpotifyLogo.png")}></Image>
            </Pressable>}

            </View></View>:
            <ActivityIndicator style={{marginTop:10}}></ActivityIndicator>}

            
            
            </View>}

        </View>
    )
}

/*
            <Picker style={searchbarstyles}
            selectedValue={selectedLanguage}
            onValueChange={(itemValue, itemIndex) =>
                setSelectedLanguage(itemValue)
            }>
            <Picker.Item label="Album" value="album" />
            <Picker.Item label="Song" value="song" />
            </Picker> */