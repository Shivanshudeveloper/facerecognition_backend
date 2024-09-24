const postmark = require("postmark");
let client = new postmark.ServerClient("28febfcb-e7b4-46ce-8cf9-dd579125a20c");
export const sendEmail = async (email: any, subject: any, message: any) => {
    const mailResponse = await client.sendEmail({
        "From": "consultme@consultwithshiv.com",
        "To": email,
        "Subject": subject,
        "TextBody": message
    });

    console.log(mailResponse);
}


