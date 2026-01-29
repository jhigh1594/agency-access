import Fastify from 'fastify';

const app = Fastify();

app.patch('/test', {
  schema: {
    body: {
      type: 'object',
      required: ['agencyId', 'businessId'],
      properties: {
        agencyId: {
          type: 'string',
          format: 'uuid',
        },
        businessId: {
          type: 'string',
          pattern: '^\\d{1,20}$',
        },
      },
    },
  },
}, async (request, reply) => {
  return { ok: true };
});

const response = await app.inject({
  method: 'PATCH',
  url: '/test',
  payload: {
    agencyId: 'invalid',
    businessId: 'abc',
  },
});

console.log('Status:', response.statusCode);
console.log('Body:', response.body);
