// @ts-check

var fs = require('fs');
var path = require('path');
var Q = require('q');
var {getCordovaParameter, log} = require('./utils')

console.log('\x1b[40m');
log(
  'Running copyResourceFiles hook, copying Resource files folder to www...',
  'start'
);

// http://stackoverflow.com/a/26038979/5930772
var copyFileSync = function(source, target) {
  var targetFile = target;

  // If target is a directory a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
};
var copyFolderRecursiveSync = function(source, targetFolder) {
  var files = [];

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function(file) {
      var curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
      var targetFile = path.join(targetFolder,file);
      var fileExists = fs.existsSync(targetFile);
      if (fileExists){
        log("file "+targetFile+" copied with success", "success");
      } else {
        log("file "+targetFile+" copied without success", "error");
      }
    });
  }
};

module.exports = function(context) {
  var deferral = new Q.defer();

  //var iosFolder = context.opts.cordova.project
  //  ? context.opts.cordova.project.root
  //  : path.join(context.opts.projectRoot, 'platforms/ios/');
  //fs.readdir(context.opts.cordova.project.root, function(err, data) {
    //var projectFolder;
    //var projectName;
    //var srcFolder;
    // Find the project folder by looking for *.xcodeproj
    //if (data && data.length) {
    //  data.forEach(function(folder) {
    //    if (folder.match(/\.xcodeproj$/)) {
    //      projectFolder = path.join(iosFolder, folder);
    //      projectName = path.basename(folder, '.xcodeproj');
    //    }
    //  });
    //}

    //if (!projectFolder || !projectName) {
    //  log('Could not find an .xcodeproj folder in: ' + iosFolder, 'error');
    //}

    //Copy Intent
    var srcFolderIntent = path.join(
      context.opts.plugin.dir,
      'src/ios/Intent'//,
     // '/'
    );

    if (!fs.existsSync(srcFolderIntent)) {
      log(
        'Missing Resources folder in ' + srcFolderIntent,
        'error'
      );
    }
    
    var contents = fs.readFileSync(
        path.join(context.opts.projectRoot, 'config.xml'),
        'utf-8'
    );
    
    // Get the intent name and location from the parameters or the config file
    var INTENT_NAME = getCordovaParameter("INTENT_NAME", contents);

    var intentTargetFolder = context.opts.cordova.project
    ? context.opts.cordova.project.root
    : path.join(context.opts.projectRoot, 'www', INTENT_NAME);


    //targetFolder = path.join(targetFolder, 'Intent/');

    if (!fs.existsSync(intentTargetFolder)){
        fs.mkdirSync(intentTargetFolder);
    }


    //var targetFolder = path.join(
    //  rootFolder,
    //  'www'
    //)

    // Copy provisioning profiles
    copyFolderRecursiveSync(
      srcFolderIntent,
      intentTargetFolder
    );
    log('Successfully copied Resources folder!', 'success');
    console.log('\x1b[0m'); // reset

    //Adding the correct app group to the intent entitlements file
    var intentEntitlementsFilePath = path.join(intentTargetFolder,'Intent.entitlements');

     var intentEntitlementsContents = fs.readFileSync(
        //path.join(targetFolderAppDelegate, 'AppDelegate.m'),
        intentEntitlementsFilePath,
        'utf-8'
    );

    // Injecting the correct appgroup to the intent.entitlements
    var APP_BUNDLE_ID = getCordovaParameter("APP_BUNDLE_ID", contents);
    intentEntitlementsContents = intentEntitlementsContents.replace(/__APP_BUNDLE_ID__/g, APP_BUNDLE_ID);

    fs.writeFileSync(intentEntitlementsFilePath, intentEntitlementsContents);
    log('Successfully added app group to the Intent.entitlements!', 'success');
    
    //Renames the intent entitlement file to the intent name
    var intentTargetEntitlementsFilePath = path.join(intentTargetFolder, INTENT_NAME + '.entitlements');
    fs.rename(intentEntitlementsFilePath, intentTargetEntitlementsFilePath, function(err) {
        if ( err ) log('ERROR: ' + err, 'error');
    });



    //Renames the NSExtensionPrincipalClass intent in the Intent-Info.plist
    var intentPlistFilePath = path.join(intentTargetFolder,'Intent-Info.plist');
    
    var intentTargetPlistFilePath = path.join(intentTargetFolder, INTENT_NAME + '-Info.plist');
    fs.rename(intentPlistFilePath, intentTargetPlistFilePath, function(err) {
        if ( err ) log('ERROR: ' + err, 'error');
    });    



    //Editing the plugin.xml to add the app group
    var pluginXMLFilePath = path.join(context.opts.plugin.dir,'plugin.xml');

     var pluginXMLContents = fs.readFileSync(
        //path.join(targetFolderAppDelegate, 'AppDelegate.m'),
        pluginXMLFilePath,
        'utf-8'
    );

    // Injecting the correct appgroup to the plugin.xml
    var APP_BUNDLE_ID = getCordovaParameter("APP_BUNDLE_ID", contents);
    pluginXMLContents = pluginXMLContents.replace(/__APP_IDENTIFIER__/g, APP_BUNDLE_ID);

    fs.writeFileSync(pluginXMLFilePath, pluginXMLContents);
    log('Successfully added app group to the plugin.xml!', 'success');




  //Copy provisioning profile
  var srcFolderProvProf = path.join(
      context.opts.plugin.dir,
      'src/ios/provisioning-profiles'//,
      //'/'
    );

    if (!fs.existsSync(srcFolderProvProf)) {
      log(
        'Missing provisioning-profiles folder in ' + srcFolderProvProf,
        'error'
      );
    }
    //var rootFolder = context.opts.cordova.project.root;
    //var targetFolder = path.join(
    //  rootFolder,
    //  'www'
    //)

    var targetFolder = context.opts.cordova.project
    ? context.opts.cordova.project.root
    : path.join(context.opts.projectRoot, 'www/');

    targetFolder = path.join(targetFolder, 'provisioning-profiles/');

    if (!fs.existsSync(targetFolder)){
        fs.mkdirSync(targetFolder);
    }

    // Copy provisioning profiles
    copyFolderRecursiveSync(
      srcFolderProvProf,
      targetFolder
    );
    log('Successfully copied provisioning-profiles folder!', 'success');
    console.log('\x1b[0m');

    //Inject UserActivity Method in AppDelegate.m

    var sourceFolderAppDelegate = path.join(
      context.opts.plugin.dir,
      'src/ios/AppDelegate'//,
      //'/'
    );

    var sourceAppDelegateContents = fs.readFileSync(
        path.join(sourceFolderAppDelegate, 'AppDelegateUserActivity.m'),
        'utf-8'
    );

    var iosFolder = context.opts.cordova.project
      ? context.opts.cordova.project.root
      : path.join(context.opts.projectRoot, 'platforms/ios/');
    fs.readdir(iosFolder, function(err, data) {
      var projectFolder;
      var projectName;
      // Find the project folder by looking for *.xcodeproj
      if (data && data.length) {
        data.forEach(function(folder) {
          if (folder.match(/\.xcodeproj$/)) {
            projectFolder = path.join(iosFolder, folder);
            projectName = path.basename(folder, '.xcodeproj');
          }
        });
      }

      if (!projectFolder || !projectName) {
        log('Could not find an .xcodeproj folder in: ' + iosFolder, 'error');
      }

    //console.log("➡️ projectFolder: " + projectFolder);
    //console.log("➡️ projectName: " + projectName);

    var targetFolderAppDelegate = path.join(
      iosFolder,
      projectName,
      'Classes'
      //'/'
    );

    //console.log("➡️ targetFolderAppDelegate: " + targetFolderAppDelegate);

    var targetAppDelegateFilePath = path.join(targetFolderAppDelegate, 'AppDelegate.m');
    //console.log("➡️ targetAppDelegateFilePath: " + targetAppDelegateFilePath);

    var targetAppDelegateContents = fs.readFileSync(
        //path.join(targetFolderAppDelegate, 'AppDelegate.m'),
        targetAppDelegateFilePath,
        'utf-8'
    );

    // Injecting continueUserActivity method in App's AppDelegate.m
    targetAppDelegateContents = targetAppDelegateContents.replace(/@end/g, sourceAppDelegateContents);

    // Injecting the App's BundleID into the UserActivity
    // Firstly, get the intent name and location from the parameters or the config file
    //var APP_BUNDLE_ID = getCordovaParameter("APP_BUNDLE_ID", contents);
    targetAppDelegateContents = targetAppDelegateContents.replace(/__APP_BUNDLE_ID__/g, APP_BUNDLE_ID);
    // Adding "#import" the Keychain wrapper .h to the App´s AppDelegate.m
    //targetAppDelegateContents = targetAppDelegateContents.replace(/#import "AppDelegate.h"/g, '#import "AppDelegate.h"\n#import "NSDictionary+KeychainWrapper.h"');

    fs.writeFileSync(targetAppDelegateFilePath, targetAppDelegateContents);
    log('Successfully added continueUserActivity method to the app´s AppDelegate.m!', 'success');

    // Update IntentHandler.swift UserActivity activityType with the correct BundleID
    var intentHandlerFilePath = path.join(
      intentTargetFolder,
      'IntentHandler.swift'
      //'/'
    );
    var intentHandlerContents = fs.readFileSync(
        intentHandlerFilePath,
        'utf-8'
    );

    // Injecting continueUserActivity method in App's AppDelegate.m
    intentHandlerContents = intentHandlerContents.replace(/__APP_BUNDLE_ID__/g, APP_BUNDLE_ID);
    fs.writeFileSync(intentHandlerFilePath, intentHandlerContents);

    log('Successfully added BundleID to the IntentHandler.swift!', 'success');

    deferral.resolve();
  });

  return deferral.promise;
};
