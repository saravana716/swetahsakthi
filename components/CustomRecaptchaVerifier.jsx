import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * A custom reCAPTCHA verifier that uses a WebView to avoid legacy native dependencies.
 * This replaces the broken 'expo-firebase-recaptcha' package.
 */
const CustomRecaptchaVerifier = forwardRef(({ firebaseConfig, onVerify, onExpire, onError }, ref) => {
  const insets = useSafeAreaInsets();
  const { width, height: screenHeight } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDone, setIsDone] = useState(false);
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
        setIsDone(false);
        console.log("CustomRecaptcha: WebView Ready");
      } else if (data.type === 'verified') {
        setIsDone(true);
        // We now wait for the user to tap the "Verify" button
        resolveRef.current?.(data.token); 
      } else if (data.type === 'expired') {
        setIsDone(false);
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

  const onConfirmVerification = () => {
    setVisible(false);
    if (onVerify && isDone) {
      // The token was already stored in resolveRef if verified
      // and handled in the parent. We trigger the screen close.
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { height: screenHeight * 0.85 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Security Verification</Text>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBox}>
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

          {/* Sticky Footer for Verification */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.instructionText}>
              {isDone ? "Verification complete!" : "Select all required images and tap Verify"}
            </Text>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.verifyButton, { backgroundColor: isDone ? '#D4AF37' : '#E5E7EB' }]}
              onPress={onConfirmVerification}
              disabled={!isDone}
            >
              <Text style={[styles.verifyButtonText, { color: isDone ? '#FFF' : '#9CA3AF' }]}>
                {isDone ? "PROCEED" : "VERIFY"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomRecaptchaVerifier;
