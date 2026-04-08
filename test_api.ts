import axios from 'axios';

const BASE_API = "http://192.168.0.115:5001/api/";

async function testDetail() {
    try {
        const id = 13; // Example from screenshot
        console.log(`Fetching detail for bill ID: ${id}...`);
        const response = await axios.get(`${BASE_API}sales/bill/details/${id}`);
        console.log("Response structure:", JSON.stringify(response.data, null, 2));
    } catch (err: any) {
        console.error("Error fetching bill details:", err.message);
    }
}

testDetail();
