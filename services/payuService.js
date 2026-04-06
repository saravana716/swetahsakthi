import { firebase } from '../firebaseConfig'; // Adjust based on your firebase setup
import { getFunctions, httpsCallable } from 'firebase/functions';
import PayUPaymentCheckoutPro from 'payu-non-seam-less-react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const functions = getFunctions();
const generatePayUHash = httpsCallable(functions, 'generatePayUHash');

/**
 * PayU Service for Swarna Sakthi
 * Handles dynamic hash generation and SDK launch
 */
class PayUService {
  constructor() {
    this.eventEmitter = new NativeEventEmitter(NativeModules.PayUCheckoutProModule);
  }

  /**
   * Launch PayU Checkout
   * @param {Object} params - { amount, productInfo, firstName, email, phone, txnid }
   */
  async launchPayment(params) {
    try {
      const { amount, productInfo, firstName, email, phone, txnid } = params;

      // 1. Get Hashes from Backend
      console.log(`[PayU] Fetching hashes for TXN: ${txnid}...`);
      const response = await generatePayUHash({
        txnid,
        amount: amount.toString(),
        productinfo: productInfo,
        firstname: firstName,
        email: email,
        udf1: '', udf2: '', udf3: '', udf4: '', udf5: ''
      });

      const { paymentHash, vasHash, detailsHash, merchantKey } = response.data;

      // 2. Prepare PayU Payment Params
      const payUPaymentParams = {
        key: merchantKey,
        transactionId: txnid,
        amount: amount.toString(),
        productInfo: productInfo,
        firstName: firstName,
        email: email,
        phone: phone,
        ios_surl: 'https://payu.herokuapp.com/ios_success', // Placeholder
        ios_furl: 'https://payu.herokuapp.com/ios_failure', // Placeholder
        android_surl: 'https://payu.herokuapp.com/success', // Placeholder
        android_furl: 'https://payu.herokuapp.com/failure', // Placeholder
        environment: '1', // 0 for Production, 1 for Test
        userCredential: `${merchantKey}:${email}`,
        payuPostUrl: 'https://test.payu.in/_payment', // Set based on env
      };

      const payUCheckoutProConfig = {
        primaryColor: '#EAB308', // Match Gold Theme
        secondaryColor: '#1C1600',
        merchantName: 'Swarna Sakthi',
        merchantLogo: 'logo_url_here',
        showExitConfirmationOnCheckoutScreen: true,
        showExitConfirmationOnPaymentScreen: true,
        cartDetails: [
           { [productInfo]: amount.toString() }
        ],
        paymentHash: paymentHash,
        vasForMobileSdkHash: vasHash,
        paymentRelatedDetailsForMobileSdkHash: detailsHash,
      };

      // 3. Open SDK
      console.log('[PayU] Launching SDK...');
      PayUPaymentCheckoutPro.openCheckoutPro(payUPaymentParams, payUCheckoutProConfig);

      // 4. Listen for Results
      return new Promise((resolve, reject) => {
        const successSub = this.eventEmitter.addListener('onPaymentSuccess', (response) => {
          console.log('[PayU] Success:', response);
          this._removeListeners(successSub, failureSub);
          resolve({ status: 'success', data: response });
        });

        const failureSub = this.eventEmitter.addListener('onPaymentFailure', (response) => {
          console.log('[PayU] Failure:', response);
          this._removeListeners(successSub, failureSub);
          resolve({ status: 'failure', data: response });
        });
      });

    } catch (error) {
      console.error('[PayU] Launch Error:', error);
      throw error;
    }
  }

  _removeListeners(s, f) {
    if (s) s.remove();
    if (f) f.remove();
  }
}

export default new PayUService();
