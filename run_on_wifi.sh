It sounds like you're asking about **AADB wireless** in React Native — I'm guessing you mean **ADB over Wi-Fi** (Android Debug Bridge wireless debugging) so you can run and debug your React Native app without a USB cable.

Here's how to set that up:

---

### **1. Make sure your phone and computer are on the same Wi-Fi**

* If they're not on the same network, ADB wireless won't work.

---

### **2. Connect your phone with USB once**

You'll need the USB just for the initial pairing.

In your terminal:

```bash
adb devices
```

Make sure your device shows up.

---

### **3. Enable TCP/IP mode**

Run:

```bash
adb tcpip 5555
```

This tells your phone to listen for ADB connections over port `5555`.

---

### **4. Find your phone's IP address**

On Android:

* Go to **Settings → About Phone → Status → IP address**
  (or check under **Wi-Fi network details**).

---

### **5. Connect over Wi-Fi**

In your terminal:

```bash
adb connect <PHONE_IP>:5555
```

Example:

```bash
adb connect 192.168.1.42:5555
```

You should see:

```
connected to 192.168.1.42:5555
```

---

### **6. Unplug USB & run your React Native app**

For example:

```bash
npx react-native run-android
```

or, if the app is already installed, just:

```bash
npx react-native start
```

---

💡 **Tip:** If you're on **Android 11+**, you can also use **Wireless Debugging** in Developer Options → *Pair device with pairing code* (no USB needed at all after first pairing).

---

If you want, I can give you the **one-command React Native ADB wireless shortcut** so you don't have to type all these steps each time.
Do you want me to prepare that?
