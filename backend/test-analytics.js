// Native fetch is available in Node 18+

async function testAnalytics() {
    try {
        // Login first to get token
        const loginRes = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' }) // Using a known test user
        });

        // If login fails, try registering a new temp user
        let token;
        if (!loginRes.ok) {
            console.log('Login failed, trying to register temp user...');
            const email = `analytics_test_${Date.now()}@example.com`;
            const regRes = await fetch('http://localhost:5000/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Analytics Info', email, password: 'password123' })
            });
            const regData = await regRes.json();
            token = regData.token;
        } else {
            const loginData = await loginRes.json();
            token = loginData.token;
        }

        console.log('Token acquired. Fetching analytics...');

        const res = await fetch('http://localhost:5000/api/analytics?period=year', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        console.log('--- Analytics Response Partial ---');
        if (data.monthlyTrend) {
            console.log('SUCCESS: monthlyTrend found!');
            console.log('Length:', data.monthlyTrend.length);
            console.log('First Item:', data.monthlyTrend[0]);
        } else {
            console.error('FAILURE: monthlyTrend MISSING in response.');
            console.log('Keys:', Object.keys(data));
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAnalytics();
