const AWS = require('aws-sdk')

const cognito = new AWS.CognitoIdentityServiceProvider()

module.exports.an_authenticated_user = async (user) => {
  console.log("User", user);
  let req = new AWS.CognitoIdentityServiceProvider.AdminDeleteUserCommand({
    UserPoolId: process.env.cognito_user_pool_id,
    Username: user.username
  })
  await cognito.send(req)
  console.log(`[${user.username}] - user is deleted`)
}