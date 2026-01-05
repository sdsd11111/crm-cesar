import axios from 'axios';

async function testWebhook() {
    const url = 'http://localhost:3000/api/webhooks/whatsapp';
    const payload = {
        object: 'whatsapp_business_account',
        entry: [
            {
                id: '1234567890',
                changes: [
                    {
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: {
                                display_phone_number: '1234567890',
                                phone_number_id: '1234567890'
                            },
                            contacts: [
                                {
                                    profile: { name: 'Cesar Test' },
                                    wa_id: '593963410409'
                                }
                            ],
                            messages: [
                                {
                                    from: '593963410409',
                                    id: 'wamid.HBgLNTkzOTYzNDEwNDA5FQIAEhgUM0EBQ0Y5RjMzQzY0RDZFQUIwRTMA',
                                    timestamp: '1700000000',
                                    text: { body: 'Prueba de visualización metadata ' + new Date().toISOString() },
                                    type: 'text'
                                }
                            ]
                        },
                        field: 'messages'
                    }
                ]
            }
        ]
    };

    console.log('Sending payload to webhook...');
    try {
        const response = await axios.post(url, payload);
        console.log('Response:', response.status, response.data);
    } catch (e: any) {
        console.error('Error:', e.response?.data || e.message);
    }
}

testWebhook();
