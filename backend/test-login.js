
import axios from 'axios';

const testLogin = async () => {
    try {
        const res = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'debug_hdlm4@example.com',
            password: 'password123'
        });
        console.log('Login Success:', res.data);
    } catch (error) {
        console.error('Login Error Status:', error.response?.status);
        console.error('Login Error Data:', error.response?.data);
    }
};

testLogin();
