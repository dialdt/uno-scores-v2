exports.handler = async function(event, context, callback) {
  const body = {'apiKey':process.env.APP_KEY,
                'authDomain':process.env.AUTH_DOMAIN,
                'databaseURL':process.env.DB_URL,
                'projectId':process.env.PROJECT_ID,
                'storageBucket':process.env.STORAGE_BUCKET,
                'messagingSenderId':process.env.MESSAGING_SENDER_ID,
                'appId':process.env.APP_ID}
  console.log(body)

  callback(null, {
    statusCode: 200,
    body: body
  });

}
