const BASE_URL = 'http://13.63.202.142:5001/api/augmont/v1';

export const getLiveRates = async () => {
  try {
    const response = await fetch(`${BASE_URL}/rates`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching live rates:', error);
    throw error;
  }
};

export const createUserInDB = async (userData, token) => {
  try {
    const response = await fetch(`http://13.63.202.142:5001/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData),
    });
    const textContent = await response.text();
    let data;
    try {
      data = JSON.parse(textContent);
      console.log("createUserInDB raw JSON response:", data);
    } catch (e) {
      console.error("createUserInDB non-JSON response:", textContent);
      throw new Error(`Server returned HTML instead of JSON (Status ${response.status}). Check backend logs.`);
    }
    
    if (!response.ok) {
      // Intelligently parse MongoDB validation warnings from your backend
      let errorMessage = data?.message || data?.error || `Failed with status: ${response.status}`;
      
      if (data?.errors && Array.isArray(data.errors)) {
        // If validation errors are returned as an array (like express-validator)
        errorMessage = data.errors.map(err => err.msg || err).join(' | ');
      }
      
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    console.error('Error creating user in DB:', error);
    throw error;
  }
};

export const getUserByUniqueId = async (uniqueId, token) => {
  try {
    const response = await fetch(`http://13.63.202.142:5001/api/users/by-unique/${uniqueId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const textContent = await response.text();
    let data;
    try {
      data = JSON.parse(textContent);
    } catch (e) {
      throw new Error(`Server returned HTML instead of JSON (Status ${response.status}).`);
    }

    if (!response.ok) {
      throw new Error(data?.message || `Failed to fetch user: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user by uniqueId:', error);
    throw error;
  }
};

export const getUserByMongoId = async (id, token) => {
  try {
    const response = await fetch(`http://13.63.202.142:5001/api/users/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const textContent = await response.text();
    let data;
    try {
      data = JSON.parse(textContent);
    } catch (e) {
      throw new Error(`Server returned HTML instead of JSON (Status ${response.status}).`);
    }

    if (!response.ok) {
      throw new Error(data?.message || `Failed to fetch user by Mongo ID: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Error fetching user by Mongo ID:', error);
    throw error;
  }
};

export const createUserInAugmont = async (augmontData, token) => {
  try {
    console.log("Creating user in Augmont with payload:", augmontData);
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(augmontData),
    });

    const data = await response.json();
    console.log("Augmont User Creation Response:", data);

    if (!response.ok) {
      if (data.errors) {
        console.error("Augmont Validation Errors:", JSON.stringify(data.errors, null, 2));
      }
      throw new Error(data?.message || data?.error?.message || `Augmont registration failed: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Error in createUserInAugmont:', error);
    throw error;
  }
};

export const submitAugmontKYC = async (uniqueId, kycData, token) => {
  try {
    console.log(`Submitting KYC for ${uniqueId}:`, kycData);
    
    const formData = new FormData();
    formData.append('panNumber', kycData.panNumber);
    formData.append('dateOfBirth', kycData.dateOfBirth); // Expects YYYY-MM-DD
    formData.append('nameAsPerPan', kycData.nameAsPerPan);
    formData.append('status', 'approved'); // As requested for default approval
    
    // Attachments: Real File Objects from Camera Capture
    if (kycData.panImage) {
      formData.append('panAttachment', {
        uri: kycData.panImage,
        name: 'pan_card.jpg',
        type: 'image/jpeg',
      });
    }

    if (kycData.aadharImage) {
      formData.append('aadharAttachment', {
        uri: kycData.aadharImage,
        name: 'aadhar_card.jpg',
        type: 'image/jpeg',
      });
    }

    const response = await fetch(`${BASE_URL}/users/${uniqueId}/kyc`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    const data = await response.json();
    console.log("Augmont KYC Response:", data);

    if (!response.ok) {
      if (data.errors) {
        console.error("KYC Validation Errors:", JSON.stringify(data.errors, null, 2));
      }
      throw new Error(data?.message || `KYC submission failed: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Error in submitAugmontKYC:', error);
    throw error;
  }
};

export const updateUserKycStatus = async (mongoId, status, token) => {
  try {
    if (!mongoId) {
      console.warn("Skipping MongoDB KYC Sync: mongoId is missing.");
      return null;
    }

    const response = await fetch(`http://13.63.202.142:5001/api/users/${mongoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        kycStatus: status,
        kycVerificationStatus: status === 'approved' ? 'verified' : 'pending'
      }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // If server returns HTML (404/500), we log the error but don't crash
      console.error(`Local DB Update returned non-JSON response (${response.status}):`, text.substring(0, 100));
      return null;
    }

    if (!response.ok) {
      console.error("Local DB Update failed:", data?.message || response.status);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in updateUserKycStatus sync:', error);
    return null; // Return null to indicate sync failed but shouldn't block the caller
  }
};

export const getAugmontProfile = async (uniqueId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${uniqueId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to fetch Augmont profile (${response.status}):`, text);
      return null;
    }

    const data = await response.json();
    console.log("-----------------------------------------");
    console.log("OFFICIAL AUGMONT API PROFILE (External):", JSON.stringify(data, null, 2));
    console.log("-----------------------------------------");
    return data;
  } catch (error) {
    console.error('Error fetching Augmont profile:', error);
    throw error;
  }
};

export const getAugmontKYCStatus = async (uniqueId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${uniqueId}/kyc`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to fetch Augmont KYC status (${response.status}):`, text);
      return null;
    }

    const data = await response.json();
    console.log("Augmont KYC Live Status:", data);
    return data;
  } catch (error) {
    console.error('Error fetching Augmont KYC status:', error);
    throw error;
  }
};

export const getUserPassbook = async (uniqueId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${uniqueId}/passbook`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to fetch Augmont passbook (${response.status}):`, text);
      return null;
    }

    const data = await response.json();
    console.log("-----------------------------------------");
    console.log("SYNCED AUGMONT PASSBOOK (External):", JSON.stringify(data, null, 2));
    console.log("-----------------------------------------");
    return data;
  } catch (error) {
    console.error('Error fetching Augmont passbook:', error);
    throw error;
  }
};

export const getAugmontBuyList = async (uniqueId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/${uniqueId}/buy`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to fetch Augmont Buy List (${response.status}):`, text);
      return null;
    }

    const data = await response.json();
    console.log("-----------------------------------------");
    console.log("SYNCED AUGMONT BUY LIST (External):", JSON.stringify(data, null, 2));
    console.log("-----------------------------------------");
    return data;
  } catch (error) {
    console.error('Error fetching Augmont Buy List:', error);
    throw error;
  }
};

export const getAugmontSellList = async (uniqueId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/${uniqueId}/sell`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to fetch Augmont Sell List (${response.status}):`, text);
      return null;
    }

    const data = await response.json();
    console.log("-----------------------------------------");
    console.log("SYNCED AUGMONT SELL LIST (External):", JSON.stringify(data, null, 2));
    console.log("-----------------------------------------");
    return data;
  } catch (error) {
    console.error('Error fetching Augmont Sell List:', error);
    throw error;
  }
};

export const getBuyTransactionDetail = async (merchantTxId, uniqueId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/buy/${merchantTxId}/${uniqueId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    const data = await response.json();
    console.log(`Buy Detail for ${merchantTxId}:`, data);

    if (!response.ok) {
      throw new Error(data?.message || 'Failed to fetch buy transaction details');
    }
    return data;
  } catch (error) {
    console.error('Error in getBuyTransactionDetail:', error);
    throw error;
  }
};

export const getSellTransactionDetail = async (merchantTxId, uniqueId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/sell/${merchantTxId}/${uniqueId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    const data = await response.json();
    console.log(`Sell Detail for ${merchantTxId}:`, data);

    if (!response.ok) {
      throw new Error(data?.message || 'Failed to fetch sell transaction details');
    }
    return data;
  } catch (error) {
    console.error('Error in getSellTransactionDetail:', error);
    throw error;
  }
};

export const getBuyInvoice = async (transactionId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/invoice/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    const data = await response.json();
    console.log(`Buy Invoice for ${transactionId}:`, data);

    if (!response.ok) {
      throw new Error(data?.message || 'Failed to fetch buy invoice');
    }
    return data;
  } catch (error) {
    console.error('Error in getBuyInvoice:', error);
    throw error;
  }
};

export const getSellInvoice = async (transactionId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/invoice/sell/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    const data = await response.json();
    console.log(`Sell Invoice for ${transactionId}:`, data);

    if (!response.ok) {
      throw new Error(data?.message || 'Failed to fetch sell invoice');
    }
    return data;
  } catch (error) {
    console.error('Error in getSellInvoice:', error);
    throw error;
  }
};

export const getMasterStates = async () => {
  let allStates = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      console.log(`Fetching states page ${page}...`);
      const response = await fetch(`${BASE_URL}/master/states?page=${page}`);
      if (!response.ok) throw new Error(`Failed to fetch states page ${page}: ${response.status}`);
      
      const data = await response.json();
      const pageData = data?.result?.data || [];
      allStates = [...allStates, ...pageData];
      hasMore = data?.result?.pagination?.hasMore || false;
      page++;
      
      if (page > 20) break; // Safety break (India max ~36 states/UTs, 4 pages max @ 10 per page)
    }
    console.log(`Successfully fetched ${allStates.length} states.`);
    return allStates;
  } catch (error) {
    console.error('Error fetching master states:', error);
    throw error;
  }
};

export const getMasterCities = async (stateId) => {
  let allCities = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      console.log(`Fetching cities for state ${stateId}, page ${page}...`);
      const response = await fetch(`${BASE_URL}/master/cities?stateId=${stateId}&page=${page}`);
      if (!response.ok) throw new Error(`Failed to fetch cities for state ${stateId}, page ${page}: ${response.status}`);
      
      const data = await response.json();
      const pageData = data?.result?.data || [];
      allCities = [...allCities, ...pageData];
      hasMore = data?.result?.pagination?.hasMore || false;
      page++;
      
      if (page > 50) break; // Safety break
    }
    console.log(`Successfully fetched ${allCities.length} cities.`);
    return allCities;
  } catch (error) {
    console.error('Error fetching master cities:', error);
    throw error;
  }
};

export const getNews = async (publishedOnly = true) => {
  try {
    const response = await fetch(`http://13.63.202.142:5001/api/news?publishedOnly=${publishedOnly}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status}`);
    }
    const data = await response.json();
    console.log("-----------------------------------------");
    console.log("SYNCED MARKET INSIGHTS NEWS:", JSON.stringify(data, null, 2));
    console.log("-----------------------------------------");
    return data;
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

export const getUserBanks = async (uniqueId, token) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${uniqueId}/banks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to fetch user banks (${response.status}):`, text);
      return null;
    }

    const data = await response.json();
    console.log("Augmont User Banks:", data);
    return data;
  } catch (error) {
    console.error('Error fetching user banks:', error);
    throw error;
  }
};

export const addUserBank = async (uniqueId, bankData, token) => {
  try {
    console.log(`Adding bank for user ${uniqueId}:`, bankData);
    const response = await fetch(`${BASE_URL}/users/${uniqueId}/banks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(bankData),
    });

    const data = await response.json();
    console.log("Add Bank Response:", data);

    if (!response.ok) {
      throw new Error(data?.message || `Failed to add bank account: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Error adding user bank:', error);
    throw error;
  }
};

export const sellGoldSilver = async (payload, token) => {
  try {
    console.log("Executing Sell API Integration with payload:", payload);
    const response = await fetch(`${BASE_URL}/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Sell API Response:", data);

    if (!response.ok) {
      throw new Error(data?.message || data?.error?.message || `Sell transaction failed: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('Error in sellGoldSilver:', error);
    throw error;
  }
};
