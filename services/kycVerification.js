/**
 * KYC Verification Service (Abstraction Layer)
 * 
 * This service handles real-time validation of identity documents.
 * Currently, it performs local format and logic checks.
 * 
 * TO INTEGRATE KARZA, ZOOP, OR IDFY:
 * 1. Purchase an API key from the provider.
 * 2. Update the `verifyPAN` and `verifyAadhar` functions to call their endpoints.
 */

export const verifyPAN = async (panNumber, nameAsPerPan, dob) => {
  // 1. Basic Format Validation
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(panNumber)) {
    throw new Error("Invalid PAN format. Example: ABCDE1234F");
  }

  // 2. Simulated Professional Check (Ready for API Integration)
  return new Promise((resolve) => {
    setTimeout(() => {
      // Logic for future API:
      // const response = await fetch('https://api.karza.in/v3/pan-profile', { ... });
      
      resolve({
        success: true,
        message: "PAN Format Verified Locally",
        data: {
          number: panNumber,
          category: "Individual",
          isVerified: true
        }
      });
    }, 1500); // Simulate network delay for premium feel
  });
};

export const verifyAadhar = async (aadharNumber) => {
  // 1. Basic Format Validation (12 Digits)
  const aadharRegex = /^[0-9]{12}$/;
  const cleanAadhar = aadharNumber.replace(/\s/g, ''); // Remove spaces if any
  
  if (!aadharRegex.test(cleanAadhar)) {
    throw new Error("Invalid Aadhaar number. Must be 12 digits.");
  }

  // 2. Simulated Professional Check
  return new Promise((resolve) => {
    setTimeout(() => {
      // Logic for future API: Karza/Zoop Aadhar OTP or Auth
      resolve({
        success: true,
        message: "Aadhaar Format Verified Locally",
        data: {
          number: cleanAadhar,
          isVerified: true
        }
      });
    }, 1500);
  });
};

/**
 * Validates if the user is 18 years or older.
 */
export const validateAge = (dateOfBirthString) => {
  if (!dateOfBirthString) return false;
  
  const dob = new Date(dateOfBirthString);
  const today = new Date();
  
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age >= 18;
};
