export const sendSMS = async (
    twilio_account_sid:string,
    twilio_auth_token:string,
    twilio_phone_number:string,
    to: string,
    message: string, 
) => {
    const client = require('twilio')(twilio_account_sid, twilio_auth_token);
    try {
        await client.messages.create({
            body: message,
            from: twilio_phone_number,
            to
        });
        console.log('SMS sent successfully');
    } catch (error) {
        console.log('Error sending SMS', error);
    }
}