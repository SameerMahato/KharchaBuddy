async function testRegister() {
    try {
        const uniqueEmail = `test${Date.now()} @example.com`;
        console.log(`Attempting to register user: ${uniqueEmail} `);

        const response = await fetch('http://127.0.0.1:5000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test User',
                email: uniqueEmail,
                password: 'password123'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Registration Successful!');
            console.log('Status:', response.status);
            console.log('Data:', data);
        } else {
            console.error('Registration Failed!');
            console.error('Status:', response.status);
            console.error('Data:', data);
        }
    } catch (error) {
        console.error('Network/Connection Error:', error.message);
    }
}

testRegister();
