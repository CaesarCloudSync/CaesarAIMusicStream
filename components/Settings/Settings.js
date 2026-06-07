import { View, Text, TextInput, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import AntDesign from "react-native-vector-icons/AntDesign"
import { useNavigate } from "react-router-native";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import ShowQueue from "../ShowQueue/showqueue";
import TrackProgress from "../TrackProgress/TrackProgress";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { set } from "lodash";

import RNFS from 'react-native-fs';

import { PermissionsAndroid, Platform } from 'react-native';
import axios from "axios";
import { getSpotifyBackupConfig, saveSpotifyBackupConfig, clearSpotifyBackupConfig, authorizeWithSpotify } from "../access_token/spotifyBackupHelper";


export default function Settings({ seek, setSeek, currentTrack, setCurrentTrack }) {
    const navigate = useNavigate();
  const [proxyUrl, setProxyUrl] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [spotifyUserId, setSpotifyUserId] = useState("");
  const [spotifyAccessToken, setSpotifyAccessToken] = useState("");
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState("");
  const [spotifyClientId, setSpotifyClientId] = useState("");
  const [spotifyClientSecret, setSpotifyClientSecret] = useState("");
  const [spotifyRedirectUri, setSpotifyRedirectUri] = useState("");
  const [showSpotifyDetails, setShowSpotifyDetails] = useState(false);

  const loadSpotifyCredentials = async () => {
    try {
      const config = await getSpotifyBackupConfig();
      setSpotifyUserId(config.userId);
      setSpotifyAccessToken(config.accessToken);
      setSpotifyRefreshToken(config.refreshToken);
      
      const customClientId = await AsyncStorage.getItem("spotify_backup_client_id");
      const customClientSecret = await AsyncStorage.getItem("spotify_backup_client_secret");
      const customRedirectUri = await AsyncStorage.getItem("spotify_backup_redirect_uri");
      
      if (customClientId) setSpotifyClientId(customClientId);
      if (customClientSecret) setSpotifyClientSecret(customClientSecret);
      if (customRedirectUri) setSpotifyRedirectUri(customRedirectUri);
    } catch (err) {
      console.error("Failed to load Spotify credentials:", err);
    }
  };

  const saveManualCredentials = async () => {
    try {
      await saveSpotifyBackupConfig({
        userId: spotifyUserId,
        accessToken: spotifyAccessToken,
        refreshToken: spotifyRefreshToken,
        clientId: spotifyClientId || undefined,
        clientSecret: spotifyClientSecret || undefined,
        redirectUri: spotifyRedirectUri || undefined,
      });
      Alert.alert("Success", "Spotify credentials saved successfully.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const connectSpotify = async () => {
    try {
      const userId = await authorizeWithSpotify();
      await loadSpotifyCredentials();
      Alert.alert("Connected", `Successfully connected to Spotify account: ${userId}`);
    } catch (error) {
      Alert.alert("Authentication Failed", error.message);
    }
  };

  const disconnectSpotify = async () => {
    try {
      await clearSpotifyBackupConfig();
      setSpotifyUserId("");
      setSpotifyAccessToken("");
      setSpotifyRefreshToken("");
      setSpotifyClientId("");
      setSpotifyClientSecret("");
      setSpotifyRedirectUri("");
      Alert.alert("Disconnected", "Spotify account credentials removed.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  useEffect(() => {
    loadSpotifyCredentials();
  }, []);

  const [lowDataMode, setLowDataMode] = useState(false);
  const [theme, setTheme] = useState("Dark");
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [externalPath, setExternalPath] = useState("");
  const [batches, setBatches] = useState(0);
  const [group, setGroup] = useState(0);
  const [healthcheckactive,setHealthCheckActive] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "Dark" ? "Light" : "Dark");
  };
  const checkProxyStatus = async () => {
    const storedStatus = await AsyncStorage.getItem("PROXY_STATUS");
    if (storedStatus) {
    setProxyEnabled(true)

    }
    else{
        setProxyEnabled(false)
        setProxyUrl("");
    }
    const storedProxyUrl = await AsyncStorage.getItem("PROXY");
    if (storedProxyUrl) {
      setProxyUrl(storedProxyUrl);
    }
  }
  const toggleProxy = async () => {

    if (!proxyEnabled) {
        await AsyncStorage.setItem("PROXY_STATUS","active")
            setProxyEnabled(true);
    }
    else{
        await AsyncStorage.removeItem("PROXY_STATUS");
            setProxyEnabled(false);
    }

  }
  const submitproxy = async () => {
    if (proxyUrl.includes("socks5://") || proxyUrl.includes("http://") || proxyUrl.includes("https://")) {
        await AsyncStorage.setItem("PROXY",proxyUrl)
    }
    else{
        Alert.alert("Invalid Proxy URL", "Please enter a valid proxy URL starting with socks5://, http://, or https://");
    }
  }
  useEffect(() =>{
    checkProxyStatus();
  },[proxyEnabled])
  const deletedownloadedmetadata = async () => {
    let keys = await AsyncStorage.getAllKeys();
    console.log("Delete Started")
    await AsyncStorage.multiRemove(keys.filter((key) =>{return(key.includes("downloaded-track:"))}))
    await AsyncStorage.multiRemove(keys.filter((key) =>{return(key.includes("downloaded-track-order:"))}))
    await AsyncStorage.multiRemove(keys.filter((key) =>{return(key.includes("library-downloaded:"))}))
    
    console.log("Delete Finished.")
  }
  const handledownloadedmetadataconfirm = () => {
    Alert.alert(
      "Confirm Delete Downloaded Music Metadata",          // Title
      "Are you sure you want to proceed?", // Message
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => deletedownloadedmetadata() }
      ],
      { cancelable: true } // Allows closing by tapping outside on Android
    );
  };



// --------- chunk helper ----------
const chunk = (arr, size) =>
  arr.length ? [arr.slice(0, size), ...chunk(arr.slice(size), size)] : [];

// --------- request permissions ----------
async function requestExternalPermissions() {
  if (Platform.OS !== 'android') return true;

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  ]);

  return (
    result['android.permission.WRITE_EXTERNAL_STORAGE'] === 'granted' &&
    result['android.permission.READ_EXTERNAL_STORAGE'] === 'granted'
  );
}

