import RNFS from "react-native-fs";
import { convertToValidFilename } from "../tool/tools";
import { PermissionsAndroid } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MUSICSDCARDPATH } from "../constants/constants";
// Request storage permissions
async function requestStoragePermission() {
  try {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const readGranted = granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;
      const writeGranted = granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;
      if (readGranted && writeGranted) {
        console.log('Storage permissions granted');
        return true;
      } else {
        console.log('Storage permissions denied');
        return false;
      }
    }
    return true; // iOS doesn't need this
  } catch (err) {
    console.warn('Permission error:', err);
    return false;
  }
}
// Copy file from app-specific storage to SD card
async function copyMusicToSDCard(fileName) {
  /*if (!(await requestStoragePermission())) {
    console.log('Cannot proceed without storage permissions');
    return { success: false, error: 'Storage permissions denied' };
  }*/

  // Define source and destination paths
  
 
  const sourcePath = `${RNFS.DocumentDirectoryPath}/${convertToValidFilename(fileName)}`; // App-specific files directory

  const destDir = `${MUSICSDCARDPATH}/Music`; // Destination folder on SD card
  const destPath = `${destDir}/${convertToValidFilename(fileName)}`; // Destination file path

  try {
    // Check if source file exists
    const sourceExists = await RNFS.exists(sourcePath);
    if (!sourceExists) {
      console.log(`Source file does not exist: ${sourcePath}`);
      return { success: false, error: `Source file not found: ${sourcePath}` };
    }

    // Check if SD card path exists
    const sdCardExists = await RNFS.exists(MUSICSDCARDPATH);
    if (!sdCardExists) {
      console.log(`SD card path does not exist: ${MUSICSDCARDPATH}`);
      // Fallback to SAF

    }

    // Create destination directory if it doesn't exist
    const destDirExists = await RNFS.exists(destDir);
    if (!destDirExists) {
      await RNFS.mkdir(destDir);
      console.log(`Created directory: ${destDir}`);
    }

    // Copy the file
    await RNFS.copyFile(sourcePath, destPath);
    console.log(`File copied successfully from ${sourcePath} to ${destPath}`);
    return { success: true, path: destPath };
  } catch (error) {
    console.error('Error copying file:', error.message, error.stack);
    // Fallback to SAF if direct copy fails
  }
}

// Fallback: Cop

    const getcopysongs = async (downloaded_song) =>{
        const track_downloaded = downloaded_song.replace("downloaded-track:","")
        await copyMusicToSDCard(`${track_downloaded}.mp3`)
        
    }
    async function deleteFromInternal(fileName) {
          const sourcePath = `file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(fileName)}.mp3`; // App-specific files directory
          //console.log(sourcePath)
          await RNFS.unlink(sourcePath)
        
    }
    const getdeletesongsinternal = async (downloaded_song) =>{
        const track_downloaded = downloaded_song.replace("downloaded-track:","")
        await deleteFromInternal(track_downloaded)

    }
    export const getdownloadedmetadata = async () =>{
        let keys = await AsyncStorage.getAllKeys()
        const downloaded_songs = keys.filter((key) =>{return(key.includes(`downloaded-track:`))});
        // Remove the prefix
        //console.log(downloaded_songs)
        let track_downloaded = 0; // Initialize counter
        let failed_downloads = 0; // Initialize failed downloads counter
        console.log("Starting...")
        const promises = downloaded_songs.map(async (downloaded_song) => {
        try {
            await getdeletesongsinternal(downloaded_song); // Assuming getcopysongs is async
            track_downloaded++; // Increment counter on success
            console.log(`Songs deleted: ${track_downloaded}/${downloaded_songs.length} - file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(downloaded_song)}.mp3`);
        } catch (error) {
            failed_downloads++; // Increment failed downloads counter
            console.error(`Failed to delete song ${downloaded_song}: ${error.message}`);
        }
        });

        try {
        await Promise.all(promises);
        console.log(`Deletion complete! Total songs deleted: ${track_downloaded}/${downloaded_songs.length}`);
        if (failed_downloads > 0) {
            console.log(`Failed downloads: ${failed_downloads}/${downloaded_songs.length}`);
        }
        } catch (error) {
        console.error(`Error in batch processing: ${error.message}`);
        }
                
        //const song_path = `file://${RNFS.DocumentDirectoryPath}/${convertToValidFilename(`${track_downloaded.artist}-${track_downloaded.album_name}-${track_downloaded.name}`)}.mp3`

    }
