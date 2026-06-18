#!/bin/bash
# Reversing the Metro port so the USB connected Android device can connect to the host machine
echo "Configuring adb reverse..."
adb reverse tcp:8081 tcp:8081

# Verify the Android device is connected via USB debugging
echo "Checking connected devices..."
adb devices

# Start the React Native Metro bundler
echo "Starting React Native Metro bundler..."
npx react-native start