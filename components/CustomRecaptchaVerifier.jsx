import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

/**
 * A custom reCAPTCHA verifier that uses a WebView to avoid legacy native dependencies.
 * This replaces the broken 'expo-firebase-recaptcha' package.
 */
const CustomRecaptchaVerifier = forwardRef(({ firebaseConfig, onVerify, onExpire, onError }, ref) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const resolveRef = useRef(null);
  const webViewRef = useRef(null);

  // Expose the verify method that Firebase Auth expects
  useImperativeHandle(ref, () => ({
    verify: async () => {
      setVisible(true);
      return new Promise((resolve) => {
        resolveRef.current = resolve;
      });
    },
    // The type that signInWithPhoneNumber expects
    type: 'recaptcha',
    // Internal Firebase methods that may be called
    reset: () => {
      setLoading(true);
      setError(null);
      webViewRef.current?.reload();
    },
    _reset: () => {
      setLoading(true);
      setError(null);
      webViewRef.current?.reload();
    }
  }));

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
      <style>
        body, html { margin: 0; padding: 0; height: 100%; display: flex; justify-content: center; align-items: center; background: #FFF; }
        #recaptcha-container { display: block; }
      </style>
    </head>
    <body style="background: transparent;">
      <div id="recaptcha-container"></div>
      <script>
        // Catch and send errors to the app
        window.onerror = function(msg, url, line) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: msg + " (at " + url + ":" + line + ")" }));
          return false;
        };

        const firebaseConfig = ${JSON.stringify(firebaseConfig)};
        try {
          firebase.initializeApp(firebaseConfig);
          console.log("Firebase Initialized in WebView");
          
          window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'normal',
            'callback': (response) => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verified', token: response }));
            },
            'expired-callback': () => {
               window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expired' }));
            }
          });
          
          window.recaptchaVerifier.render().then((widgetId) => {
            console.log("ReCAPTCHA Rendered");
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
          }).catch(err => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: "Render error: " + err.message }));
          });
        } catch (err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: "Init error: " + err.message }));
        }
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        setLoading(false);
        console.log("CustomRecaptcha: WebView Ready");
      } else if (data.type === 'verified') {
        setVisible(false);
        console.log("CustomRecaptcha: Verified! Token received:", data.token.substring(0, 10) + "...");
        if (onVerify) onVerify(data.token);
        if (resolveRef.current) {
          resolveRef.current(data.token);
          resolveRef.current = null;
        }
      } else if (data.type === 'expired') {
        if (onExpire) onExpire();
      } else if (data.type === 'error') {
        setLoading(false);
        setError(data.error);
        if (onError) onError(new Error(data.error));
        if (resolveRef.current) {
          resolveRef.current(null);
          resolveRef.current = null;
        }
      }
    } catch (e) {
      if (onError) onError(e);
      if (resolveRef.current) {
        resolveRef.current(null);
        resolveRef.current = null;
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Security Verification</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.webviewContainer}>
            {loading && (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text style={styles.loadingText}>Loading Security Check...</Text>
              </View>
            )}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
                <Text style={styles.errorTitle}>Verification Error</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => { setError(null); setLoading(true); webViewRef.current?.reload(); }}>
                  <Text style={styles.retryText}>Retry Verification</Text>
                </TouchableOpacity>
              </View>
            )}
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html, baseUrl: 'https://' + (firebaseConfig.authDomain || 'localhost') }}
              onMessage={handleMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              style={{ flex: 1, backgroundColor: 'transparent' }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    height: 450,
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  webviewContainer: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default CustomRecaptchaVerifier;
