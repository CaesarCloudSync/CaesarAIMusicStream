cd android
./gradlew assembleRelease
adb install android/app/build/outputs/apk/release/app-release.apk
git add .
git commit -m "$1"
git push origin
