import { functions } from '../firebaseConfig'; 
import { httpsCallable } from 'firebase/functions';
import PayUBizSdk from 'payu-non-seam-less-react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const generatePayUHash = httpsCallable(functions, 'generatePayUHash');
const getPayUMerchantKey = httpsCallable(functions, 'getPayUMerchantKey');

/**
 * PayU Service for Swarna Sakthi
 * Handles dynamic hash generation and SDK launch using PayUBizSdk
 */
class PayUService {
  constructor() {
    const payuModule = NativeModules.PayUBizSdk;
    if (payuModule) {
      this.eventEmitter = new NativeEventEmitter(payuModule);
    }
  }

  /**
   * Launch PayU Checkout
   * @param {Object} params - { amount, productInfo, firstName, email, phone, txnid }
   */
  async launchPayment(params) {
    if (!NativeModules.PayUBizSdk) {
      throw new Error('PayU Native SDK not found. Ensure you are using the Development Build APK.');
    }

    try {
      const { amount, productInfo, firstName, email, phone, txnid } = params;

      // 1. Get Real Merchant Key from Server
      console.log('[PayU] Fetching Merchant Key...');
      const configResponse = await getPayUMerchantKey();
      const { merchantKey } = configResponse.data;

      // 2. Prepare PayUPaymentParams (Including all mandatory and optional UDFs)
      const payUPaymentParams = {
        key: merchantKey,
        transactionId: txnid,
        amount: amount.toString(),
        productInfo: productInfo,
        firstName: firstName,
        email: email,
        phone: phone,
        surl: 'https://payu.herokuapp.com/success', // Redundant for compatibility
        furl: 'https://payu.herokuapp.com/failure', // Redundant for compatibility
        android_surl: 'https://payu.herokuapp.com/success',
        android_furl: 'https://payu.herokuapp.com/failure',
        environment: '1', // 0 for Production, 1 for Test (Update to '0' for live)
        userCredential: `${merchantKey}:${email}`,
        udf1: '',
        udf2: '',
        udf3: '',
        udf4: '',
        udf5: '',
      };

      // 3. Open SDK
      console.log('[PayU] Launching OpenCheckoutScreen...');
      PayUBizSdk.openCheckoutScreen(payUPaymentParams);

      // 4. Setup Listeners
      return new Promise((resolve) => {
        // --- A. HASH GENERATION LISTENER ---
        const hashSub = this.eventEmitter.addListener('generateHash', async (data) => {
          try {
            console.log('[PayU] SDK requested hash for:', data);
            const response = await generatePayUHash({
              txnid: txnid,
              amount: amount.toString(),
              productinfo: productInfo,
              firstname: firstName,
              email: email,
              ...data
            });
            PayUBizSdk.hashGenerated(response.data);
          } catch (e) {
            console.error('[PayU] Hash Callback Error:', e);
          }
        });

        // --- B. SUCCESS LISTENER ---
        const successSub = this.eventEmitter.addListener('onPaymentSuccess', (response) => {
          console.log('[PayU] Payment Success:', response);
          this._cleanup(hashSub, successSub, failureSub, cancelSub, errorSub);
          resolve({ status: 'success', data: response });
        });

        // --- C. FAILURE LISTENER ---
        const failureSub = this.eventEmitter.addListener('onPaymentFailure', (response) => {
          console.log('[PayU] Payment Failure:', response);
          this._cleanup(hashSub, successSub, failureSub, cancelSub, errorSub);
          resolve({ status: 'failure', data: response });
        });

        // --- D. CANCEL LISTENER ---
        const cancelSub = this.eventEmitter.addListener('onPaymentCancel', (response) => {
          console.log('[PayU] Payment Cancelled:', response);
          this._cleanup(hashSub, successSub, failureSub, cancelSub, errorSub);
          resolve({ status: 'cancelled', data: response });
        });

        // --- E. ERROR LISTENER ---
        const errorSub = this.eventEmitter.addListener('onError', (response) => {
          console.error('[PayU] SDK Error:', response);
          this._cleanup(hashSub, successSub, failureSub, cancelSub, errorSub);
          resolve({ status: 'error', data: response });
        });
      });

    } catch (error) {
      console.error('[PayU] Launch Error:', error);
      throw error;
    }
  }

  _cleanup(...subs) {
    subs.forEach(s => s && s.remove());
  }
}

export default new PayUService();
