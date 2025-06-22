import { View, Text, TextInput, StyleSheet, Switch, TouchableOpacity, Alert } from "react-native";
import { useEffect, useState } from "react";
import AntDesign from "react-native-vector-icons/AntDesign"
import { useNavigate } from "react-router-native";
import ShowCurrentTrack from "../ShowCurrentTrack/ShowCurrentTrack";
import ShowQueue from "../ShowQueue/showqueue";
import TrackProgress from "../TrackProgress/TrackProgress";
import NavigationFooter from "../NavigationFooter/NavigationFooter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { set } from "lodash";
export default function Settings({ seek, setSeek, currentTrack, setCurrentTrack }) {
    const navigate = useNavigate();
  const [proxyUrl, setProxyUrl] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [theme, setTheme] = useState("Dark");
  const [proxyEnabled, setProxyEnabled] = useState(false);

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
      <View style={styles.content}>
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



      </View>
                        
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
    padding: 20,
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