import init from 'react_native_mqtt';
import { autoplaynextsong } from '../controls/controls';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer from 'react-native-track-player';
init({
    size: 10000,
    storageBackend: AsyncStorage,
    defaultExpires: 1000 * 3600 * 24,
    enableCache: true,
    sync : {}
  });
  
  // 创建客户端实例
  const options = {
    host: 'broker.emqx.io',
    port: 8083,
    path: '/testTopic',
    id: 'id_' + parseInt(Math.random()*100000)
  };
export let client = new Paho.MQTT.Client(options.host, options.port, options.path);
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;
function onConnectionLost (responseObject){
    if (responseObject.errorCode !== 0) {
      console.log('onConnectionLost:' + responseObject.errorMessage);
    }
  }
  // 收到消息
  function onMessageArrived(message) {
    console.log('onMessageArrived:Back',message.payloadString);
    autoplaynextsong()
    // this.MessageListRef.scrollToEnd({animated: false});
  }
const sendMessage = async  () =>{
    let current_payloadkey = await AsyncStorage.getItem("current_payloadkey")
    let current_topic = await AsyncStorage.getItem("current_topic")
    let topic =!current_topic ? 'caesaraimusicstreamconnect/current-track'  : current_topic 
    let payloadkey = !current_payloadkey ? "music_connect_next_track" : current_payloadkey
    let music_connect_next_song = await AsyncStorage.getItem(payloadkey)
    console.log("sendingmessage",music_connect_next_song)
    var messagesend = new Paho.MQTT.Message(music_connect_next_song);
    messagesend.destinationName = topic;
    client.send(messagesend);
    console.log(topic )
    if (!topic.includes("/pause")){
        await TrackPlayer.setVolume(0)
        await TrackPlayer.setRate(0.00000000001)
        await TrackPlayer.play()
    }

    //await TrackPlayer.pause();
}


async function subscribeTopic (){
    //console.log("subscribing","caesaraimusicstreamconnect/song-end")
    
    let current_subscribe_topic = await AsyncStorage.getItem("current_subscribe_topic")
    let subscribe_topic = !current_subscribe_topic ? "caesaraimusicstreamconnect/song-end" : current_subscribe_topic
    client.subscribe(subscribe_topic);
  }
async function onConnect (){

    console.log('onConnectHello');
    await sendMessage();
    await subscribeTopic()

    //sendMessage()

    //this.subscribeTopic()
  }
  // 连接失败
  function onFailure (err) {
    console.log('Connect failed!');
    console.log(err);
  }
 export const sendmusicconnect = async () =>{
  

      if (!client.isConnected()){
        console.log("music_conncted_connect")
        client.connect({
            onSuccess:onConnect,
            useSSL: false,
            timeout: 1000,
            onFailure: onFailure
          });
      }
      else{
        console.log("music_conncted_send")
        await sendMessage();
      }

}


