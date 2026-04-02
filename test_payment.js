// Test script to check payment API
// Run this in browser console when on a course page

// 1. Check if user is logged in
console.log('Current user:', JSON.parse(localStorage.getItem('nexus_user') || 'null'));

// 2. Test payment API directly
const testPayment = async () => {
  const user = JSON.parse(localStorage.getItem('nexus_user') || 'null');
  if (!user) {
    console.error('No user logged in');
    return;
  }

  const testData = {
    amount: 100,
    email: user.email,
    name: user.name || 'Test User',
    reference: `test_${Date.now()}`,
    courseId: 1,
    courseTitle: 'Test Course',
    userId: user.id,
  };

  console.log('Sending payment data:', testData);

  try {
    const response = await fetch('/api/payments/paystack-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('Payment API response:', response.status, result);

    if (response.ok) {
      console.log('✅ Payment API working!');
    } else {
      console.error('❌ Payment API failed:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Run the test
testPayment();