import { functions } from '../firebaseConfig'; 
import { httpsCallable } from 'firebase/functions';
import PayUBizSdk from 'payu-non-seam-less-react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const generatePayUHash = httpsCallable(functions, 'generatePayUHash');

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

      // 1. Prepare PayUPaymentParams
      const payUPaymentParams = {
        key: 'merchant_key_placeholder', // Will be replaced by backend during hash generation
        transactionId: txnid,
        amount: amount.toString(),
        productInfo: productInfo,
        firstName: firstName,
        email: email,
        phone: phone,
        android_surl: 'https://payu.herokuapp.com/success',
        android_furl: 'https://payu.herokuapp.com/failure',
        environment: '1', // 0 for Production, 1 for Test
        userCredential: `merchant_key:${email}`,
      };

      // 2. Open SDK with correct method name
      console.log('[PayU] Launching OpenCheckoutScreen...');
      PayUBizSdk.openCheckoutScreen(payUPaymentParams);

      // 3. Setup Listeners
      return new Promise((resolve) => {
        // --- A. HASH GENERATION LISTENER (Mandatory for this SDK) ---
        const hashSub = this.eventEmitter.addListener('generateHash', async (data) => {
          try {
            console.log('[PayU] SDK requested hash for:', data);
            const response = await generatePayUHash({
              txnid: txnid,
              amount: amount.toString(),
              productinfo: productInfo,
              firstname: firstName,
              email: email,
              ...data // Pass additional params if SDK provides them
            });

            // Send hash back to SDK
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
