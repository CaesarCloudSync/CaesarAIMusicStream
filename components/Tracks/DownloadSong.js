import { Alert} from "react-native";;
import ytdl from "react-native-ytdl"

import RNFetchBlob from 'rn-fetch-blob'
import { requestStoragePermission } from "./askpermission";
import RNFS from 'react-native-fs';
import notifee from '@notifee/react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { get_access_token } from "../access_token/getaccesstoken";
import { convertToValidFilename } from "../tool/tools";
import { MUSICSDCARDPATH } from "../constants/constants";
import { Buffer } from 'buffer';
import axios from "axios";
const get_thumbnail = async (album_id) =>{
  const access_token = await get_access_token();
  const headers = {Authorization: `Bearer ${access_token}`}
  const resp = await fetch(`https://api.spotify.com/v1/albums/${album_id}`, {headers: headers})
  const feedresult = await resp.json()
  let album_thumbnail_after = feedresult.images[0].url
  return album_thumbnail_after

}
// Ensure Music directory exists
const ensureMusicDirectory = async () => {
  try {
    await RNFS.mkdir(MUSICSDCARDPATH);
  } catch (error) {
    console.error('Error creating Music directory:', error.message);
  }
};

// Separate function to handle M3U8 downloading
const downloadM3U8 = async (songurl, filePath, notif_title, notif_id, channelId, album_track, name) => {
  try {
    // Step 1: Fetch M3U8 file
    const response = await axios.get(songurl);
    const m3u8Content = response.data;

    // Step 2: Parse M3U8 to get .ts segment URLs
    const lines = m3u8Content.split('\n');
    const segmentUrls = lines
      .filter(line => line.endsWith('.ts') && !line.startsWith('#'))
      .map(segment => {
        // Handle relative URLs
        if (segment.startsWith('http')) return segment;
        const baseUrl = songurl.substring(0, songurl.lastIndexOf('/'));
        return `${baseUrl}/${segment}`;
      });

    if (segmentUrls.length === 0) throw new Error('No .ts segments found');

    // Step 3: Create temp directory for segments
    const tempDir = `${MUSICSDCARDPATH}/temp_segments_${notif_id}`;
    await RNFS.mkdir(tempDir);

    // Step 4: Download segments with progress updates
    const segmentPaths = [];
    for (let i = 0; i < segmentUrls.length; i++) {
      const url = segmentUrls[i];
      const segmentPath = `${tempDir}/segment_${i}.ts`;
      const segmentResponse = await axios.get(url, { responseType: 'arraybuffer' });
      // Write binary data as base64
      const base64Data = Buffer.from(segmentResponse.data).toString('base64');
      await RNFS.writeFile(segmentPath, base64Data, 'base64');
      segmentPaths.push(segmentPath);

      // Update progress notification
      const progress = ((i + 1) / segmentUrls.length) * 100;
      await notifee.displayNotification({
        id: notif_id,
        title: notif_title,
        body: `Downloading: ${notif_title} (${i + 1}/${segmentUrls.length})`,
        android: {
          channelId,
          progress: {
            max: 100,
            current: progress,
          },
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
          actions: [
            {
              title: 'Cancel',
              pressAction: { id: `cancel-download-${notif_id}` },
            },
          ],
        },
      });
    }

    // Step 5: Combine segments into a single file
    await RNFS.writeFile(filePath, ''); // Initialize empty file
    for (const segmentPath of segmentPaths) {
      const data = await RNFS.readFile(segmentPath, 'base64');
      // Append base64 data to the output file
      await RNFS.appendFile(filePath, data, 'base64');
    }

    // Step 6: Clean up temp directory
    await RNFS.unlink(tempDir);

    // Step 7: Save metadata to AsyncStorage
    await AsyncStorage.setItem(`downloaded-track:${album_track.artist}-${album_track.album_name}-${name}`, JSON.stringify(album_track));
    const numofdownloaded = await AsyncStorage.getItem('downloaded_num');
    if (numofdownloaded) {
      const keys = await AsyncStorage.getAllKeys();
      const number_of_downloaded = (await AsyncStorage.multiGet(keys.filter(key => key.includes('downloaded-track:')))).length;
      await AsyncStorage.setItem('downloaded_num', JSON.stringify(number_of_downloaded));
      await AsyncStorage.setItem(
        `downloaded-track-order:${album_track.artist}-${album_track.album_name}-${name}`,
        JSON.stringify({ name, order: number_of_downloaded })
      );
    } else {
      await AsyncStorage.setItem('downloaded_num', JSON.stringify(0));
      await AsyncStorage.setItem(
        `downloaded-track-order:${album_track.artist}-${album_track.album_name}-${name}`,
        JSON.stringify({ name, order: 0 })
      );
    }

    // Step 8: Clear notification
    await notifee.cancelNotification(notif_id);
    await AsyncStorage.removeItem(`current_downloading:${notif_id}`);

    console.log('M3U8 File downloaded!', filePath);
    return { statusCode: 200 };
  } catch (error) {
    console.error('M3U8 Download error:', error.message);
    await notifee.cancelNotification(notif_id);
    throw error;
  }
};

