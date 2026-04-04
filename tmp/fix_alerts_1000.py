import os
import re

file_path = r'c:\Users\vsara\Desktop\auragold\swarna_sakthi_app\swetahsakthi\app\price-alerts.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The new addAlert function with 1000% reliability fix
new_code = """  // ─── 5. Create new alert in Firestore ────────────────────────
  const addAlert = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice))) return;

    // Deduplication check: Don't allow exact same alert twice
    const targetVal = parseFloat(newPrice);
    const isDuplicate = alerts.some(a => 
      a.type === newType && 
      a.condition === newCondition && 
      a.targetPrice === targetVal &&
      a.enabled === true
    );

    if (isDuplicate) {
      Toast.show({ type: 'info', text1: 'Existing Alert', text2: 'You already have this alert active!' });
      setModalVisible(false);
      return;
    }
    
    setSaving(true);
    
    // --- 1000% FIX: Save to Local DISK IMMEDIATELY (Optimistic UI) ---
    const newAlertData = {
      type: newType,
      condition: newCondition,
      targetPrice: targetVal,
      label: `${newType === 'gold' ? 'Gold' : 'Silver'} ${newCondition === 'below' ? 'drops below' : 'hits above'} ₹${targetVal.toLocaleString('en-IN')}`,
      enabled: true,
      createdAt: new Date().toISOString(),
      triggered: false
    };

    const tempId = `temp_${Date.now()}`;
    const optimisticAlert = { id: tempId, ...newAlertData };
    const updatedLocalList = [optimisticAlert, ...alerts];
    
    setAlerts(updatedLocalList);
    saveToLocal(updatedLocalList); 
    
    setModalVisible(false); // Close immediately for feedback
    setSaving(false);
    setNewPrice('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // ------------------------------------------------

    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'alerts'), {
        ...newAlertData,
        createdAt: serverTimestamp() 
      });
      console.log("[ALERTS] Cloud Sync Success:", docRef.id);
    } catch (err) {
      console.error("Cloud sync pending (saved locally):", err);
    }
  };"""

# Use a very generous regex to find the old addAlert function
# Matches from 'const addAlert = async () => {' up to the closing '};' of the function
pattern = r"  // ─── 5\. Create new alert in Firestore ────────────────────────\n  const addAlert = async \(\) => \{(?:.|\n)*?try \{(?:.|\n)*?catch \(err\) \{(?:.|\n)*?\}\n  \};"

new_content = re.sub(pattern, new_code, content)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: 1000% fix applied via Python.")
else:
    print("ERROR: Regex failed to find the function.")
