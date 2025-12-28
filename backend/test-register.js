
import axios from 'axios';

const testRegister = async () => {
    try {
        const res = await axios.post('http://localhost:5001/api/auth/register', {
            full_name: 'Test Debugger',
            email: 'debug_test@example.com',
            password: 'password123'
        });
        console.log('Success:', res.data);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', error.response?.data);
    }
};

testRegister();
