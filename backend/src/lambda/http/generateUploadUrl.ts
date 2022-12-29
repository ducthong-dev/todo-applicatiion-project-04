import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { getUserId } from '../utils'
import { AttachmentUtils } from '../../dataLayer/attachmentUtils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('generateUrl');
const attachmentUtils = new AttachmentUtils();
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Initializing Generate URL Event', { event });
    const todoId = event.pathParameters.todoId ? event.pathParameters.todoId : ''

    const uploadUrl = await attachmentUtils.createAttachmentPresignedUrl(todoId, getUserId(event))

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        uploadUrl: uploadUrl
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )