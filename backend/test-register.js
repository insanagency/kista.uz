
import axios from 'axios';

const testRegister = async () => {
    try {
        const uniqueId = Math.random().toString(36).substring(7);
        console.log(`Testing with email: debug_${uniqueId}@example.com`);

        const res = await axios.post('http://localhost:5001/api/auth/register', {
            full_name: 'Test Debugger',
            email: `debug_${uniqueId}@example.com`,
            password: 'password123'
        });
        console.log('Success:', res.data);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', error.response?.data);
    }
};

testRegister();
