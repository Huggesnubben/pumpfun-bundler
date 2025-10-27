import { FleekSdk, PersonalAccessTokenService } from '@fleekxyz/sdk';
import dotenv from 'dotenv';
import { CreateTokenMetadata } from './types';

dotenv.config();

const pat = process.env.PAT || '';
const project_id = process.env.PROJECT_ID || '';

const patService = new PersonalAccessTokenService({
  personalAccessToken: pat,
  projectId: project_id,
});

const fleekSdk = new FleekSdk({ accessTokenService: patService });

async function uploadBufferToIPFS(pathName: string, content: Buffer) {
  const result = await fleekSdk.ipfs().add({
    path: pathName,
    content,
  });
  return result;
}

export const uploadMetadataToIPFS = async (
  create: CreateTokenMetadata
): Promise<string> => {
  if (!create.file) {
    throw new Error('CreateTokenMetadata.file is required to upload to IPFS');
  }

  const fileArrayBuffer = await create.file.arrayBuffer();
  const imageBuffer = Buffer.from(fileArrayBuffer);

  const imageUploadResult = await uploadBufferToIPFS(
    create.file instanceof File ? create.file.name : 'image.png',
    imageBuffer
  );

  const metadataJson = {
    name: create.name,
    symbol: create.symbol,
    description: create.description,
    image: `https://cf-ipfs.com/ipfs/${imageUploadResult.cid}`,
    showName: create.showName ?? true,
    createdOn: create.createdOn ?? 'https://pump.fun',
    twitter: create.twitter ?? '',
    telegram: create.telegram ?? '',
    website: create.website ?? '',
  };

  const metadataBuffer = Buffer.from(JSON.stringify(metadataJson), 'utf-8');
  const metadataUploadResult = await uploadBufferToIPFS(
    'metadata.json',
    metadataBuffer
  );

  return `https://cf-ipfs.com/ipfs/${metadataUploadResult.cid}`;
};