import { Alert} from "react-native";;
import ytdl from "react-native-ytdl"

import RNFetchBlob from 'rn-fetch-blob'
import { requestStoragePermission } from "./askpermission";


export default async function addSong(songurl,name) {
    //const getInfo = util.promisify(ytdl.getInfo);

    //let youtubeurlt = "https://www.youtube.com/watch?v=CPpyc-mrb5k"
    try {
      //console.log(songurl)
      let filename = `${name.replaceAll(/[/\\?%*:|"<>]/g, '_')}.mp3`
      //console.log(songurl)
      //console.log(filename)
   
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