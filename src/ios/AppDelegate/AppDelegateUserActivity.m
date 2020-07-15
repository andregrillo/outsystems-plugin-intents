-(BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> *restorableObjects))restorationHandler {
    
    if ([userActivity.activityType isEqual: @"com.outsystems.OutSystemsBank.SiriTransfer"]) {
        double amount = [[userActivity.userInfo valueForKey:@"amount"] doubleValue];
        NSString *type = [userActivity.userInfo valueForKey:@"type"];
        NSString *payee = [userActivity.userInfo valueForKey:@"payee"];
        
        NSDictionary *operation = [NSDictionary dictionaryWithObjectsAndKeys:type,@"type",[NSNumber numberWithDouble:amount],@"amount",payee,@"contact", nil];

        [self storeOperationToUserDefaults:operation];
        
        //Notification to be removed
//        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Message directly from Siri!"
//                                                        message:[NSString stringWithFormat:@"Your last operation was a %@ of %.2f€ to %@", type, amount, payee]
//                                                         delegate:nil
//                                                cancelButtonTitle:@"OK"
//                                                otherButtonTitles:nil];
//        [alert show];
    }
    
    else if ([userActivity.activityType isEqual: @"com.outsystems.OutSystemsBank.SiriRequest"]) {
        double amount = [[userActivity.userInfo valueForKey:@"amount"] doubleValue];
        NSString *type = [userActivity.userInfo valueForKey:@"type"];
        NSString *payer = [userActivity.userInfo valueForKey:@"payer"];
        
        NSDictionary *operation = [NSDictionary dictionaryWithObjectsAndKeys:type,@"type",[NSNumber numberWithDouble:amount],@"amount",payer,@"contact", nil];

        [self storeOperationToUserDefaults:operation];
        
        //Notification to be removed
//        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Message directly from Siri!"
//                                                        message:[NSString stringWithFormat:@"Your last operation was a %@ of %.2f€ from %@", type, amount, payer]
//                                                         delegate:nil
//                                                cancelButtonTitle:@"OK"
//                                                otherButtonTitles:nil];
//        [alert show];
    }
    else {
        NSLog(@"The UserActivity received from Siri is invalid");
    }
    
    return YES;
}

- (void)storeOperationToUserDefaults:(NSDictionary *)dict{
    NSString *type = dict[@"type"];
    NSString *contact = dict[@"contact"];
    
    [[NSUserDefaults standardUserDefaults] setValue:type forKey:@"operationType"];
    [[NSUserDefaults standardUserDefaults] setObject:contact forKey:@"operationContact"];
    [[NSUserDefaults standardUserDefaults] setDouble:[dict[@"amount"] doubleValue] forKey:@"operationAmount"];
    [[NSUserDefaults standardUserDefaults] synchronize];
}

- (void)storeOperationToKeychain:(NSDictionary *)dict{
    // serialize dict
    NSData *serializedDictionary = [NSKeyedArchiver archivedDataWithRootObject:dict];
    // encrypt in keychain
    // first, delete potential existing entries with this key (it won't auto update)
    [self deleteOperationFromKeychain];

    // setup keychain storage properties
    NSDictionary *storageQuery = @{
        (__bridge id)kSecAttrAccount: @"operation",
//#if TARGET_IPHONE_SIMULATOR
// Ignore the access group if running on the iPhone simulator.
//
// Apps that are built for the simulator aren't signed, so there's no keychain access group
// for the simulator to check. This means that all apps can see all keychain items when run
// on the simulator.
//
// If a SecItem contains an access group attribute, SecItemAdd and SecItemUpdate on the
// simulator will return -25243 (errSecNoAccessForItem).
//#else
//        (__bridge id)kSecAttrAccessGroup: accessGroup,
//#endif
        (__bridge id)kSecValueData: serializedDictionary,
        (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
        (__bridge id)kSecAttrAccessible: (__bridge id)kSecAttrAccessibleWhenUnlocked
    };
    OSStatus status = SecItemAdd ((__bridge CFDictionaryRef)storageQuery, nil);
    if (status != noErr)
    {
        NSLog (@"%d %@", (int)status, @"Couldn't save Operation Dictionary to Keychain.");
    } else {
        NSLog(@"Operation dictionary saved on Keychain");
    }
}

- (void)deleteOperationFromKeychain{
    // setup keychain query properties
    NSDictionary *deletableItemsQuery = @{
        (__bridge id)kSecAttrAccount: @"operation",
//#if TARGET_IPHONE_SIMULATOR
// Ignore the access group if running on the iPhone simulator.
//
// Apps that are built for the simulator aren't signed, so there's no keychain access group
// for the simulator to check. This means that all apps can see all keychain items when run
// on the simulator.
//
// If a SecItem contains an access group attribute, SecItemAdd and SecItemUpdate on the
// simulator will return -25243 (errSecNoAccessForItem).
//#else
//        (__bridge id)kSecAttrAccessGroup: accessGroup,
//#endif
        (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
        (__bridge id)kSecMatchLimit: (__bridge id)kSecMatchLimitAll,
        (__bridge id)kSecReturnAttributes: (id)kCFBooleanTrue
    };

    CFArrayRef itemList = nil;
    OSStatus status = SecItemCopyMatching ((__bridge CFDictionaryRef)deletableItemsQuery, (CFTypeRef *)&itemList);
    // each item in the array is a dictionary
    NSArray *itemListArray = (__bridge NSArray *)itemList;
    for (NSDictionary *item in itemListArray)
    {
        NSMutableDictionary *deleteQuery = [item mutableCopy];
        [deleteQuery setValue:(__bridge id)kSecClassGenericPassword forKey:(__bridge id)kSecClass];
        // do delete
        status = SecItemDelete ((__bridge CFDictionaryRef)deleteQuery);
        if (status != noErr)
        {
            NSLog (@"%d %@", (int)status, @"Couldn't delete Operation Dictionary from Keychain.");
        }
    }
}

- (NSDictionary *)operationDictionaryFromKeychain {
    // setup keychain query properties
    NSDictionary *readQuery = @{
        (__bridge id)kSecAttrAccount: @"operation",
//#if TARGET_IPHONE_SIMULATOR
// Ignore the access group if running on the iPhone simulator.
//
// Apps that are built for the simulator aren't signed, so there's no keychain access group
// for the simulator to check. This means that all apps can see all keychain items when run
// on the simulator.
//
// If a SecItem contains an access group attribute, SecItemAdd and SecItemUpdate on the
// simulator will return -25243 (errSecNoAccessForItem).
//#else
//        (__bridge id)kSecAttrAccessGroup: accessGroup,
//#endif
        (__bridge id)kSecReturnData: (id)kCFBooleanTrue,
        (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword
    };

    CFDataRef serializedDictionary = NULL;
    OSStatus status = SecItemCopyMatching ((__bridge CFDictionaryRef)readQuery, (CFTypeRef *)&serializedDictionary);
    if (status == noErr)
    {
        // deserialize dictionary
        NSData *data = (__bridge NSData *)serializedDictionary;
        NSDictionary *storedDictionary = [NSKeyedUnarchiver unarchiveObjectWithData:data];
        NSLog([NSString stringWithFormat:@"Operation loaded from Keychain: %@", storedDictionary]);
        return storedDictionary;
    }
    else
    {
        NSLog (@"%d %@", (int)status, @"Couldn't read from Keychain.");
        return nil;
    }
}

@end