import Replicate from 'replicate';

let replicateClient: Replicate | null = null;

export function getReplicateClient(): Replicate {
  const auth = process.env.REPLICATE_API_TOKEN;
  if (!auth) {
    throw new Error(
      'REPLICATE_API_TOKEN is not configured. Please add REPLICATE_API_TOKEN to your .env file to enable video generation.'
    );
  }

  if (!replicateClient) {
    replicateClient = new Replicate({ auth });
  }

  return replicateClient;
}
