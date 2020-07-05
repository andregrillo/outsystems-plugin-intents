//
//  IntentHandler.swift
//  Transfer intent
//
//  Created by Andre Grillo on 15/06/2020.
//  Copyright © 2020 OutSystems. All rights reserved.
//

import Intents

class IntentHandler: INExtension {}

extension IntentHandler: INSendPaymentIntentHandling {
    func handle(intent: INSendPaymentIntent, completion: @escaping (INSendPaymentIntentResponse) -> Void) {
        
        // Handling the transfer
        if let currencyAmount = intent.currencyAmount {
            
            // Creating a user activity to pass it to our application
            let activity = NSUserActivity(activityType: "__APP_BUNDLE_ID__.SiriTransfer")

            // Checking the info's consistance received from Siri
            let payee = intent.payee?.displayName ?? "Payee Not Available"
            if let amount = currencyAmount.amount {
                // Passing a dictionary as a parameter to the userinfo
                activity.userInfo = ["amount": amount.doubleValue, "type": "transfer", "payee": payee]
                let response = INSendPaymentIntentResponse.init(code: .inProgress, userActivity: activity)

                // By providing a userActivity to the intent response, Siri will open up the app and continue the payment there
                completion(response)
                
            } else {
                completion(INSendPaymentIntentResponse(code: .failure, userActivity: nil))
            }

        } else {
            completion(INSendPaymentIntentResponse(code: .failure, userActivity: nil))
        }
    }
}

extension IntentHandler: INRequestPaymentIntentHandling {
    func handle(intent: INRequestPaymentIntent, completion: @escaping (INRequestPaymentIntentResponse) -> Void) {
        
        // Handling the request
        if let currencyAmount = intent.currencyAmount {
            
            // Creating a user activity to pass it to our application
            let activity = NSUserActivity(activityType: "__APP_BUNDLE_ID__.SiriRequest")

            // Checking the info's consistance received from Siri
            let payer = intent.payer?.displayName ?? "Payer Not Available"
            if let amount = currencyAmount.amount {
                // Passing a dictionary as a parameter to the userinfo
                activity.userInfo = ["amount": amount.doubleValue, "type": "request", "payer": payer]
                let response = INRequestPaymentIntentResponse.init(code: .inProgress, userActivity: activity)

                // By providing a userActivity to the intent response, Siri will open up the app and continue the payment there
                completion(response)
                
            } else {
                completion(INRequestPaymentIntentResponse(code: .failure, userActivity: nil))
            }

        } else {
            completion(INRequestPaymentIntentResponse(code: .failure, userActivity: nil))
        }
    }
}
