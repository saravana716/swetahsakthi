/**
 * SWARNA SAKTHI: 24/7 DYNAMIC PRICE WATCHER (v1 Stable)
 * 
 * Works even when the app is CLOSED or KILLED.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// --- 1. PRICE WATCHER CRON JOB (v1) ---
// Runs every 5 minutes 
exports.priceWatcher = functions.pubsub
    .schedule("every 5 minutes")
    .onRun(async (context) => {
        try {
            console.log("[WATCHER] Checking market rates...");
            
            const response = await fetch('https://api.augmont.com/v1/live-rates', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            const fullData = await response.json();
            
            const rates = fullData?.result?.data?.rates;
            const gBuy = parseFloat(rates?.gBuy);
            const sBuy = parseFloat(rates?.sBuy);

            if (isNaN(gBuy) || isNaN(sBuy)) {
                console.error("[WATCHER] Invalid rates received:", rates);
                return null;
            }

            console.log(`[WATCHER] Live Rates -> Gold: ${gBuy}, Silver: ${sBuy}`);

            const alertsSnapshot = await db.collectionGroup('alerts')
                .where('enabled', '==', true)
                .get();

            if (alertsSnapshot.empty) {
                console.log("[WATCHER] No active alerts.");
                return null;
            }

            const notifications = [];

            for (const doc of alertsSnapshot.docs) {
                const alert = doc.data();
                const userId = doc.ref.parent.parent.id;
                
                const currentPrice = alert.type === 'gold' ? gBuy : sBuy;
                let isTriggered = false;

                if (alert.condition === 'above' && currentPrice >= alert.targetPrice) isTriggered = true;
                if (alert.condition === 'below' && currentPrice <= alert.targetPrice) isTriggered = true;

                if (isTriggered) {
                    console.log(`[WATCHER] Match found for User: ${userId}`);
                    
                    notifications.push(triggerPushNotification(userId, alert, currentPrice));
                    
                    await doc.ref.update({
                        enabled: false,
                        triggered: true,
                        triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
                        lastTriggeredPrice: currentPrice
                    });

                    await db.collection('users').doc(userId).collection('notifications').add({
                        title: `🔔 Price Alert: ${alert.type.toUpperCase()}`,
                        message: `Target reached! ${alert.type} is now ₹${currentPrice.toLocaleString('en-IN')}`,
                        type: 'price_alert',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        read: false,
                        targetScreen: 'price-alerts'
                    });
                }
            }

            await Promise.all(notifications);
            return null;

        } catch (err) {
            console.error("[WATCHER] Critical Error:", err);
            return null;
        }
    });

// --- 2. FCM PUSH TRIGGER (v1) ---
async function triggerPushNotification(uid, alert, triggerPrice) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        const fcmToken = userDoc.data()?.pushToken;

        if (!fcmToken || fcmToken === 'no-token' || fcmToken === 'expo-go-mock-token') {
            return;
        }

        const message = {
            token: fcmToken,
            notification: {
                title: `🔔 Price Alert: ${alert.type.toUpperCase()}`,
                body: `Target reached! ${alert.type} is now ₹${triggerPrice.toLocaleString('en-IN')}.`,
            },
            data: {
                screen: 'price-alerts',
                alertId: alert.id,
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default',
                    color: '#EAB308',
                    sound: 'default'
                },
            }
        };

        await admin.messaging().send(message);
        console.log(`[WATCHER] FCM Sent to ${uid}`);
    } catch (e) {
        console.error(`[WATCHER] FCM Error:`, e);
    }
}

// --- 3. PAYU HASH GENERATOR (v1) ---
// Securely generates transaction hashes for PayU Checkout Pro SDK
exports.generatePayUHash = functions.https.onCall(async (data, context) => {
    try {
        const { 
            txnid, amount, productinfo, 
            firstname, email, udf1, udf2, 
            udf3, udf4, udf5 
        } = data;

        // --- IMPORTANT: GET SECRETS ---
        // Run: firebase functions:config:set payu.key="YOUR_KEY" payu.salt="YOUR_SALT"
        const merchantKey = functions.config()?.payu?.key || "PAYU_MERCHANT_KEY_PLACEHOLDER";
        const merchantSalt = functions.config()?.payu?.salt || "PAYU_MERCHANT_SALT_PLACEHOLDER";

        if (merchantKey === "PAYU_MERCHANT_KEY_PLACEHOLDER") {
            console.warn("[PAYU] Merchant Key/Salt not configured in Firebase Config!");
        }

        // --- 1. PAYMENT HASH ---
        // Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
        const hashString = `${merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1||''}|${udf2||''}|${udf3||''}|${udf4||''}|${udf5||''}||||||${merchantSalt}`;
        const paymentHash = crypto.createHash("sha512").update(hashString).digest("hex");

        // --- 2. VAS FOR MOBILE SDK ---
        const vasString = `${merchantKey}|get_vas_for_mobile_sdk|default|${merchantSalt}`;
        const vasHash = crypto.createHash("sha512").update(vasString).digest("hex");

        // --- 3. PAYMENT RELATED DETAILS ---
        const detailsString = `${merchantKey}|payment_related_details_for_mobile_sdk|default|${merchantSalt}`;
        const detailsHash = crypto.createHash("sha512").update(detailsString).digest("hex");

        console.log(`[PAYU] Hashes generated for TXN: ${txnid}`);

        return {
            payment: paymentHash,
            vas_for_mobile_sdk: vasHash,
            payment_related_details_for_mobile_sdk: detailsHash,
            merchantKey: merchantKey
        };

    } catch (err) {
        console.error("[PAYU] Hash Error:", err);
        throw new functions.https.HttpsError('internal', 'Hash generation failed');
    }
});
