# 🚀 Swarna Sakthi: Price Watcher Deployment

This folder contains the **Server-Side logic** for your 24/7 Dynamic Price Alerts. 
Once deployed, your users will get high-priority push notifications even if the app is **CLOSED**.

### 🛠️ Pre-requisites:
1.  **Firebase CLI**: `npm install -g firebase-tools`
2.  **Login**: `firebase login`
3.  **Upgrade Project**: Go to the Firebase Console and upgrade your project to the **Blaze (Pay-as-you-go)** plan. (Google requires this for Cloud Functions to call the Augmont API).

### 🚢 Deployment Commands:
From the root directory of your project, run:

```bash
cd functions
npm install
cd ..
npx firebase-tools deploy --only functions
```

### 🔔 How it works:
-   **Trigger**: Runs every **5 minutes** automatically in the cloud.
-   **Logic**: Fetches live rates -> Matches against active Firestore alerts -> Sends Push Notification (FCM).
-   **One-Shot**: Once an alert triggers, it is disabled (`enabled: false`) to prevent spamming the user. 

### 🧪 Testing:
Once deployed, you can see the logs in the Firebase Console under **Functions > Logs**.
