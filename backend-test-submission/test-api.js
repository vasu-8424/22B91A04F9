const http = require('http');

const BASE_URL = 'http://localhost:3000';
let testResults = [];
let totalTests = 0;
let passedTests = 0;

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = responseData ? JSON.parse(responseData) : {};
                    resolve({
                        statusCode: res.statusCode,
                        data: parsedData,
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData,
                        headers: res.headers
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

function runTest(testName, testFunction) {
    totalTests++;
    console.log(`\nRunning: ${testName}`);
    
    return testFunction()
        .then((result) => {
            if (result.success) {
                passedTests++;
                console.log(`PASSED: ${testName}`);
                testResults.push({ name: testName, status: 'PASSED', message: result.message });
            } else {
                console.log(`FAILED: ${testName} - ${result.message}`);
                testResults.push({ name: testName, status: 'FAILED', message: result.message });
            }
        })
        .catch((error) => {
            console.log(`ERROR: ${testName} - ${error.message}`);
            testResults.push({ name: testName, status: 'ERROR', message: error.message });
        });
}

async function testCreateShortUrl() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/shorturls',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const testData = {
        original: 'https://www.google.com',
        shortcode: 'test-google',
        expiry: new Date(Date.now() + 60*60*1000).toISOString()
    };
    
    try {
        const response = await makeRequest(options, testData);
        
        if (response.statusCode === 201) {
            if (response.data.shortcode === 'test-google' && 
                response.data.original === 'https://www.google.com') {
                return { success: true, message: 'Short URL created successfully' };
            } else {
                return { success: false, message: 'Response data doesn\'t match expected values' };
            }
        } else {
            return { success: false, message: `Expected status 201, got ${response.statusCode}` };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function testCreateAutoShortUrl() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/shorturls',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const testData = {
        original: 'https://www.github.com'
    };
    
    try {
        const response = await makeRequest(options, testData);
        
        if (response.statusCode === 201) {
            if (response.data.shortcode && response.data.original === 'https://www.github.com') {
                return { success: true, message: `Auto-generated shortcode: ${response.data.shortcode}` };
            } else {
                return { success: false, message: 'Auto-generated shortcode test failed' };
            }
        } else {
            return { success: false, message: `Expected status 201, got ${response.statusCode}` };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function testGetStats() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/shorturls/test-google',
        method: 'GET'
    };
    
    try {
        const response = await makeRequest(options);
        
        if (response.statusCode === 200) {
            if (response.data.shortcode === 'test-google' && 
                response.data.original === 'https://www.google.com' &&
                typeof response.data.clicks === 'number') {
                return { success: true, message: `Stats retrieved - Clicks: ${response.data.clicks}` };
            } else {
                return { success: false, message: 'Stats data structure is incorrect' };
            }
        } else {
            return { success: false, message: `Expected status 200, got ${response.statusCode}` };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function testRedirect() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/test-google',
        method: 'GET'
    };
    
    try {
        const response = await makeRequest(options);
        
        if (response.statusCode === 307) {
            if (response.headers.location === 'https://www.google.com') {
                return { success: true, message: 'Redirect working correctly' };
            } else {
                return { success: false, message: `Wrong redirect location: ${response.headers.location}` };
            }
        } else {
            return { success: false, message: `Expected status 307, got ${response.statusCode}` };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function testInvalidUrl() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/shorturls',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const testData = {
        original: 'not-a-valid-url'
    };
    
    try {
        const response = await makeRequest(options, testData);
        
        if (response.statusCode === 400) {
            if (response.data.error === 'invalid url') {
                return { success: true, message: 'Invalid URL properly rejected' };
            } else {
                return { success: false, message: 'Wrong error message for invalid URL' };
            }
        } else {
            return { success: false, message: `Expected status 400, got ${response.statusCode}` };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function testDuplicateShortcode() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/shorturls',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const testData = {
        original: 'https://www.example.com',
        shortcode: 'test-google'
    };
    
    try {
        const response = await makeRequest(options, testData);
        
        if (response.statusCode === 409) {
            if (response.data.error === 'shortcode taken') {
                return { success: true, message: 'Duplicate shortcode properly rejected' };
            } else {
                return { success: false, message: 'Wrong error message for duplicate shortcode' };
            }
        } else {
            return { success: false, message: `Expected status 409, got ${response.statusCode}` };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function testNonExistentShortcode() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/shorturls/nonexistent',
        method: 'GET'
    };
    
    try {
        const response = await makeRequest(options);
        
        if (response.statusCode === 404) {
            if (response.data.error === 'not found') {
                return { success: true, message: 'Non-existent shortcode properly handled' };
            } else {
                return { success: false, message: 'Wrong error message for non-existent shortcode' };
            }
        } else {
            return { success: false, message: `Expected status 404, got ${response.statusCode}` };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function testClickTracking() {
    let options = {
        hostname: 'localhost',
        port: 3000,
        path: '/shorturls/test-google',
        method: 'GET'
    };
    
    try {
        const initialResponse = await makeRequest(options);
        const initialClicks = initialResponse.data.clicks;
        
        options = {
            hostname: 'localhost',
            port: 3000,
            path: '/test-google',
            method: 'GET'
        };
        
        await makeRequest(options);
        
        options = {
            hostname: 'localhost',
            port: 3000,
            path: '/shorturls/test-google',
            method: 'GET'
        };
        
        const finalResponse = await makeRequest(options);
        const finalClicks = finalResponse.data.clicks;
        
        if (finalClicks > initialClicks) {
            return { success: true, message: `Click count increased from ${initialClicks} to ${finalClicks}` };
        } else {
            return { success: false, message: 'Click tracking not working properly' };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function runAllTests() {
    console.log('Starting URL Shortener API Tests...\n');
    console.log('Make sure your server is running on http://localhost:3000');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runTest('Create Short URL with Custom Shortcode', testCreateShortUrl);
    await runTest('Create Short URL with Auto-generated Shortcode', testCreateAutoShortUrl);
    await runTest('Get URL Statistics', testGetStats);
    await runTest('Test URL Redirect', testRedirect);
    await runTest('Test Invalid URL Rejection', testInvalidUrl);
    await runTest('Test Duplicate Shortcode Rejection', testDuplicateShortcode);
    await runTest('Test Non-existent Shortcode', testNonExistentShortcode);
    await runTest('Test Click Tracking', testClickTracking);
    
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\nAll tests passed! Your API is working perfectly.');
    } else {
        console.log('\nSome tests failed. Check the details above.');
    }
    
    console.log('\nDetailed Results:');
    testResults.forEach((test, index) => {
        const icon = test.status === 'PASSED' ? 'PASS' : 'FAIL';
        console.log(`${index + 1}. ${icon} ${test.name}: ${test.message}`);
    });
    
    process.exit(passedTests === totalTests ? 0 : 1);
}

function checkServerHealth() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET',
        timeout: 5000
    };
    
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            resolve(true);
        });
        
        req.on('error', (error) => {
            reject(new Error('Server is not running on localhost:3000. Please start your server first.'));
        });
        
        req.on('timeout', () => {
            reject(new Error('Server connection timeout. Please check if your server is running.'));
        });
        
        req.end();
    });
}

checkServerHealth()
    .then(() => {
        runAllTests();
    })
    .catch((error) => {
        console.log('Server Health Check Failed:');
        console.log(error.message);
        console.log('\nTo fix this:');
        console.log('1. Make sure your server is running: npm start');
        console.log('2. Wait for the "Server is running" message');
        console.log('3. Then run the tests: npm test');
        process.exit(1);
    });