// Original downloadFile function with conditional M3U8 handling
export const downloadFile = async (songurl, name, notif_title, album_track) => {
  // Ensure Music directory exists
  await ensureMusicDirectory();

  const filename = `${convertToValidFilename(`${album_track.artist}-${album_track.album_name}-${name}`)}.mp3`;
  const filePath = `${MUSICSDCARDPATH}/${filename}`;
  
  const exists = await RNFS.exists(MUSICSDCARDPATH)
  console.log(exists)
  if (!exists){
    await RNFS.mkdir(MUSICSDCARDPATH);
  }
  console.log(exists)
  console.log(filePath)
  const thumbnail_filePath = `${RNFS.DocumentDirectoryPath}/${filename.replace('mp3', 'jpg')}`;
  const thumbnail = !album_track.ytcustom ? await get_thumbnail(album_track.album_id) : album_track.thumbnail;

  // Download thumbnail
  await RNFS.downloadFile({
    fromUrl: thumbnail,
    toFile: thumbnail_filePath,
    background: true,
    discretionary: true,
          headers:{
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "*/*",
    "Connection": "keep-alive",
    "Accept-Encoding": "identity",
    "Range": "bytes=0-"  // forces partial-content; prevents reset
  },
  }).promise;

  // Create notification channel
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });
  const notif_id = `notif_${filename}`;
  console.log('song', songurl);

  // Check if songurl is an M3U8 file
  if (songurl.toLowerCase().endsWith('.m3u8')) {
    // Run M3U8 download logic
    Alert.alert("Streaming Link is manifest https://manifest.googlevideo.com/index.m3u8.Have not implemented M3u8 downloading yet.")
    //await downloadM3U8(songurl, filePath, notif_title, notif_id, channelId, album_track, name);
  } else {
    let lastUpdate = 0;
    // Run original download logic
    await RNFS.downloadFile({
      fromUrl: songurl,
      toFile: filePath,
      background: true,
      discretionary: true,
      headers:{
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "*/*",
    "Connection": "keep-alive",
    "Accept-Encoding": "identity",
    "Range": "bytes=0-"  // forces partial-content; prevents reset
  },
      progress: async (res) => {
        await AsyncStorage.setItem(`current_downloading:${notif_id}`, JSON.stringify({ jobId: res.jobId }));
        const progress = (res.bytesWritten / res.contentLength) * 100;
        console.log(`Progress: ${progress.toFixed(2)}%`);
        const now = Date.now();
        if (now - lastUpdate < 500) return; // update every 500ms
        lastUpdate = now;
        await notifee.displayNotification({
          id: notif_id,
          title: notif_title,
          body: `Downloading: ${notif_title}...`,
          android: {
            channelId,
            progress: {
              max: 100,
              current: progress,
            },
            smallIcon: 'ic_launcher',
            pressAction: { id: 'default' },
            actions: [
              {
                title: 'Cancel',
                pressAction: { id: `cancel-download-${notif_id}` },
              },
            ],
          },
        });
      },
    })
      .promise.then(async (response) => {
        console.log('File downloaded!', response);
        await AsyncStorage.setItem(`downloaded-track:${album_track.artist}-${album_track.album_name}-${name}`, JSON.stringify(album_track));
        const numofdownloaded = await AsyncStorage.getItem('downloaded_num');
        if (numofdownloaded) {
          const keys = await AsyncStorage.getAllKeys();
          const number_of_downloaded = (await AsyncStorage.multiGet(keys.filter(key => key.includes('downloaded-track:')))).length;
          await AsyncStorage.setItem('downloaded_num', JSON.stringify(number_of_downloaded));
          await AsyncStorage.setItem(
            `downloaded-track-order:${album_track.artist}-${album_track.album_name}-${name}`,
            JSON.stringify({ name, order: number_of_downloaded })
          );
        } else {
          await AsyncStorage.setItem('downloaded_num', JSON.stringify(0));
          await AsyncStorage.setItem(
            `downloaded-track-order:${album_track.artist}-${album_track.album_name}-${name}`,
            JSON.stringify({ name, order: 0 })
          );
        }
        await notifee.cancelNotification(notif_id);
        await AsyncStorage.removeItem(`current_downloading:${notif_id}`);
      })
      .catch(async (err) => {
        console.log('Download error:', err);
        await notifee.cancelNotification(notif_id);
      });
  }
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