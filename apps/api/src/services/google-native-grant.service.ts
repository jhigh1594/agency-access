import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type ServiceError = {
  code: string;
  message: string;
  details?: unknown;
};

type ServiceResult<T> = {
  data: T | null;
  error: ServiceError | null;
};

export type UpsertGoogleNativeGrantInput = {
  accessRequestId: string;
  connectionId: string;
  product: string;
  assetId: string;
  assetName?: string;
  grantMode: string;
  requestedRole?: string;
  recipientEmail?: string;
  managerCustomerId?: string;
  providerResourceName?: string;
  providerExternalId?: string;
  nativeGrantState: string;
  lastAttemptAt?: Date;
  verifiedAt?: Date;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  metadata?: Prisma.InputJsonValue;
};

export type UpdateGoogleNativeGrantStateInput = {
  nativeGrantState: string;
  lastAttemptAt?: Date;
  verifiedAt?: Date;
  providerResourceName?: string;
  providerExternalId?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  metadata?: Prisma.InputJsonValue;
};

async function upsertGrant(
  input: UpsertGoogleNativeGrantInput
): Promise<ServiceResult<any>> {
  try {
    const grant = await prisma.googleNativeGrant.upsert({
      where: {
        connectionId_product_assetId_grantMode: {
          connectionId: input.connectionId,
          product: input.product,
          assetId: input.assetId,
          grantMode: input.grantMode,
        },
      },
      create: {
        accessRequestId: input.accessRequestId,
        connectionId: input.connectionId,
        product: input.product,
        assetId: input.assetId,
        assetName: input.assetName,
        grantMode: input.grantMode,
        requestedRole: input.requestedRole,
        recipientEmail: input.recipientEmail,
        managerCustomerId: input.managerCustomerId,
        providerResourceName: input.providerResourceName,
        providerExternalId: input.providerExternalId,
        nativeGrantState: input.nativeGrantState,
        lastAttemptAt: input.lastAttemptAt,
        verifiedAt: input.verifiedAt,
        lastErrorCode: input.lastErrorCode,
        lastErrorMessage: input.lastErrorMessage,
        metadata: input.metadata,
      },
      update: {
        assetName: input.assetName,
        requestedRole: input.requestedRole,
        recipientEmail: input.recipientEmail,
        managerCustomerId: input.managerCustomerId,
        providerResourceName: input.providerResourceName,
        providerExternalId: input.providerExternalId,
        nativeGrantState: input.nativeGrantState,
        lastAttemptAt: input.lastAttemptAt,
        verifiedAt: input.verifiedAt,
        lastErrorCode: input.lastErrorCode,
        lastErrorMessage: input.lastErrorMessage,
        metadata: input.metadata,
      },
    });

    return { data: grant, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to upsert Google native grant',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

async function listByAccessRequest(accessRequestId: string): Promise<ServiceResult<any[]>> {
  try {
    const grants = await prisma.googleNativeGrant.findMany({
      where: { accessRequestId },
      orderBy: [{ createdAt: 'desc' }],
    });

    return { data: grants, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list Google native grants for access request',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

async function listByConnection(connectionId: string): Promise<ServiceResult<any[]>> {
  try {
    const grants = await prisma.googleNativeGrant.findMany({
      where: { connectionId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return { data: grants, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list Google native grants for connection',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

async function updateGrantState(
  grantId: string,
  input: UpdateGoogleNativeGrantStateInput
): Promise<ServiceResult<any>> {
  try {
    const grant = await prisma.googleNativeGrant.update({
      where: { id: grantId },
      data: {
        nativeGrantState: input.nativeGrantState,
        lastAttemptAt: input.lastAttemptAt,
        verifiedAt: input.verifiedAt,
        providerResourceName: input.providerResourceName,
        providerExternalId: input.providerExternalId,
        lastErrorCode: input.lastErrorCode,
        lastErrorMessage: input.lastErrorMessage,
        metadata: input.metadata,
      },
    });

    return { data: grant, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update Google native grant state',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export const googleNativeGrantService = {
  upsertGrant,
  listByAccessRequest,
  listByConnection,
  updateGrantState,
};
