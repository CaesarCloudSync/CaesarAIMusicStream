import { Alert} from "react-native";;
import ytdl from "react-native-ytdl"

import RNFetchBlob from 'rn-fetch-blob'
import { requestStoragePermission } from "./askpermission";
import RNFS from 'react-native-fs';
import notifee from '@notifee/react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

export const downloadFile = async (songurl,name,notif_title,album_track) => {
  let filename = `${name}.mp3` // .replaceAll(/[/\\?%*:|"<>]/g, '_')}
  const filePath = RNFS.DocumentDirectoryPath + `/${filename}`;
  const thumbnail_filePath = RNFS.DocumentDirectoryPath + `/${filename.replace("mp3","jpg")}`;
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });
  let notif_id = `notif_${filename}`
  console.log("song",songurl)

  await RNFS.downloadFile({
    fromUrl: songurl,
    toFile: filePath,
    background: true, // Enable downloading in the background (iOS only)
    discretionary: true, // Allow the OS to control the timing and speed (iOS only)
    progress: async (res) => {
      // Handle download progress updates if needed
      await AsyncStorage.setItem(`current_downloading:${notif_id}`,JSON.stringify({"jobId":res.jobId}))
      const progress = (res.bytesWritten / res.contentLength) * 100;
      console.log(`Progress: ${progress.toFixed(2)}%`);
      await notifee.displayNotification({
        id:notif_id,
        title:notif_title,
        body: 'Downloading: '+ notif_title + "...",
        android: {
          channelId,
          progress: {
            max: 100,
            current: progress,
          },
          smallIcon: 'ic_launcher', // optional, defaults to 'ic_launcher'.
          // pressAction is needed if you want the notification to open the app when pressed
          pressAction: {
            id: 'default',
          },
          actions: [
            {
              title: 'Cancel',
              pressAction: {
                id: `cancel-download-${notif_id}`,
              },
            },
          ]
        },
      });
    },
  })
    .promise.then( async (response) => {
      console.log('File downloaded!', response);
      await AsyncStorage.setItem(`downloaded-track:${name}`,JSON.stringify(album_track))
      const numofdownloaded = await AsyncStorage.getItem("downloaded_num")
      if (numofdownloaded){
        let keys = await AsyncStorage.getAllKeys()
        const number_of_downloaded = (await AsyncStorage.multiGet(keys.filter((key) =>{return(key.includes(`downloaded-track:`))}))).length
        await AsyncStorage.setItem("downloaded_num",JSON.stringify(number_of_downloaded))
        await AsyncStorage.setItem(`downloaded-track-order:${name}`,JSON.stringify({"name":name,"order":number_of_downloaded }))
      }
      else{
        await AsyncStorage.setItem("downloaded_num",JSON.stringify(0))
        await AsyncStorage.setItem(`downloaded-track-order:${name}`,JSON.stringify({"name":name,"order":0}))
      }
      
      await RNFS.downloadFile({
        fromUrl: album_track.thumbnail,
        toFile: thumbnail_filePath,
        background: true, // Enable downloading in the background (iOS only)
        discretionary: true, // Allow the OS to control the timing and speed (iOS only)

      })
      await notifee.cancelNotification(notif_id);
      await AsyncStorage.removeItem(`current_downloading:${notif_id}`)
    })
    .catch(async (err) => {
      console.log('Download error:', err);
      await notifee.cancelNotification(notif_id);
    });

};
export const downloadSong = async (songurl,name) => {
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
      let dir = fs.dirs.DownloadDir
      console.log(dir,songurl)
      let external_path = dir + "/" + filename
      let internal_path = "file://" + RNFS.DocumentDirectoryPath + "/" + filename

      let options = {
        fileCache: true,
        addAndroidDownloads: {
          // Related to the Android only
          useDownloadManager: true,
          notification: true,
          path:
          external_path,
          description: 'Downloading:'+ name + "...",
        },
      };
      try{
        await config(options).fetch('GET', songurl)
        await RNFS.copyFile(external_path,internal_path)
        await RNFS.unlink(external_path)
         Alert.alert(`Success downloading ${name}`)
        
                        // The picked document is available in the 'result' object
        /*let filename = image?.filename || `image_${Date.now()}.${getFileExtension(imageCompressed?.path)}`
       
        */
      }
      catch(err){
        Alert.alert(err)
      }
    
        /*
*/
    
      
  } catch (err) {
    console.log(err)
    Alert.alert(`Error downloading from ${url}`)
  }

}