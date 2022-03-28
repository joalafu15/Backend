import {inject} from '@loopback/core';
import {
  get,
  Request,
  response,
  ResponseObject,
  RestBindings
} from '@loopback/rest';

const packageVersion = require("../../package.json").version;

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          environment: {type: 'string'},
          version: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
          headers: {
            type: 'object',
            properties: {
              'Content-Type': {type: 'string'},
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
};

/**
 * A simple controller to bounce back http requests
 */
export class PingController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) { }

  @get('/ping')
  @response(200, PING_RESPONSE)
  ping(): object {
    return {
      environment: process.env.NODE_ENV,
      version: packageVersion,
      date: new Date(),
      url: this.req.url,
      headers: Object.assign({}, this.req.headers),
    };
  }
}
