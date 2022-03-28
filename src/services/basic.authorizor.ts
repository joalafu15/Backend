// import {repository} from '@loopback/core';
import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata
} from '@loopback/authorization';
import {securityId, UserProfile} from '@loopback/security';
import _ from 'lodash';
import {CandidateAttachmentController, CandidateController} from '../controllers';

export const ROLES = {
  ADMIN: 'admin',
  CANDIDATE: 'candidate',
  COMMITTEE: 'committee',
  OPERATIONS: 'operations'
}

export async function basicAuthorization(
  authorizationCtx: AuthorizationContext,
  metadata: AuthorizationMetadata,
): Promise<AuthorizationDecision> {

  // No access if authorization details are missing
  let currentUser: UserProfile;
  if (authorizationCtx.principals.length > 0) {
    const user = _.pick(authorizationCtx.principals[0], [
      'id',
      'name',
      'roles',
      'candidateId',
      'administrationId',
    ]);
    currentUser = {
      [securityId]: user.id,
      name: user.name,
      roles: user.roles,
      candidateId: user.candidateId,
      administrationId: user.administrationId,
    };
  } else {
    return AuthorizationDecision.DENY;
  }

  if (!currentUser.roles) {
    return AuthorizationDecision.DENY;
  }

  // Authorize everything that does not have a allowedRoles property
  if (!metadata.allowedRoles) {
    return AuthorizationDecision.ALLOW;
  }

  let roleIsAllowed = false;
  for (const role of currentUser.roles) {
    if (metadata.allowedRoles!.includes(role)) {
      roleIsAllowed = true;
      break;
    }
  }

  if (!roleIsAllowed) {
    return AuthorizationDecision.DENY;
  }

  // Admin accounts bypass id verification
  if (currentUser.roles.includes(ROLES.ADMIN)) {
    return AuthorizationDecision.ALLOW;
  }

  // Operations accounts bypass
  if (currentUser.roles.includes(ROLES.OPERATIONS)) {
    switch (authorizationCtx.invocationContext.targetClass.name) {
      case 'AdministrationController':
      case 'JobPositionController':
      case 'CandidateController':
      case 'CandidateAttachmentController':
      case 'CandidateSectorPreferenceController':
      case 'CandidateUserController': {
        return AuthorizationDecision.ALLOW;
      }
    }
  }

  /**
   * Allow access only to model owners, using route as source of truth
   *
   * eg. @put('/users/{userId}', ...) returns `userId` as args[0]
   */
  if (currentUser[securityId] === authorizationCtx.invocationContext.args[0]) {
    return AuthorizationDecision.ALLOW;
  }

  // Candidate Id verification for Candidates users
  if (
    currentUser.roles.includes(ROLES.CANDIDATE) &&
    currentUser.candidateId === authorizationCtx.invocationContext.args[0]
  ) {
    return AuthorizationDecision.ALLOW;
  }

  // Committee verification
  if (currentUser.roles.includes(ROLES.COMMITTEE)) {
    switch (authorizationCtx.invocationContext.targetClass.name) {
      case 'JobPositionController': {
        return AuthorizationDecision.ALLOW;
      }
      case 'AdministrationCandidateController': {
        if (currentUser.administrationId === authorizationCtx.invocationContext.args[0])
          return AuthorizationDecision.ALLOW;
        break;
      }
      case 'CandidateController': {
        if (!authorizationCtx.invocationContext.args[0]) break;
        const {candidateRepository} = authorizationCtx.invocationContext.target as CandidateController;
        const {count} = await candidateRepository.count({
          id: authorizationCtx.invocationContext.args[0],
          administrationId: currentUser.administrationId
        });
        if (count > 0) return AuthorizationDecision.ALLOW;
        break;
      }
      case 'CandidateAttachmentController': {
        if (!authorizationCtx.invocationContext.args[0]) break;
        const {candidateRepository} = authorizationCtx.invocationContext.target as CandidateAttachmentController;
        const {count} = await candidateRepository.count({
          id: authorizationCtx.invocationContext.args[0],
          administrationId: currentUser.administrationId
        });
        if (count > 0) return AuthorizationDecision.ALLOW;
        break;
      }
    }
  }

  return AuthorizationDecision.DENY;
}
