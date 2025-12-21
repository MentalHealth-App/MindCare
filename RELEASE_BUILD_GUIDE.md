# Release Build Guide for MindCare App

## ✅ Your Deployed Backends:

1. **Node.js Server**: https://mindcare-w3vj.onrender.com
2. **Python Flask Server**: https://mindcare-audio-analyzer.onrender.com

Both are now live! 🎉

---

## Step 1: Update Production URLs ✅

I've already updated `src/utils/api.js` to use your production URLs.

**Current Settings:**
- `USE_PRODUCTION = true` → Uses Render URLs
- Change to `false` if you want to test locally

---

## Step 2: Build Release APK (Android)

### Option A: Generate Signed APK (For Google Play Store)

#### 1. Generate Keystore (One-time setup)

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore mindcare-release-key.keystore -alias mindcare-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**You'll be asked:**
- Password (remember this!)
- Name, Organization, etc.

#### 2. Configure Gradle for Signing

Create/edit `android/gradle.properties` and add:

```properties
MINDCARE_RELEASE_STORE_FILE=mindcare-release-key.keystore
MINDCARE_RELEASE_KEY_ALIAS=mindcare-key-alias
MINDCARE_RELEASE_STORE_PASSWORD=your_keystore_password
MINDCARE_RELEASE_KEY_PASSWORD=your_key_password
```

#### 3. Update `android/app/build.gradle`

Add signing config (after `android {` block):

```gradle
android {
    ...
    
    signingConfigs {
        release {
            if (project.hasProperty('MINDCARE_RELEASE_STORE_FILE')) {
                storeFile file(MINDCARE_RELEASE_STORE_FILE)
                storePassword MINDCARE_RELEASE_STORE_STORE_PASSWORD
                keyAlias MINDCARE_RELEASE_KEY_ALIAS
                keyPassword MINDCARE_RELEASE_KEY_PASSWORD
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 4. Build Release APK

```bash
cd android
./gradlew assembleRelease
```

**APK location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

### Option B: Quick Debug APK (For Testing)

```bash
cd android
./gradlew assembleDebug
```

**APK location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Step 3: Build Release AAB (Google Play Store)

For Google Play Store, you need an **AAB** (Android App Bundle), not APK:

```bash
cd android
./gradlew bundleRelease
```

**AAB location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Step 4: Install APK on Device

### Method 1: Via ADB (USB)

```bash
# Connect device via USB
# Enable USB debugging on device
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Method 2: Transfer File

1. Copy `app-release.apk` to your Android device
2. Enable "Install from Unknown Sources" in device settings
3. Open APK file and install

---

## Step 5: Update App Version (Optional)

Before release build, update version:

**Edit `android/app/build.gradle`:**

```gradle
android {
    defaultConfig {
        versionCode 2  // Increment for each release
        versionName "1.0.1"  // Your app version
    }
}
```

---

## Production Checklist:

- [x] ✅ Backends deployed (Node.js + Python Flask)
- [x] ✅ Production URLs configured in React Native app
- [ ] Generate keystore (one-time)
- [ ] Configure Gradle signing
- [ ] Build release APK/AAB
- [ ] Test on real device
- [ ] Upload to Google Play Store (if needed)

---

## Environment Variables:

**Make sure your Render servers have:**
- ✅ MongoDB connection string
- ✅ JWT secret key
- ✅ Any other required env vars

---

## Testing Production Build:

1. Build release APK
2. Install on device
3. Test all features:
   - Login/Signup
   - Voice recording
   - Audio analysis
   - History
4. Verify it connects to Render URLs (not localhost)

---

## Troubleshooting:

### "Keystore not found"
- Make sure keystore file is in `android/app/`
- Check path in `gradle.properties`

### "App won't install"
- Uninstall old version first: `adb uninstall com.mindcareapp`
- Check if device allows unknown sources

### "Can't connect to backend"
- Verify Render URLs are correct in `api.js`
- Check Render service is running (not spun down)
- Check network permissions in AndroidManifest.xml

---

**Your app is ready for release! Build the APK and test it!** 🚀

