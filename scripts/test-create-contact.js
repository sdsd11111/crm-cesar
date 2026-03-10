// Script para probar CREATE_CONTACT
const testMessage = "Donna registra un nuevo lead, se llama Claudio Rodríguez y es dueño de ITEC su número es 0963411409";

fetch('http://localhost:3000/api/test-create-contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: testMessage })
})
    .then(r => r.json())
    .then(data => {
        console.log('✅ Resultado:', JSON.stringify(data, null, 2));
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
