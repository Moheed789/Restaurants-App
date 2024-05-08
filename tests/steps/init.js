const { promisify } = require('util')
const awscred = require('awscred')
const dotenv = require('dotenv')
dotenv.config({ path: './.env.local' })
dotenv.config()

let initialized = false

const init = async () => {
  if (initialized) {
    return
  }
  
  const { credentials, region } = await promisify(awscred.load)()
  
  process.env.AWS_ACCESS_KEY_ID     = credentials.aws_access_key_id
  process.env.AWS_SECRET_ACCESS_KEY = credentials.aws_secret_access_key
  process.env.AWS_REGION            = 'us-east-1'

  if (credentials.sessionToken) {
    process.env.AWS_SESSION_TOKEN = credentials.sessionToken
  }

  console.log('AWS credential loaded')

  initialized = true
}

module.exports = {
  init
}