# Cordova Plugin for adding Intents support to an existing iOS Project dynamically

This plugin extends your ios project by parsing and modifying the project.pbxproj file using [cordova-node-xcode](https://github.com/apache/cordova-node-xcode). The Intent extension will be added to the XCode-Project everytime a `cordova platform add ios` is done.

## Usage

### 1. Provisioning profile
* Create an exclusive new provisioning profile for the ios intent target.
* Once it's created, download it, rename the file using its own UUID number as the file name (preserving the file extension) and zip it with the following name: 
* provisioning-profiles.zip
* Then move the zip file to the "src/ios/provisioning-profiles" folder

### 2. Install the plugin
* For installing the plugin you must provide the following initial variables: 

#### * INTENT_NAME
The ID name for the Plugin Intent (eg. "MyAppIntent" 

#### * INTENT_BUNDLE_SUFFIX
The Intent's bundle suffix. We suggest using the same string as the INTENT_NAME (eg: "MyAppIntent") 

#### * PROVISIONING_PROFILES
You must provide the App Bundle ID used for the mais project + the INTENT_NAME + the provisioning profile UUID:
{'com.mycompany.MyApp.MyAppIntent':'e062de98-e4bd-44b6-bf45-75f3b30adaf2'}" 

#### * DEVELOPMENT_TEAM
The development team string (related to your Apple ID) being used (eg. "84FAZ4VLW6")

#### * CERTIFICATE_TYPE
The certificate type being used (eg. "Apple Development")

#### * EXTENSION_NAME
We also suggest using the same string as the INTENT_NAME (eg. "MyAppIntent")

#### * APP_BUNDLE_ID
The Bundle ID being used for the main app (eg. "com.mycompany.MyApp")



#### Example:
* For installing`cordova plugin add https://github.com/andregrillo/outsystems-plugin-intents.git` + the initial variables mentioned above.
* This will not modify anything yet because the hooks only run `after_platform_add`

```
cordova plugin add https://github.com/andregrillo/outsystems-plugin-intents.git --variable INTENT_NAME="MyAppIntent" --variable INTENT_BUNDLE_SUFFIX="MyAppIntent" --variable PROVISIONING_PROFILES="{'com.mycompany.MyApp.MyAppIntent':'e062de98-e4bd-44b6-bf45-75f3b30adaf2'}" --variable DEVELOPMENT_TEAM="84FAZ4VLW6" --variable CERTIFICATE_TYPE="Apple Development" --variable EXTENSION_NAME="MyAppIntent" --variable APP_BUNDLE_ID="com.mycompany.MyApp"
```

