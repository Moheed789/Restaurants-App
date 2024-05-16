const { Tracer, captureLambdaHandler } = require('@aws-lambda-powertools/tracer')
const tracer = new Tracer({ serviceName: process.env.serviceName })
const { DynamoDB } = require("@aws-sdk/client-dynamodb")
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb")
const dynamodbClient = new DynamoDB()
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient)
const middy = require('@middy/core')
const { injectLambdaContext } = require('@aws-lambda-powertools/logger')
const ssm = require('@middy/ssm')

const middyCacheEnabled = JSON.parse(process.env.middy_cache_enabled)
const middyCacheExpiry = parseInt(process.env.middy_cache_expiry_milliseconds)

const { serviceName, ssmStage } = process.env
const tableName = process.env.restaurants_table

const findRestaurantsByTheme = async (theme, count) => {
  logger.debug(`finding (up to ${count}) restaurants with the theme ${theme}...`)

  const resp = await dynamodb.send(new ScanCommand({
    TableName: tableName,
    Limit: count,
    FilterExpression: "contains(themes, :theme)",
    ExpressionAttributeValues: { ":theme": theme }
  }))
  logger.debug(`found ${resp.Items.length} restaurants`)
  return resp.Items
}

module.exports.handler = middy(async (event, context) => {
  logger.refreshSampleRateCalculation()
  const req = JSON.parse(event.body)
  const theme = req.theme
  const restaurants = await findRestaurantsByTheme(theme, context.config.defaultResults)
  const response = {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }

  return response
}).use(ssm({
  cache: middyCacheEnabled,
  cacheExpiry: middyCacheExpiry,
  setToContext: true,
  fetchData: {
    config: `/${serviceName}/${ssmStage}/search-restaurants/config`,
    secretString: `/${serviceName}/${ssmStage}/search-restaurants/secretString`
  }
})).use(injectLambdaContext(logger))
.use(captureLambdaHandler(tracer))