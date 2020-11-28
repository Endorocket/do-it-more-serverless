import { ResponseType } from './responseType';

export interface RespondToFriendInvitationDTO {
  friendUsername: string;
  invitationResponse: ResponseType;
}
