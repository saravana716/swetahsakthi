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