// --------- MAIN EXPORT FUNCTION ----------
const exportAsyncStorageChunkedToExternal = async (
  fileName = 'asyncstorage-backup.json',
  batchSize = 20
) => {
  // 1. Read keys
  setExporting(true);
  const exists = await RNFS.exists(`${RNFS.DocumentDirectoryPath}/${fileName}`)
  if (exists){
    await RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${fileName}`)
  }

  const keys = await AsyncStorage.getAllKeys();
  const batches = chunk(keys, batchSize);
  setBatches(batches.length);

  const data = {};

  // 2. Resolve items in chunks
  for (const group of batches) {
    const reads = group.map(k => AsyncStorage.getItem(k));
     console.log('Exporting chunk:', group);
    const values = await Promise.all(reads);
    setGroup(group.length);

   

    group.forEach((key, i) => {
      
      
      if (!key.includes("userDataDirectory")){
        data[key] = values[i];
        console.log('Key:', key,);

      }
    });

  }
  setGroup(batches.length);
  console.log('Final data');

  const json = JSON.stringify(data, null, 2);


  // 3. Write JSON to internal storage
  const internalPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  await RNFS.writeFile(internalPath, json, 'utf8');

  // 4. Request Android permissions for external storage
  const granted = await requestExternalPermissions();
  if (!granted) throw new Error('Storage permissions denied');

  // 5. Copy the file to external Downloads folder
  const externalPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
  await RNFS.copyFile(internalPath, externalPath);
  
  setExporting(false);
  setExternalPath(externalPath);
  // 6. Return paths for convenience
  return {
    internalPath,
    externalPath
  };
};
const healthcheck = async () => {
  try{
      const response = await axios.get("https://music.caesaraihub.org/")
  let result = response.data
  if (result === "Welcome to CaesarAIMusicStreamYT."){
    setHealthCheckActive(true)
  }
  console.log(result)
  }
  catch{
    setHealthCheckActive(false)
  }

}
  useEffect(() => {
    const id = setInterval(() => {
      healthcheck()
      console.log("Running every 5 seconds");
      // call your function here
    }, 1000);

    return () => clearInterval(id); // cleanup
  }, []);
  return (
    <View style={styles.container}>
    <View style={{flexDirection:"row"}}>
    <TouchableOpacity style={{flex:1}} onPress={() =>{navigate(-1)}}>
    <AntDesign name="arrowleft" style={{fontSize:30}}/>
    </TouchableOpacity>

    </View>
      <View style={styles.header}>
        <Text style={styles.headerText}>Settings</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{padding: 20, paddingBottom: 60}}>
        <Text style={styles.sectionTitle}>Health Check</Text>
        <View style={styles.settingRow}>
          <Text style={[{height:20},styles.label]}>{healthcheckactive === true ? "Active" : "Not Active"}</Text>
          <View style={[{width:30,height:30,borderRadius:100,backgroundColor:healthcheckactive === true ? "green" : "red",bottom:8},styles.label]}>
  
     
          </View>
      </View>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingRow}>
          <Text style={styles.label}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#444", true: "#1db954" }}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.label}>Low Data Mode</Text>
          <Switch
            value={lowDataMode}
            onValueChange={setLowDataMode}
            trackColor={{ false: "#444", true: "#1db954" }}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.label}>Theme: {theme}</Text>
          <TouchableOpacity style={styles.button} onPress={toggleTheme}>
            <Text style={styles.buttonText}>Switch to {theme === "Dark" ? "Light" : "Dark"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Network</Text>
        <View>

    
        <Text style={styles.label}>Proxy Server URL</Text>
          <Text style={{marginBottom:20}} >https://www.freeproxy.world/</Text>

        
        <TextInput
          style={styles.input}
          value={proxyUrl}
          onChangeText={setProxyUrl}
          onSubmitEditing={async () => {submitproxy()}}
          placeholder="Enter proxy (e.g., socks5://104.248.203.234:1080)"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="url"
        />
        
        <TouchableOpacity style={[styles.button,{"backgroundColor":proxyEnabled ? "green": "#222222"}]} onPress={toggleProxy}>
            <Text style={styles.buttonText}>{proxyEnabled ? "Active":"Not Active"}</Text>
        </TouchableOpacity>
               
        </View>

        <Text style={styles.sectionTitle}>Spotify Backup Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.label}>Connected Account:</Text>
          <Text style={{color: spotifyUserId ? "#1db954" : "grey", fontSize: 16, fontWeight: "600"}}>{spotifyUserId || "Not Connected"}</Text>
        </View>
        <View style={{flexDirection: "row", gap: 10, marginBottom: 10}}>
          {!spotifyUserId ? (
            <TouchableOpacity style={[styles.button, {flex: 1, alignItems: "center"}]} onPress={connectSpotify}>
              <Text style={styles.buttonText}>Connect Spotify</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: "red", alignItems: "center"}]} onPress={disconnectSpotify}>
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: "#333", alignItems: "center"}]} onPress={() => setShowSpotifyDetails(!showSpotifyDetails)}>
            <Text style={styles.buttonText}>{showSpotifyDetails ? "Hide Config" : "Manual Config"}</Text>
          </TouchableOpacity>
        </View>

        {showSpotifyDetails && (
          <View style={{backgroundColor: "#1e1b1b", padding: 15, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: "#333"}}>
            <Text style={[styles.label, {fontSize: 14, marginBottom: 5}]}>Spotify User ID</Text>
            <TextInput
              style={[styles.input, {marginBottom: 10, padding: 8, fontSize: 14}]}
              value={spotifyUserId}
              onChangeText={setSpotifyUserId}
              placeholder="Spotify User ID"
              placeholderTextColor="#888"
            />
            <Text style={[styles.label, {fontSize: 14, marginBottom: 5}]}>Access Token</Text>
            <TextInput
              style={[styles.input, {marginBottom: 10, padding: 8, fontSize: 14}]}
              value={spotifyAccessToken}
              onChangeText={setSpotifyAccessToken}
              placeholder="Spotify User Access Token"
              placeholderTextColor="#888"
            />
            <Text style={[styles.label, {fontSize: 14, marginBottom: 5}]}>Refresh Token</Text>
            <TextInput
              style={[styles.input, {marginBottom: 10, padding: 8, fontSize: 14}]}
              value={spotifyRefreshToken}
              onChangeText={setSpotifyRefreshToken}
              placeholder="Spotify Refresh Token"
              placeholderTextColor="#888"
            />
            <Text style={[styles.label, {fontSize: 14, marginBottom: 5}]}>Client ID (Optional)</Text>
            <TextInput
              style={[styles.input, {marginBottom: 10, padding: 8, fontSize: 14}]}
              value={spotifyClientId}
              onChangeText={setSpotifyClientId}
              placeholder="Client ID (Defaults to app ID)"
              placeholderTextColor="#888"
            />
            <Text style={[styles.label, {fontSize: 14, marginBottom: 5}]}>Client Secret (Optional)</Text>
            <TextInput
              style={[styles.input, {marginBottom: 10, padding: 8, fontSize: 14}]}
              value={spotifyClientSecret}
              onChangeText={setSpotifyClientSecret}
              placeholder="Client Secret (Defaults to app Secret)"
              placeholderTextColor="#888"
              secureTextEntry
            />
            <Text style={[styles.label, {fontSize: 14, marginBottom: 5}]}>Redirect URI (Optional)</Text>
            <TextInput
              style={[styles.input, {marginBottom: 15, padding: 8, fontSize: 14}]}
              value={spotifyRedirectUri}
              onChangeText={setSpotifyRedirectUri}
              placeholder="caesaraimusic://callback"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={[styles.button, {alignItems: "center"}]} onPress={saveManualCredentials}>
              <Text style={styles.buttonText}>Save Credentials</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Scripts</Text>

          <TouchableOpacity style={[styles.button,{"backgroundColor": "red"}]} onPress={() =>{handledownloadedmetadataconfirm()}}>
            <Text style={styles.buttonText}>Delete Downloaded Metadata</Text>
        </TouchableOpacity>
        {exporting ? <Text style={{color:"white",marginTop:10}}>Exporting...</Text> : null}
        {batches > 0 ? <Text style={{color:"white",marginTop:10}}>Batches: {group}/{batches}</Text> : null}
        {externalPath !== "" ? <Text style={{color:"white",marginTop:10}}>Exported to now adb pull {externalPath}</Text> : null}
          <TouchableOpacity style={[styles.button,{"backgroundColor": "blue"},{"marginTop":20}]} onPress={() =>{exportAsyncStorageChunkedToExternal()}}>
            <Text style={styles.buttonText}>Export AsyncStorage Metadata</Text>
        </TouchableOpacity>



      </ScrollView>
                        
                  <ShowCurrentTrack/>
                  <ShowQueue/>
      
      
                  
                                  
                  <View style={{flex:0.018,backgroundColor:"#141212",justifyContent:"center",alignItems:"center"}}>
                      <TrackProgress seek={seek} setSeek={setSeek}/>
      
                  </View>
      
      
                  <NavigationFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141212",
  },
  header: {
    flex: 0.1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 0.9,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#2a2a2a",
    color: "white",
    padding: 15,
    borderRadius: 5,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#1db954",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});