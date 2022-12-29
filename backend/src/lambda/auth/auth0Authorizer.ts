import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { JwtPayload } from '../../auth/JwtPayload'
import { createLogger } from '../../utils/logger'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const cert = `-----BEGIN CERTIFICATE-----
MIIDHTCCAgWgAwIBAgIJDr2uQLBVz3PbMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV
BAMTIWRldi1zNmF6aWpjdm1qNW1hMmJzLnVzLmF1dGgwLmNvbTAeFw0yMjEyMjgx
NzAyNTdaFw0zNjA5MDUxNzAyNTdaMCwxKjAoBgNVBAMTIWRldi1zNmF6aWpjdm1q
NW1hMmJzLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAMkt7Gj1VVh+m4T7mX35B5WuQEL9Q6vfAiLrdrIVxWiWdKICxf276RjXADMW
B7tSzUOwFTgngYQHTcSlF3g7ys2+2JECHbKY+oGuFJvMAYGwd5e4W+4jEhHj3fjw
Frae0vQeSo7V46WA1VmwahrzzVe8mM7NHtJTAiuBb7jFV7Qq9hDESisFLoe0OXrb
XjoqhbGH5GM9n+jojph/8aSf+rU/ASpDDfWVlsEXNNotSzreTLZ7S8ivPCbtz7v3
kofeohriGAEKqsBHjo2vM1RtCy5s/+FtiJVFLkqtAnhgDn+sSS93tfkrTWNz4vUW
QAEtj3AdoBob9Iyf7bB1i1jTtJUCAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUVIocx2fiVAC06Murv56+Bv4vAN0wDgYDVR0PAQH/BAQDAgKEMA0G
CSqGSIb3DQEBCwUAA4IBAQBHSQCvV+vQ8z1B4+orz75OOS9sRToqMnLd/Cvovv2L
Og4WL7zrjsHcuMn6DVrC71U7tjNsvfBNqSYbQSNb3x9NolVByTC4KvgFssbAKnUO
2joQnbAglOtRL8VWhuRtR+y+R3z5aB/BFmQvKT3ufvnx1rzypVzkgAY+wYvTdnRM
LbOP6Tf//sP5uhAw4dhBQ1n6049pHSCmfnxlqTmpN+ykz5kkPewSWVYvgaea5mpm
2NSTO6ifIzHtEc1Q51grXmw3zxcooJpdwj1yVKR/MpoBlURvUr43RLb2ccvAL9sW
l1YZGFSgYEg1CouUJtK2pyNRrDm9G6yE2BTxvobm9VTL
-----END CERTIFICATE-----`
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
