/**
 * FULL DYNAMIC PRICE WATCHER (BLUEPRINT)
 * 
 * This is the Node.js code for a Firebase Cloud Function.
 * It monitors Augmont Rates and triggers FCM Push Notifications
 * even when the user's app is CLOSED.
 * 
 * Deployment: firebase deploy --only functions
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// 1. CHECK RATES EVERY 5 MINUTES
exports.priceWatcherManual = onSchedule("every 5 minutes", async (event) => {
    try {
        console.log("Checking Market Rates...");
        
        // --- A. GET CURRENT RATES FROM AUGMONT ---
        // (Mocking fetch for blueprint)
        const response = await fetch('https://api.augmont.com/v1/live-rates');
        const rateData = await response.json();
        
        const goldRate = rateData?.result?.data?.goldBuyRate; // e.g. 7200
        const silverRate = rateData?.result?.data?.silverBuyRate; // e.g. 85

        if (!goldRate) return;

        // --- B. FIND ALL USERS WITH MATCHING ALERTS ---
        const alertsSnapshot = await db.collectionGroup('alerts')
            .where('enabled', '==', true)
            .get();

        const notifications = [];

        alertsSnapshot.forEach(doc => {
            const alert = doc.data();
            const userId = doc.ref.parent.parent.id;
            const currentPrice = alert.type === 'gold' ? goldRate : silverRate;

            let isTriggered = false;
            if (alert.condition === 'above' && currentPrice >= alert.targetPrice) isTriggered = true;
            if (alert.condition === 'below' && currentPrice <= alert.targetPrice) isTriggered = true;

            if (isTriggered) {
                // ADD TO PUSH QUEUE
                notifications.push(sendPushToUser(userId, alert, currentPrice));
                
                // DISABLE ALERT TO PREVENT SPAM
                doc.ref.update({ enabled: false, triggered: true, triggeredAt: admin.firestore.FieldValue.serverTimestamp() });
            }
        });

        await Promise.all(notifications);
        console.log(`Sent ${notifications.length} price alerts!`);

    } catch (error) {
        console.error("Price Watcher Error:", error);
    }
});

// 2. HELPER TO SEND FCM MESSAGE
async function sendPushToUser(uid, alert, triggerPrice) {
    // A. Get User's Push Token
    const userDoc = await db.collection('users').doc(uid).get();
    const pushToken = userDoc.data()?.pushToken;

    if (!pushToken || pushToken === 'no-token' || pushToken === 'expo-go-mock-token') {
        console.log(`No valid push token for user: ${uid}`);
        return;
    }

    const message = {
        token: pushToken,
        notification: {
            title: `🔔 Price Alert: ${alert.type.toUpperCase()}`,
            body: `Target reached! ${alert.type} is now ₹${triggerPrice.toLocaleString('en-IN')}.`,
        },
        data: {
            screen: 'price-alerts',
            alertId: alert.id,
            click_action: 'FLUTTER_NOTIFICATION_CLICK', // Legacy compatibility
        },
        android: {
            priority: 'high',
            notification: {
                channelId: 'default',
            },
        },
    };

    try {
        await admin.messaging().send(message);
        console.log(`Push sent successfully to user ${uid}`);
    } catch (e) {
        console.error("FCM Send Error:", e);
    }
}
